const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
};

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    );
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const googleRedirect = (req, res) => {
    const client = getOAuth2Client();
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['email', 'profile'],
        prompt: 'select_account',
    });
    res.redirect(url);
};

const googleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/login?error=google`);

    try {
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data } = await oauth2.userinfo.get();

        const email = data.email;
        if (!email) return res.redirect(`${FRONTEND_URL}/login?error=google`);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const randomPw = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
            user = await prisma.user.create({
                data: {
                    email,
                    first_name: data.given_name || null,
                    last_name:  data.family_name || null,
                    password:   randomPw,
                    role:       'user',
                },
            });
        }

        if (user.is_banned) {
            return res.redirect(`${FRONTEND_URL}/login?error=banned`);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Token dans le cookie httpOnly — plus dans l'URL
        res.cookie('token', token, COOKIE_OPTS);

        const userJson = encodeURIComponent(JSON.stringify({
            id:         user.id,
            email:      user.email,
            role:       user.role,
            first_name: user.first_name,
            last_name:  user.last_name,
        }));

        res.redirect(`${FRONTEND_URL}/auth/callback?user=${userJson}`);
    } catch (err) {
        console.error('[Google OAuth]', err.message);
        res.redirect(`${FRONTEND_URL}/login?error=google`);
    }
};

module.exports = { googleRedirect, googleCallback };
