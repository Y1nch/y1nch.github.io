const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Connection Pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'yinch_db'
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database!');
  connection.release();

  // Create videos table if it doesn't exist
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
      console.error('Error creating videos table:', err);
      return;
    }
    console.log('Videos table checked/created.');
  });
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Videos will be stored in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });

// API Endpoints

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

// Serve uploaded videos (create 'uploads' directory if it doesn't exist)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});