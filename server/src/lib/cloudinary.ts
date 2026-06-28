import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./auth";
import { logger } from "./logger";

/**
 * Configure Cloudinary with environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer, 
  folder: string,
  resourceType: "image" | "raw" | "video" | "auto" = "auto",
  uploadOptions: Record<string, any> = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: any = {
      folder: `edu-sphere/${folder}`,
      resource_type: resourceType,
      ...uploadOptions,
    };

    if (resourceType === "image") {
      options.transformation = [
        { width: 1280, crop: "limit" },
        { quality: 80, fetch_format: "webp" }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error: any, result: any) => {
        if (error) {
          logger.error("Cloudinary upload error:", error);
          return reject(new AppError(`File upload failed: ${error.message}`, 500));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary by its public ID
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    logger.error("Cloudinary deletion error:", error);
    throw new AppError("Failed to delete file from cloud storage", 500);
  }
};
