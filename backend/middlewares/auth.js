const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // 1. On récupère le token dans le header "Authorization"
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
        }

        // 2. On vérifie le token avec ta clé secrète
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // 3. On ajoute les infos du user décodées à la requête pour que les routes puissent l'utiliser
        req.auth = {
            userId: decodedToken.id,
            role: decodedToken.role
        };

        next(); // On passe au middleware suivant ou à la route
    } catch (error) {
        res.status(401).json({ error: "Requête non authentifiée !" });
    }
};