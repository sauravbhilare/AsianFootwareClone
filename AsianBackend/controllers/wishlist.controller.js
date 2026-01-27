// controllers/wishlist.controller.js
import Wishlist from "../model/Wishlist.schema.js";
import Product from "../model/product.schema.js";
import mongoose from "mongoose";

// Helper to compute offer %
const calculateOffer = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

// Helper to validate and convert to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

// POST /api/wishlist/addWishlistItem
export const addWishlistItem = async (req, res) => {
  try {
    const { productId, color, image } = req.body; // ADD image HERE
    const userId = req.userId;

    console.log("Add to wishlist request:", {
      userId,
      productId,
      color,
      image,
    });

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "productId is required" });
    }

    const userObjectId = toObjectId(userId);
    const productObjectId = toObjectId(productId);

    if (!userObjectId || !productObjectId) {
      return res
        .status(400)
        .json({ message: "Invalid userId or productId format" });
    }

    const product = await Product.findById(productObjectId);
    if (!product) {
      console.log("Product not found for ID:", productId);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Found product:", product);

    const mrp = product.mrp || product.oldPrice || product.price || 0;
    const sellingPrice = product.sellingPrice || product.price || 0;
    const title = product.title || product.name || "Untitled";
    const offer = calculateOffer(mrp, sellingPrice);

    // PRIORITY: Use image from request, fallback to product image
    const productImage =
      image ||
      product.images?.[0] ||
      product.image ||
      product.imageUrl ||
      product.thumbnail ||
      null;

    console.log("Final image to save:", productImage);

    const existing = await Wishlist.findOne({
      userId: userObjectId,
      productId: productObjectId,
      color: color || null,
    });

    if (existing) {
      return res
        .status(200)
        .json({ message: "Already in wishlist", item: existing });
    }

    const wishlistItem = await Wishlist.create({
      userId: userObjectId,
      productId: productObjectId,
      title,
      image: productImage, // SAVE IMAGE
      color: color || null,
      mrp,
      sellingPrice,
      offer,
    });

    console.log("Created wishlist item:", wishlistItem);

    return res
      .status(201)
      .json({ message: "Added to wishlist", item: wishlistItem });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// DELETE /api/wishlist/deleteWishlistItem/:productId
export const deleteWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color } = req.body;
    const userId = req.userId;

    console.log("Delete from wishlist request:", { userId, productId, color });

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId and productId are required" });
    }

    const userObjectId = toObjectId(userId);
    const productObjectId = toObjectId(productId);

    if (!userObjectId || !productObjectId) {
      return res
        .status(400)
        .json({ message: "Invalid userId or productId format" });
    }

    const query = {
      userId: userObjectId,
      productId: productObjectId,
    };

    if (color) query.color = color;

    const deletedItem = await Wishlist.findOneAndDelete(query);

    if (!deletedItem) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    return res
      .status(200)
      .json({ message: "Removed from wishlist", item: deletedItem });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// GET /api/wishlist?userId=...
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const userObjectId = toObjectId(userId);
    if (!userObjectId) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const items = await Wishlist.find({ userId: userObjectId }).populate(
      "productId"
    );

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Check if item is in wishlist
export const checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.userId;

    if (!userId || !productId) {
      return res.status(400).json({ isInWishlist: false });
    }

    const userObjectId = toObjectId(userId);
    const productObjectId = toObjectId(productId);

    if (!userObjectId || !productObjectId) {
      return res.status(200).json({ isInWishlist: false });
    }

    const existing = await Wishlist.findOne({
      userId: userObjectId,
      productId: productObjectId,
    });

    return res.status(200).json({ isInWishlist: !!existing });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return res.status(200).json({ isInWishlist: false });
  }
};
