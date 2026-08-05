// src/utils/uploadToCloudinary.js

import cloudinary from '../config/cloudinary.js';

/**
 * Upload a file buffer to Cloudinary

 */
export const uploadToCloudinary = (buffer, folder = 'hms/profile-images') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};