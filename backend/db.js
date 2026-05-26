
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || '127.0.0.1',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'password',
    database: process.env.MYSQLDATABASE || 'yinch_db',
    port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT) : 3306
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
        avatar VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    connection.query(createUsersTable, (err) => {
        if (err) {
            console.error('創建 users 表失敗:', err);
            return;
        }
        console.log('users 表已準備就緒或已存在');

        // 確保 users 表具有 avatar 欄位
        connection.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL", (alterErr) => {
            // 忽略已存在欄位錯誤
        });

        // 自動建立主要管理員帳號 Yinch / bede0221
        const bcrypt = require('bcryptjs');
        const adminUsername = 'Yinch';
        const adminPasswordRaw = 'bede0221';
        
        connection.query('SELECT * FROM users WHERE username = ?', [adminUsername], async (err, results) => {
            if (err) {
                console.error('檢查管理員帳號失敗:', err);
                return;
            }
            if (results.length === 0) {
                try {
                    const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);
                    connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminUsername, hashedPassword, 'admin'], (err) => {
                        if (err) {
                            console.error('建立主要管理員失敗:', err);
                        } else {
                            console.log(`主要管理員 ${adminUsername} 建立成功`);
                        }
                    });
                } catch (hashErr) {
                    console.error('密碼加密失敗:', hashErr);
                }
            } else {
                // 確保現有的 Yinch 帳戶角色一定是 admin
                if (results[0].role !== 'admin') {
                    connection.query('UPDATE users SET role = ? WHERE username = ?', ['admin', adminUsername], (err) => {
                        if (err) console.error('更新主要管理員權限失敗:', err);
                    });
                }
            }
        });
    });
});

module.exports = connection;
