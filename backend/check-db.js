const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: 'maglev.proxy.rlwy.net',
  port: 21763,
  user: 'root',
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});

conn.query('SHOW DATABASES;', (err, dbs) => {
  if (err) return console.error('Erreur:', err.message);
  console.log('Bases de données disponibles:', dbs.map(d => Object.values(d)[0]));

  conn.query('USE ordv_db; SHOW TABLES;', (err2, results) => {
    if (err2) return console.error('Erreur ordv_db:', err2.message);
    console.log('Tables dans ordv_db:', results[1].map(r => Object.values(r)[0]));
    conn.end();
  });
});
