import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are provided in env
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a local buffer or file path to Cloudinary under a specified folder.
 * Returns the secure URL of the uploaded asset.
 * If credentials are not configured, returns a mock URL to ensure system is operational.
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  fileName: string
): Promise<string> => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' || !process.env.CLOUDINARY_API_KEY) {
      console.log(`[Cloudinary Mock] Uploading ${fileName} to folder ${folder}`);
      return `https://res.cloudinary.com/mock-cloud/image/upload/v1234567/${folder}/${fileName}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, public_id: fileName.split('.')[0] },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || '');
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error('Media upload failed.');
  }
};
