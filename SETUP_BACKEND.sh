#!/bin/bash
# 或在 Windows 使用 setup.cmd

# 建立資料夾結構
mkdir -p backend/routes
mkdir -p backend/uploads

echo "✓ Backend 資料夾結構已建立"
echo "下一步："
echo "1. 複製 package.json 到 backend/"
echo "2. 複製 server.js、db.js 到 backend/"
echo "3. 複製 routes/auth.js、routes/videos.js"
echo "4. 複製 .env、.gitignore"
echo "5. cd backend && npm install"
echo "6. npm start"
