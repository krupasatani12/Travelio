const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folderName = '';
    if (req.body.type === 'city' || req.originalUrl.includes('cities')) {
      const city = (req.body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const state = (req.body.state || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      folderName = `${city}_${state}_india_tourism`.replace(/_+/g, '_');
    } else {
      const place = (req.body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const city = (req.body.cityName || req.body.city || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      folderName = `${place}_${city}_india`.replace(/_+/g, '_');
    }
    
    // Fallback if empty
    if (!folderName || folderName === '_india_tourism' || folderName === '_india') {
       folderName = 'misc';
    }

    const uploadPath = path.join(__dirname, '..', 'uploads', 'locations', folderName);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    req.uploadFolderName = folderName; // save for constructing DB urls
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uploadPath = req.uploadFolderName ? path.join(__dirname, '..', 'uploads', 'locations', req.uploadFolderName) : '';
    
    let nextIndex = 1;
    if (uploadPath && fs.existsSync(uploadPath)) {
      const existingFiles = fs.readdirSync(uploadPath).filter(f => f.startsWith('img_'));
      let maxIndex = 0;
      for (const f of existingFiles) {
        const match = f.match(/img_(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIndex) maxIndex = num;
        }
      }
      nextIndex = maxIndex + 1;
    }
    
    if (!req.fileCounter) req.fileCounter = nextIndex;
    else req.fileCounter++;
    
    cb(null, 'img_' + req.fileCounter + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
