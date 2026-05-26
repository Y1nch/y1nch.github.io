
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'yinch_db' // 請替換為您的數據庫名稱
});

connection.connect(err => {
    if (err) {
        console.error('數據庫連接失敗:', err);
        return;
    }
    console.log('成功連接到 MySQL 數據庫');

    // 創建 users 表，如果它不存在的話
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    connection.query(createUsersTable, (err) => {
        if (err) {
            console.error('創建 users 表失敗:', err);
            return;
        }
        console.log('users 表已準備就緒或已存在');
    });
});

module.exports = connection;
