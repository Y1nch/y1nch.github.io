const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Railway 通常會自動分配 PORT（例如 8080），維持 process.env.PORT 非常正確
const port = process.env.PORT || 3000;

// 引入 auth 路由
const authRoutes = require('./auth');
// 引入 db 連線，確保 users 表會被創建
require('./db'); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 使用 auth 路由
app.use('/api/auth', authRoutes);

// 確保 uploads 資料夾在伺服器啟動時一定存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⭕ 這是 Railway 官方最標準的無底線變數讀取方式
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'password',
  database: process.env.MYSQLDATABASE || 'yinch_db',
  port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT) : 3306
});


// 自動檢查並建立資料表
const createTableSql = `
  CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

db.query(createTableSql, (err, result) => {
  if (err) {
    console.error('MySQL 初始檢查失敗（若資料庫仍在啟動中請稍候）：', err.message);
  } else {
    console.log('Connected to MySQL database & Videos table checked/created.');
  }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ===== API Endpoints =====

app.get('/', (req, res) => {
  res.send('🚀 Yinch 後端伺服器成功啟動！');
});

// Upload Video
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  const { title, description } = req.body;
  const filename = req.file.filename;

  const insertSql = 'INSERT INTO videos (title, description, filename) VALUES (?, ?, ?)';
  db.query(insertSql, [title, description, filename], (err, result) => {
    if (err) {
      console.error('Error inserting video into database:', err);
      return res.status(500).json({ message: 'Error uploading video' });
    }
    res.status(201).json({ message: 'Video uploaded successfully', videoId: result.insertId });
  });
});

// Get all videos
app.get('/api/videos', (req, res) => {
  const selectSql = 'SELECT * FROM videos ORDER BY upload_date DESC';
  db.query(selectSql, (err, results) => {
    if (err) {
      console.error('Error fetching videos:', err);
      return res.status(500).json({ message: 'Error fetching videos' });
    }
    res.status(200).json(results);
  });
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 管理員認證中間件
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: '未提供認證 token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'token 無效或已過期' });
    if (decoded.role !== 'admin') return res.status(403).json({ message: '無此操作權限' });
    req.user = decoded;
    next();
  });
};

// 刪除影片 API (需要管理員權限)
app.delete('/api/videos/:id', authenticateAdmin, (req, res) => {
  const videoId = req.params.id;

  // 先找出影片檔名，然後刪除實體檔案
  const selectSql = 'SELECT filename FROM videos WHERE id = ?';
  db.query(selectSql, [videoId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: '資料庫查詢錯誤' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '找不到此影片' });
    }

    const filename = results[0].filename;
    const filePath = path.join(uploadDir, filename);

    // 從資料庫中刪除
    const deleteSql = 'DELETE FROM videos WHERE id = ?';
    db.query(deleteSql, [videoId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: '刪除影片記錄失敗' });
      }

      // 刪除硬碟中的檔案
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('刪除實體檔案失敗:', unlinkErr);
          // 雖然檔案刪除失敗，但資料庫已刪，故仍返回成功
        }
        res.status(200).json({ message: '影片刪除成功' });
      });
    });
  });
});

// Serve uploaded videos
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
