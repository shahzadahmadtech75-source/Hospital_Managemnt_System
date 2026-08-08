import cloudinary from '../config/cloudinary.js';

/**
 * Upload a file buffer to Cloudinary
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  const {
    folder = 'hms/profile-images',
    resourceType = 'image',
    returnFullResult = false,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (returnFullResult) {
            resolve(result);
          } else {
            resolve(result.secure_url);
          }
        }
      }
    );
    uploadStream.end(buffer);
  });
};

