import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

// File filter for images (existing)
const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = allowedExtensions.includes(ext);
  
  if (isMimeTypeValid || isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

// File filter for PDFs (new)
const pdfFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['application/pdf'];
  const allowedExtensions = ['.pdf'];
  
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = allowedExtensions.includes(ext);
  
  if (isMimeTypeValid || isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
  }
};

// Image upload middleware (existing)
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: imageFileFilter
});

// PDF upload middleware (new)
const pdfUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB for PDFs
  },
  fileFilter: pdfFileFilter
});

// Error handler middleware (existing, update message)
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File size too large. Maximum size is 10MB.' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  if (err) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  next();
};

// Middleware instances
export const uploadProfileImage = imageUpload.single('profileImage'); // Existing - unchanged
export const uploadPdf = pdfUpload.single('pdf'); // New - for PDF uploads