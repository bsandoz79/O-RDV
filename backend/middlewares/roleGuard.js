// middleware/roleGuard.js
const checkRole = (roles) => {
    return (req, res, next) => {
        // On suppose que ton middleware 'auth' a ajouté les infos du user dans req.user
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: "Accès refusé : vous n'avez pas les permissions nécessaires." 
            });
        }
        next();
    };
};

module.exports = checkRole;