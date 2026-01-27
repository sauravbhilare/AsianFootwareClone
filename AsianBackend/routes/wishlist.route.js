// routes/wishlist.route.js
import express from "express";
import {
  addWishlistItem,
  deleteWishlistItem,
  getUserWishlist,
  checkWishlistItem,
} from "../controllers/wishlist.controller.js";

const wishlistRouter = express.Router();

import tokenDecoder from "../middlewears/tokenMiddlewears.js";

wishlistRouter.use(tokenDecoder);

// Add to wishlist
wishlistRouter.post("/addWishlistItem", addWishlistItem);

// Delete from wishlist
wishlistRouter.delete("/deleteWishlistItem/:productId", deleteWishlistItem);

// Get user wishlist
wishlistRouter.get("/", getUserWishlist);

// Check if item is in wishlist
wishlistRouter.get("/check", checkWishlistItem);

export default wishlistRouter;
