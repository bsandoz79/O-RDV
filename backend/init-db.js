const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'setup.txt'), 'utf8');

const conn = mysql.createConnection({
  host: 'maglev.proxy.rlwy.net',
  port: 21763,
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'railway',
  multipleStatements: true,
});

conn.query(sql, (err) => {
  if (err) {
    console.error('Erreur:', err.message);
  } else {
    console.log('Base de données initialisée avec succès !');
  }
  conn.end();
});
