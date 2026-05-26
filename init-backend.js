const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const dirs = [
  'backend',
  'backend/routes',
  'backend/uploads'
];

// Create directories
dirs.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  }
});

console.log('\n✓ Backend structure created!');
console.log('\nNext steps:');
console.log('1. Copy backend files to backend/ folder');
console.log('2. cd backend');
console.log('3. npm install');
console.log('4. npm start');
