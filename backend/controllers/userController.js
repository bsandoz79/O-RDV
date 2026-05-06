const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.auth.userId },
            select: { id: true, first_name: true, last_name: true, email: true, phone: true, role: true, profile_picture: true, created_at: true },
        });
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadProfilePicture = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    try {
        await prisma.user.update({ where: { id: req.auth.userId }, data: { profile_picture: imageUrl } });
        res.json({ profile_picture: imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProfile = async (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    if (!email) return res.status(400).json({ error: "L'email est obligatoire." });
    try {
        const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.auth.userId } } });
        if (existing) return res.status(400).json({ error: "Cet email est déjà utilisé." });
        await prisma.user.update({
            where: { id: req.auth.userId },
            data: { first_name: first_name || null, last_name: last_name || null, email, phone: phone || null },
        });
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const changePassword = async (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    if (new_password.length < 6) return res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères." });
    try {
        const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
        const match = await bcrypt.compare(current_password, user.password);
        if (!match) return res.status(401).json({ error: "Mot de passe actuel incorrect." });
        const hashed = await bcrypt.hash(new_password, 10);
        await prisma.user.update({ where: { id: req.auth.userId }, data: { password: hashed } });
        res.json({ message: "Mot de passe modifié avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAppointments = async (req, res) => {
    try {
        if (req.auth.role === 'pro' || req.auth.role === 'admin') {
            const provider = await prisma.provider.findUnique({ where: { user_id: req.auth.userId } });
            if (!provider) return res.json([]);
            const pid = provider.id;

            await prisma.$executeRaw`
                UPDATE appointments a JOIN services s ON a.service_id = s.id
                SET a.status = 'completed'
                WHERE a.provider_id = ${pid}
                  AND a.status NOT IN ('cancelled', 'cancelled_by_pro', 'completed')
                  AND DATE_ADD(a.appointment_date, INTERVAL s.duration MINUTE) <= NOW()`;

            await prisma.$executeRaw`
                UPDATE appointments SET status = 'confirmed'
                WHERE provider_id = ${pid} AND status = 'pending'
                  AND appointment_date > NOW()
                  AND appointment_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`;

            const weekOnly = req.query.week === '1';
            let rows;
            if (weekOnly) {
                rows = await prisma.$queryRaw`
                    SELECT a.id, a.appointment_date, a.status,
                           s.label AS service_label, s.duration, s.price,
                           u.first_name AS client_first_name, u.last_name AS client_last_name,
                           u.email AS client_email, u.phone AS client_phone,
                           u.profile_picture AS client_profile_picture
                    FROM appointments a
                    JOIN services s ON a.service_id = s.id
                    JOIN users u ON a.client_id = u.id
                    WHERE a.provider_id = ${pid}
                      AND YEARWEEK(a.appointment_date, 1) = YEARWEEK(NOW(), 1)
                    ORDER BY a.appointment_date ASC`;
            } else {
                rows = await prisma.$queryRaw`
                    SELECT a.id, a.appointment_date, a.status,
                           s.label AS service_label, s.duration, s.price,
                           u.first_name AS client_first_name, u.last_name AS client_last_name,
                           u.email AS client_email, u.phone AS client_phone,
                           u.profile_picture AS client_profile_picture
                    FROM appointments a
                    JOIN services s ON a.service_id = s.id
                    JOIN users u ON a.client_id = u.id
                    WHERE a.provider_id = ${pid}
                    ORDER BY a.appointment_date ASC`;
            }
            return res.json(rows);
        }

        const rows = await prisma.$queryRaw`
            SELECT a.id, a.appointment_date, a.status, a.refusal_reason, a.is_read,
                   s.label AS service_label, s.duration, s.price,
                   p.name AS provider_name, p.city AS provider_city, p.image_url AS provider_image
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN providers p ON a.provider_id = p.id
            WHERE a.client_id = ${req.auth.userId}
            ORDER BY a.appointment_date ASC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const refuseAppointment = async (req, res) => {
    if (req.auth.role !== 'pro' && req.auth.role !== 'admin')
        return res.status(403).json({ error: "Accès refusé." });
    try {
        const provider = await prisma.provider.findUnique({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable.' });
        const appt = await prisma.appointment.findFirst({ where: { id: Number(req.params.id), provider_id: provider.id } });
        if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
        if (['cancelled', 'cancelled_by_pro', 'completed'].includes(appt.status))
            return res.status(400).json({ error: 'Ce rendez-vous ne peut plus être refusé.' });
        if (new Date(appt.appointment_date) < new Date())
            return res.status(400).json({ error: "Impossible de refuser un rendez-vous passé." });
        const { reason, release } = req.body;
        await prisma.appointment.update({
            where: { id: appt.id },
            data: { status: 'cancelled_by_pro', refusal_reason: reason || null, is_slot_released: !!release, is_read: false },
        });
        res.json({ message: 'Rendez-vous refusé.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const appt = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } });
        if (!appt) return res.status(404).json({ error: "Rendez-vous introuvable." });
        if (req.auth.role !== 'admin' && appt.client_id !== req.auth.userId)
            return res.status(403).json({ error: "Accès refusé." });
        if (appt.status === 'cancelled') return res.status(400).json({ error: "Déjà annulé." });
        if (new Date(appt.appointment_date) < new Date()) return res.status(400).json({ error: "Impossible d'annuler un rendez-vous passé." });
        await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'cancelled' } });
        res.json({ message: "Rendez-vous annulé avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const provider = await prisma.provider.findUnique({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });
        const pid = provider.id;

        const [newClients] = await prisma.$queryRaw`
            SELECT COUNT(*) AS new_clients FROM (
                SELECT client_id FROM appointments WHERE provider_id = ${pid}
                GROUP BY client_id
                HAVING MONTH(MIN(appointment_date)) = MONTH(NOW()) AND YEAR(MIN(appointment_date)) = YEAR(NOW())
            ) AS ft`;

        const [upcoming] = await prisma.$queryRaw`
            SELECT COUNT(*) AS upcoming_7d FROM appointments
            WHERE provider_id = ${pid} AND appointment_date >= NOW()
              AND appointment_date < DATE_ADD(NOW(), INTERVAL 7 DAY)
              AND status NOT IN ('cancelled', 'cancelled_by_pro')`;

        const [ca] = await prisma.$queryRaw`
            SELECT COALESCE(SUM(s.price), 0) AS ca_previsionnel
            FROM appointments a JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ${pid}
              AND MONTH(a.appointment_date) = MONTH(NOW()) AND YEAR(a.appointment_date) = YEAR(NOW())
              AND a.status NOT IN ('cancelled', 'cancelled_by_pro')`;

        const [booked] = await prisma.$queryRaw`
            SELECT COALESCE(SUM(s.duration), 0) AS booked_minutes
            FROM appointments a JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ${pid}
              AND YEARWEEK(a.appointment_date, 1) = YEARWEEK(NOW(), 1)
              AND a.status NOT IN ('cancelled', 'cancelled_by_pro')`;

        const hours = await prisma.businessHour.findMany({ where: { provider_id: pid } });
        let totalMinutes = 0;
        hours.forEach(h => {
            if (h.is_closed) return;
            const fmt = v => { const s = String(v||'').substring(0,5); const [hh=0,mm=0]=s.split(':').map(Number); return hh*60+mm; };
            const o = fmt(h.open_time), c = fmt(h.close_time);
            const ec = (o===0&&c===0)?1440:c;
            if (ec>o) totalMinutes += ec-o;
        });

        const occupation_rate = totalMinutes > 0 ? Math.min(100, Math.round((Number(booked.booked_minutes)/totalMinutes)*100)) : 0;
        res.json({ new_clients: Number(newClients.new_clients), upcoming_7d: Number(upcoming.upcoming_7d), ca_previsionnel: Number(ca.ca_previsionnel), occupation_rate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const markAppointmentRead = async (req, res) => {
    try {
        await prisma.appointment.updateMany({
            where: { id: Number(req.params.id), client_id: req.auth.userId },
            data: { is_read: true },
        });
        res.json({ message: 'Notification marquée comme lue.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getNewClients = async (req, res) => {
    try {
        const provider = await prisma.provider.findUnique({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });
        const rows = await prisma.$queryRaw`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture,
                   MIN(a.created_at) AS first_booking_date
            FROM appointments a JOIN users u ON a.client_id = u.id
            WHERE a.provider_id = ${provider.id}
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture
            HAVING MONTH(MIN(a.created_at)) = MONTH(NOW()) AND YEAR(MIN(a.created_at)) = YEAR(NOW())
            ORDER BY first_booking_date DESC LIMIT 10`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getMe, uploadProfilePicture, updateProfile, changePassword, getAppointments, refuseAppointment, cancelAppointment, getDashboardStats, markAppointmentRead, getNewClients };
