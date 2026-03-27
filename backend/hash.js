/*Fichier pour creer un hash pour le mdp Admin */

const bcrypt = require('bcrypt');
bcrypt.hash('admin', 10).then(hash => console.log("Ton hash : ", hash));