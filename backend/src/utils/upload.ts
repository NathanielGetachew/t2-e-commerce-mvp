import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config/env';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 't2-ecommerce/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    } as any, // Cast to any because of potential type mismatches in different versions
});

// Create multer upload instance
export const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSize, // 5MB default
    },
});

/**
 * Get public URL for uploaded file
 * With Cloudinary, the URL is stored directly in the database, 
 * but this helper can return the URL from the file object.
 */
export function getFileUrl(file: any): string {
    return file.path || file.url;
}

/**
 * Delete uploaded file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
    }
}
