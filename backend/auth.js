
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('./db'); // 確保db.js文件存在並正確導出連接

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // 從環境變量獲取或使用默認值

// 註冊路由
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // 檢查密碼長度
    if (password.length < 8) { // 密碼至少8個字元
        return res.status(400).send('密碼長度至少需要8個字元');
    }

    try {
        // 檢查用戶是否已存在
        connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                return res.status(400).send('用戶名已存在');
            }

            // 加密密碼
            const hashedPassword = await bcrypt.hash(password, 10);

            // 儲存用戶到數據庫
            connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user'], (err, result) => {
                if (err) throw err;
                res.status(201).send('用戶註冊成功');
            });
        });
    } catch (error) {
        console.error('註冊失敗:', error);
        res.status(500).send('伺服器錯誤');
    }
});

// 登入路由
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 查找用戶
        connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) throw err;
            if (results.length === 0) {
                return res.status(400).send('用戶名或密碼不正確');
            }

            const user = results[0];

            // 比較密碼
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).send('用戶名或密碼不正確');
            }

            // 生成JWT
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        });
    } catch (error) {
        console.error('登入失敗:', error);
        res.status(500).send('伺服器錯誤');
    }
});

// 創建管理員帳戶 (僅用於初始化，應只運行一次)
router.post('/create-admin', async (req, res) => {
    const { username, password } = req.body;

    // 檢查密碼長度
    if (password.length < 8) { // 密碼至少8個字元
        return res.status(400).send('密碼長度至少需要8個字元');
    }

    try {
        connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                return res.status(400).send('管理員帳戶已存在');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'admin'], (err, result) => {
                if (err) throw err;
                res.status(201).send('管理員帳戶創建成功');
            });
        });
    } catch (error) {
        console.error('創建管理員失敗:', error);
        res.status(500).send('伺服器錯誤');
    }
});

module.exports = router;
