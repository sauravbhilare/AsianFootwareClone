import { Router } from "express";
import upload from "../middlewears/multerConfig.js";
import {
  UploadProductImages,
  UploadBannerImage,
  UploadCategoryImage,
  UploadUserProfileImage,
  DeleteImage,
  BulkDeleteImages,
  GetImageInfo,
  GetImagesByType,
  GetStorageStats,
} from "../controllers/adminUpload.controllers.js";
import tokenDecoder, {
  authorizeAdmin,
} from "../middlewears/tokenMiddlewears.js";

const adminUploadRoute = Router();

// Apply authentication and admin authorization to all routes
adminUploadRoute.use(tokenDecoder);
adminUploadRoute.use(authorizeAdmin);

// ==================== UPLOAD ROUTES ====================

// Upload product images (multiple)
adminUploadRoute.post(
  "/products/images",
  upload.array("images", 10),
  UploadProductImages
);

// Upload banner image (single)
adminUploadRoute.post(
  "/banners/image",
  upload.single("image"),
  UploadBannerImage
);

// Upload category image (single)
adminUploadRoute.post(
  "/categories/image",
  upload.single("image"),
  UploadCategoryImage
);

// Upload user profile image (single)
adminUploadRoute.post(
  "/users/profile-image",
  upload.single("image"),
  UploadUserProfileImage
);

// ==================== DELETE ROUTES ====================

// Delete single image
adminUploadRoute.delete("/images/:type/:filename", DeleteImage);

// Bulk delete images
adminUploadRoute.post("/images/bulk-delete", BulkDeleteImages);

// ==================== INFO & STATS ROUTES ====================

// Get image info
adminUploadRoute.get("/images/:type/:filename/info", GetImageInfo);

// Get all images by type
adminUploadRoute.get("/images/:type", GetImagesByType);

// Get storage statistics
adminUploadRoute.get("/storage/stats", GetStorageStats);

// ==================== ERROR HANDLER ====================
adminUploadRoute.use((error, req, res, next) => {
  console.error("Upload middleware error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum size is 5MB per file.",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files. Maximum is 10 files.",
    });
  }

  if (error.message && error.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Error uploading file",
  });
});

export default adminUploadRoute;
