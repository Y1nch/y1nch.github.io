
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 頭像檔案上傳設定
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

// 管理員認證中間件
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send('未提供認證 token');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('token 無效或已過期');
        }
        if (decoded.role !== 'admin') {
            return res.status(403).send('無此操作權限，需要管理員身份');
        }
        req.user = decoded;
        next();
    });
};

// 取得所有用戶 (需要管理員權限)
router.get('/users', authenticateAdmin, (req, res) => {
    connection.query('SELECT id, username, role, created_at FROM users', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('資料庫查詢錯誤');
        }
        res.json(results);
    });
});

// 更新用戶角色 (需要管理員權限)
router.put('/users/:id/role', authenticateAdmin, (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).send('無效的角色類型');
    }

    connection.query('UPDATE users SET role = ? WHERE id = ?', [role, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('更新失敗');
        }
        res.send('使用者權限更新成功');
    });
});

// 取得當前使用者 Profile (需要登入)
router.get('/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send('未提供認證 token');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('token 無效或已過期');
        
        connection.query('SELECT username, role, avatar FROM users WHERE id = ?', [decoded.id], (dbErr, results) => {
            if (dbErr || results.length === 0) {
                return res.status(504).send('資料庫查詢失敗或用戶不存在');
            }
            res.json(results[0]);
        });
    });
});

// 上傳並更新頭像 (需要登入)
router.post('/avatar', upload.single('avatar'), (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send('未提供認證 token');
    if (!req.file) return res.status(400).send('未選擇頭像檔案');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('token 無效或已過期');
        
        const avatarFilename = req.file.filename;

        connection.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarFilename, decoded.id], (dbErr) => {
            if (dbErr) {
                console.error(dbErr);
                return res.status(500).send('更新頭像失敗');
            }
            res.json({ message: '頭像更新成功', avatar: avatarFilename });
        });
    });
});

module.exports = router;
