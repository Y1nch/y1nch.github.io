const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Railway 通常會自動分配 PORT（例如 8080），維持 process.env.PORT 非常正確
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 確保 uploads 資料夾在伺服器啟動時一定存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⭕ 同時支援有底線與無底線的 Railway 環境變數，防護力點滿！
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST || process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'yinch_db',
  port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306
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

// Serve uploaded videos
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
