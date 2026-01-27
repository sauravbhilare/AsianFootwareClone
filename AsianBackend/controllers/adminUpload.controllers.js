// controllers/adminUpload.controllers.js
import fs from "fs";
import path from "path";

// ==================== PRODUCT IMAGES UPLOAD ====================
export const UploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const imageUrls = req.files.map((file) => file.path);

    console.log(`✅ Uploaded ${req.files.length} product images`);

    return res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      imageUrls,
      count: req.files.length,
    });
  } catch (error) {
    console.error("Product upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading product images",
      error: error.message,
    });
  }
};

// ==================== BANNER IMAGE UPLOAD ====================
export const UploadBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const imageUrl = req.file.path;

    console.log(`✅ Uploaded banner image: ${req.file.filename}`);

    return res.status(200).json({
      success: true,
      message: "Banner image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading banner image",
      error: error.message,
    });
  }
};

// ==================== CATEGORY IMAGE UPLOAD ====================
export const UploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const imageUrl = req.file.path;

    console.log(`✅ Uploaded category image: ${req.file.filename}`);

    return res.status(200).json({
      success: true,
      message: "Category image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Category upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading category image",
      error: error.message,
    });
  }
};

// ==================== USER PROFILE IMAGE UPLOAD ====================
export const UploadUserProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const imageUrl = req.file.path;

    console.log(`✅ Uploaded user profile image: ${req.file.filename}`);

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("User image upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading profile image",
      error: error.message,
    });
  }
};

// ==================== DELETE IMAGE ====================
export const DeleteImage = async (req, res) => {
  try {
    const { type, filename } = req.params;

    // Validate type
    const validTypes = ["products", "banners", "categories", "users"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid image type. Must be: products, banners, categories, or users",
      });
    }

    const filePath = path.join(process.cwd(), `uploads/${type}/${filename}`);

    // Security check - ensure file is in uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log(`🗑️ Deleted ${type} image: ${filename}`);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message,
    });
  }
};

// ==================== GET IMAGE INFO ====================
export const GetImageInfo = async (req, res) => {
  try {
    const { type, filename } = req.params;

    const validTypes = ["products", "banners", "categories", "users"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    const filePath = path.join(process.cwd(), `uploads/${type}/${filename}`);

    // Security check
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const stats = fs.statSync(filePath);
    const protocol =
      process.env.NODE_ENV === "production" ? "https" : req.protocol;
    const host = req.get("host");

    return res.status(200).json({
      success: true,
      image: {
        filename,
        type,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        url: `${protocol}://${host}/uploads/${type}/${filename}`,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
    });
  } catch (error) {
    console.error("Get image info error:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting image info",
      error: error.message,
    });
  }
};

// ==================== BULK DELETE IMAGES ====================
export const BulkDeleteImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of { type, filename }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided",
      });
    }

    const validTypes = ["products", "banners", "categories", "users"];
    const deleted = [];
    const failed = [];

    for (const image of images) {
      const { type, filename } = image;

      if (!validTypes.includes(type)) {
        failed.push({ ...image, reason: "Invalid type" });
        continue;
      }

      const filePath = path.join(process.cwd(), `uploads/${type}/${filename}`);

      // Security check
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!filePath.startsWith(uploadsDir)) {
        failed.push({ ...image, reason: "Access denied" });
        continue;
      }

      if (!fs.existsSync(filePath)) {
        failed.push({ ...image, reason: "File not found" });
        continue;
      }

      try {
        fs.unlinkSync(filePath);
        deleted.push(image);
        console.log(`🗑️ Deleted ${type} image: ${filename}`);
      } catch (err) {
        failed.push({ ...image, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Deleted ${deleted.length} image(s)`,
      deleted,
      failed,
      summary: {
        total: images.length,
        deleted: deleted.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting images",
      error: error.message,
    });
  }
};

// ==================== GET ALL IMAGES BY TYPE ====================
export const GetImagesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const validTypes = ["products", "banners", "categories", "users"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    const dirPath = path.join(process.cwd(), `uploads/${type}`);

    if (!fs.existsSync(dirPath)) {
      return res.status(200).json({
        success: true,
        images: [],
        total: 0,
      });
    }

    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
    });

    const protocol =
      process.env.NODE_ENV === "production" ? "https" : req.protocol;
    const host = req.get("host");

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedFiles = imageFiles.slice(skip, skip + parseInt(limit));

    const images = paginatedFiles.map((filename) => {
      const filePath = path.join(dirPath, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        type,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        url: `${protocol}://${host}/uploads/${type}/${filename}`,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    });

    return res.status(200).json({
      success: true,
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: imageFiles.length,
        pages: Math.ceil(imageFiles.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get images error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
};

// ==================== GET STORAGE STATS ====================
export const GetStorageStats = async (req, res) => {
  try {
    const types = ["products", "banners", "categories", "users"];
    const stats = {};

    for (const type of types) {
      const dirPath = path.join(process.cwd(), `uploads/${type}`);

      if (!fs.existsSync(dirPath)) {
        stats[type] = {
          count: 0,
          totalSize: 0,
          totalSizeFormatted: "0 KB",
        };
        continue;
      }

      const files = fs.readdirSync(dirPath);
      let totalSize = 0;

      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);
        totalSize += fileStats.size;
      });

      stats[type] = {
        count: files.length,
        totalSize,
        totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      };
    }

    const totalSize = Object.values(stats).reduce(
      (sum, stat) => sum + stat.totalSize,
      0
    );
    const totalCount = Object.values(stats).reduce(
      (sum, stat) => sum + stat.count,
      0
    );

    return res.status(200).json({
      success: true,
      stats,
      summary: {
        totalFiles: totalCount,
        totalSize,
        totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      },
    });
  } catch (error) {
    console.error("Get storage stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching storage stats",
      error: error.message,
    });
  }
};
