const db = require('./db');

const SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name  VARCHAR(100) DEFAULT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'pro', 'admin') DEFAULT 'user',
    phone VARCHAR(20) DEFAULT NULL,
    profile_picture VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL DEFAULT 'Store'
);

CREATE TABLE IF NOT EXISTS providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    category_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    zip_code VARCHAR(10),
    city VARCHAR(100),
    description TEXT,
    phone VARCHAR(20),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS business_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed TINYINT(1) DEFAULT 0,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL DEFAULT 30,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'cancelled_by_pro', 'completed') DEFAULT 'pending',
    refusal_reason TEXT DEFAULT NULL,
    is_slot_released TINYINT(1) DEFAULT 0,
    is_read TINYINT(1) DEFAULT 1,
    phone VARCHAR(20) DEFAULT NULL,
    send_sms_reminder TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

INSERT IGNORE INTO categories (name, icon) VALUES
    ('Coiffeur',        'Scissors'),
    ('Barbier',         'Zap'),
    ('Institut beauté', 'Sparkles'),
    ('Tatoueur',        'Palette'),
    ('Nail Art',        'Heart'),
    ('Spa & Bien-être', 'Smile');

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fav (user_id, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    appointment_id INT NOT NULL UNIQUE,
    rating TINYINT NOT NULL,
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
`;

async function migrate() {
    const stmts = SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of stmts) {
        await db.query(stmt);
    }
    console.log('✅ Base de données initialisée automatiquement.');
}

module.exports = migrate;
