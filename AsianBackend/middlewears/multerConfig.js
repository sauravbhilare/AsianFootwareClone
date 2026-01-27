import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on route or field name
    let folderName = "asian-footwear/others";
    
    if (file.fieldname === "banner" || req.baseUrl.includes("banners")) {
      folderName = "asian-footwear/banners";
    } else if (file.fieldname === "product" || req.baseUrl.includes("products")) {
      folderName = "asian-footwear/products";
    } else if (file.fieldname === "category") {
      folderName = "asian-footwear/categories";
    }

    return {
      folder: folderName,
      allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
      resource_type: "auto",
    };
  },
});

// File filter (Optional as CloudinaryStorage handles formats, but good for fail-fast)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

export default upload;
