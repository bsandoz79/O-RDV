const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Route d'inscription
router.post('/register', async (req, res) => {
    // ... copie-colle ici le contenu de ta route app.post('/api/register') ...
    // Note : remplace "app.post" par "router.post" et le chemin devient juste '/register'
});

// Route de connexion
router.post('/login', async (req, res) => {
    // ... copie-colle ici le contenu de ta route app.post('/api/login') ...
    // Note : remplace "app.post" par "router.post" et le chemin devient juste '/login'
});

module.exports = router;