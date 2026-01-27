// model/product.schema.js
import mongoose, { Schema } from "mongoose";

const SizeVariantSchema = new Schema({
  size: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  priceOverride: { type: Number, default: null },
});

const ColorVariantSchema = new Schema({
  colorName: { type: String, required: true },
  hexCode: { type: String, required: true },
  images: [{ type: String, required: true }],
  sizes: [SizeVariantSchema],
});

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },

    category: { type: String, required: true },
    subCategory: { type: String },
    gender: { type: String, enum: ["Men", "Women", "Unisex", "Kids"] },

    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },

    specifications: {
      upperMaterial: { type: String },
      soleMaterial: { type: String },
      insole: { type: String },
      closure: { type: String },
    },

    variants: [ColorVariantSchema],

    tags: {
      type: [String],
      enum: ["new-arrival", "best-seller", "featured", "trending"],
      default: [],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    isDeleted: { type: Boolean, default: false, select: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", description: "text" });
ProductSchema.index({ seller: 1, isDeleted: 1, isArchived: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ tags: 1 });

const Product = mongoose.model("Product", ProductSchema);

export default Product;
