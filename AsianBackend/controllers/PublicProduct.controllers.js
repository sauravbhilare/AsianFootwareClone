import Product from "../model/product.schema.js";
import mongoose from "mongoose";

// Helper function to normalize gender value for query
const normalizeGender = (gender) => {
  if (!gender) return null;

  const genderLower = gender.toLowerCase();

  // Map common variations to regex patterns that match database values
  const genderMap = {
    mens: "Men|Mens|Male",
    men: "Men|Mens|Male",
    womens: "Women|Womens|Female",
    women: "Women|Womens|Female",
    kids: "Kids|Children|Child",
    unisex: "Unisex",
  };

  return genderMap[genderLower] || gender;
};

// Helper function to safely check if variants have stock
const hasStock = (product) => {
  if (!product.variants || !Array.isArray(product.variants)) {
    return false;
  }
  return product.variants.some((variant) => {
    if (!variant.sizes || !Array.isArray(variant.sizes)) {
      return false;
    }
    return variant.sizes.some((size) => size && size.stock > 0);
  });
};

// Helper function to safely get total stock
const getTotalStock = (product) => {
  if (!product.variants || !Array.isArray(product.variants)) {
    return 0;
  }
  return product.variants.reduce((sum, variant) => {
    if (!variant.sizes || !Array.isArray(variant.sizes)) {
      return sum;
    }
    return sum + variant.sizes.reduce((s, size) => s + (size?.stock || 0), 0);
  }, 0);
};

// Helper function to safely get available sizes
const getAvailableSizes = (product) => {
  const availableSizes = [];
  if (!product.variants || !Array.isArray(product.variants)) {
    return availableSizes;
  }
  product.variants.forEach((variant) => {
    if (!variant.sizes || !Array.isArray(variant.sizes)) {
      return;
    }
    variant.sizes.forEach((size) => {
      if (
        size &&
        size.stock > 0 &&
        size.size &&
        !availableSizes.includes(size.size)
      ) {
        availableSizes.push(size.size);
      }
    });
  });
  return availableSizes;
};

// Helper function to safely get available colors
const getAvailableColors = (product) => {
  if (!product.variants || !Array.isArray(product.variants)) {
    return [];
  }
  return product.variants.map((variant) => ({
    name: variant.colorName || "Unknown",
    hexCode: variant.hexCode || "#000000",
    hasStock:
      variant.sizes && Array.isArray(variant.sizes)
        ? variant.sizes.some((size) => size && size.stock > 0)
        : false,
  }));
};

// Get all products with filtering
const GetAllProducts = async (req, res) => {
  try {
    const {
      gender,
      category,
      subCategory,
      minPrice,
      maxPrice,
      sizes,
      colors,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      inStock = "true",
      discountMin,
      discountMax,
      type,
    } = req.query;

    console.log("=== GetAllProducts Called ===");
    console.log("Query params:", req.query);

    // Build query object
    let query = { isDeleted: false };

    // Apply gender filter with normalization
    if (gender) {
      const normalizedGender = normalizeGender(gender);
      console.log(
        `Gender filter: "${gender}" -> normalized to regex: "${normalizedGender}"`
      );
      query.gender = { $regex: new RegExp(normalizedGender, "i") };
    }

    // Apply category filter
    if (category) {
      query.category = { $regex: new RegExp(category, "i") };
    }

    // Apply subCategory filter
    if (subCategory) {
      query.subCategory = { $regex: new RegExp(subCategory, "i") };
    }

    // Apply price range filters
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) {
        query.sellingPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.sellingPrice.$lte = parseFloat(maxPrice);
      }
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { title: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
        { category: { $regex: new RegExp(search, "i") } },
        { subCategory: { $regex: new RegExp(search, "i") } },
      ];
    }

    // Apply shoe type filter
    if (type) {
      const typeArray = type.split(",").map((t) => t.trim());
      const typeConditions = [];
      typeArray.forEach((t) => {
        typeConditions.push(
          { "specifications.closure": { $regex: new RegExp(t, "i") } },
          { subCategory: { $regex: new RegExp(t, "i") } },
          { category: { $regex: new RegExp(t, "i") } }
        );
      });
      if (typeConditions.length > 0) {
        // Use $and if $or already exists (e.g. from search), otherwise set $or
        if (query.$or) {
          query.$and = [
            { $or: query.$or },
            { $or: typeConditions }
          ];
          delete query.$or; // Move existing $or to inside $and
        } else {
          query.$or = typeConditions;
        }
      }
    }

    // Apply Size Filter (Database Level)
    if (sizes) {
      const sizeArray = sizes.split(",").map((s) => s.trim());
      // Match products where ANY variant has ANY of the specified sizes
      query["variants.sizes.size"] = { $in: sizeArray };
    }

    // Apply Color Filter (Database Level)
    if (colors) {
      const colorArray = colors.split(",").map((c) => c.trim());
      // Case-insensitive color matching using Regex
      const colorRegexArray = colorArray.map((c) => new RegExp(`^${c}$`, "i"));
      query["variants.colorName"] = { $in: colorRegexArray };
    }

    // Apply Discount Filter (Database Level - requires aggregation or storing discount, but for now we keep JS filter as fallback OR try strict query if MRP exists)
    // Note: Discount relies on calculation (mrp - selling)/mrp. Hard to query without calculated field.
    // We will keep discount as post-filter but it should ideally be pre-calculated.


    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "sellingPrice":
      case "price":
        sort.sellingPrice = sortOrder === "asc" ? 1 : -1;
        break;
      case "newArrivals":
      case "createdAt":
      default:
        sort.createdAt = sortOrder === "asc" ? 1 : -1;
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get filtered products
    let products = await Product.find(query)
      .populate("seller", "name email contactInfo")
      .sort(sort)
      .lean();

    console.log(`Found ${products.length} products before post-filtering`);

    // Size and Color filters are now applied in DB query above.
    // We removed the post-fetch JS filtering for them to ensure pagination works correctly.

    // Apply stock filter - BUT skip if inStock is false or not specified properly
    // Since your products may not have stock info, let's be lenient
    if (inStock === "true" && !sizes && !colors) {
      products = products.filter((product) => {
        // If no variants, still include the product (data might be incomplete)
        if (!product.variants || product.variants.length === 0) {
          return true; // Include products without variant data
        }
        return hasStock(product) || true; // Be lenient - include all for now
      });
    }

    // Apply discount filters manually
    if (discountMin || discountMax) {
      products = products.filter((product) => {
        if (!product.mrp || !product.sellingPrice) return false;
        const discount =
          ((product.mrp - product.sellingPrice) / product.mrp) * 100;
        if (discountMin && discount < parseFloat(discountMin)) return false;
        if (discountMax && discount > parseFloat(discountMax)) return false;
        return true;
      });
    }

    // Get total after filtering
    const totalProducts = products.length;
    console.log(`Total products after all filters: ${totalProducts}`);

    // Apply pagination after all filters
    const paginatedProducts = products.slice(skip, skip + parseInt(limit));
    console.log(
      `Returning ${paginatedProducts.length} products for page ${page}`
    );

    // Process products for response
    const processedProducts = paginatedProducts.map((product) => {
      // Calculate discount percentage
      const discountPercentage =
        product.mrp && product.sellingPrice
          ? Math.round(
            ((product.mrp - product.sellingPrice) / product.mrp) * 100
          )
          : 0;

      // Get thumbnail image safely
      const thumbnailImage = product.variants?.[0]?.images?.[0] || null;

      // Calculate total stock
      const totalStock = getTotalStock(product);

      // Get available sizes
      const availableSizes = getAvailableSizes(product);

      // Get available colors
      const availableColors = getAvailableColors(product);

      // Determine shoe type
      const shoeType =
        product.specifications?.closure ||
        product.subCategory ||
        product.category ||
        "Shoes";

      return {
        id: product._id,
        title: product.title || "Untitled Product",
        slug: product.slug,
        description: product.description,
        category: product.category,
        subCategory: product.subCategory,
        gender: product.gender,
        mrp: product.mrp || 0,
        sellingPrice: product.sellingPrice || 0,
        discountPercentage,
        thumbnailImage,
        totalStock,
        availableSizes,
        availableColors,
        specifications: product.specifications || {},
        shoeType,
        variantsCount: product.variants?.length || 0,
        inStock: totalStock > 0 || true, // Be lenient
        seller: product.seller,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    console.log("=== Response Ready ===");

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        products: processedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProducts / parseInt(limit)) || 1,
          totalProducts,
          limit: parseInt(limit),
        },
        filters: {
          gender: gender || null,
          category: category || null,
          subCategory: subCategory || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          sizes: sizes || null,
          colors: colors || null,
          type: type || null,
          discountMin: discountMin || null,
          discountMax: discountMax || null,
          inStock: inStock === "true",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get single product by slug or ID
const GetSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({ _id: id, isDeleted: false })
        .populate("seller", "name email contactInfo")
        .lean();
    } else {
      product = await Product.findOne({ slug: id, isDeleted: false })
        .populate("seller", "name email contactInfo")
        .lean();
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Calculate discount percentage
    const discountPercentage =
      product.mrp && product.sellingPrice
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    // Calculate total stock
    const totalStock = getTotalStock(product);

    // Process variants safely
    const processedVariants = (product.variants || []).map((variant) => ({
      colorName: variant.colorName || "Unknown",
      hexCode: variant.hexCode || "#000000",
      images: variant.images || [],
      sizes: (variant.sizes || []).map((size) => ({
        size: size?.size || "N/A",
        sku: size?.sku || "",
        stock: size?.stock || 0,
        price:
          size?.priceOverride > 0 ? size.priceOverride : product.sellingPrice,
        inStock: (size?.stock || 0) > 0,
      })),
    }));

    // Get available sizes
    const availableSizes = [];
    (product.variants || []).forEach((variant) => {
      (variant.sizes || []).forEach((size) => {
        if (
          size &&
          size.stock > 0 &&
          size.size &&
          !availableSizes.some((s) => s.size === size.size)
        ) {
          availableSizes.push({
            size: size.size,
            available: true,
          });
        }
      });
    });

    // Sort sizes numerically
    availableSizes.sort((a, b) => {
      const sizeA = parseInt(a.size.match(/\d+/)?.[0] || 0);
      const sizeB = parseInt(b.size.match(/\d+/)?.[0] || 0);
      return sizeA - sizeB;
    });

    // Get available colors
    const availableColors = getAvailableColors(product);

    // Determine shoe type
    const shoeType =
      product.specifications?.closure ||
      product.subCategory ||
      product.category ||
      "Shoes";

    const response = {
      id: product._id,
      title: product.title || "Untitled Product",
      slug: product.slug,
      description: product.description,
      category: product.category,
      subCategory: product.subCategory,
      gender: product.gender,
      mrp: product.mrp || 0,
      sellingPrice: product.sellingPrice || 0,
      discountPercentage,
      totalStock,
      inStock: totalStock > 0,
      specifications: product.specifications || {},
      variants: processedVariants,
      availableSizes,
      availableColors,
      shoeType,
      seller: product.seller,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Get products by category
const GetProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 8 } = req.query;

    const products = await Product.find({
      category: { $regex: new RegExp(category, "i") },
      isDeleted: false,
    })
      .limit(parseInt(limit))
      .lean();

    const processedProducts = products.map((product) => {
      const discountPercentage =
        product.mrp && product.sellingPrice
          ? Math.round(
            ((product.mrp - product.sellingPrice) / product.mrp) * 100
          )
          : 0;

      const thumbnailImage = product.variants?.[0]?.images?.[0] || null;

      return {
        id: product._id,
        title: product.title || "Untitled Product",
        slug: product.slug,
        sellingPrice: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        discountPercentage,
        thumbnailImage,
        gender: product.gender,
        category: product.category,
        subCategory: product.subCategory,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Products in ${category} category fetched successfully`,
      data: processedProducts,
      count: processedProducts.length,
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category products",
      error: error.message,
    });
  }
};

// Get products by gender
const GetProductsByGender = async (req, res) => {
  try {
    const { gender } = req.params;
    const { limit = 12 } = req.query;

    const normalizedGender = normalizeGender(gender);

    const products = await Product.find({
      gender: { $regex: new RegExp(normalizedGender, "i") },
      isDeleted: false,
    })
      .limit(parseInt(limit))
      .lean();

    const processedProducts = products.map((product) => {
      const discountPercentage =
        product.mrp && product.sellingPrice
          ? Math.round(
            ((product.mrp - product.sellingPrice) / product.mrp) * 100
          )
          : 0;

      const thumbnailImage = product.variants?.[0]?.images?.[0] || null;

      const shoeType =
        product.specifications?.closure ||
        product.subCategory ||
        product.category ||
        "Shoes";

      return {
        id: product._id,
        title: product.title || "Untitled Product",
        slug: product.slug,
        sellingPrice: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        discountPercentage,
        thumbnailImage,
        category: product.category,
        subCategory: product.subCategory,
        shoeType,
      };
    });

    return res.status(200).json({
      success: true,
      message: `${gender} products fetched successfully`,
      data: processedProducts,
      count: processedProducts.length,
    });
  } catch (error) {
    console.error("Error fetching gender products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch gender products",
      error: error.message,
    });
  }
};

// Search products
const SearchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await Product.find({
      $or: [
        { title: { $regex: new RegExp(q, "i") } },
        { description: { $regex: new RegExp(q, "i") } },
        { category: { $regex: new RegExp(q, "i") } },
        { subCategory: { $regex: new RegExp(q, "i") } },
      ],
      isDeleted: false,
    })
      .limit(parseInt(limit))
      .lean();

    const processedProducts = products.map((product) => {
      const thumbnailImage = product.variants?.[0]?.images?.[0] || null;

      return {
        id: product._id,
        title: product.title || "Untitled Product",
        slug: product.slug,
        sellingPrice: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        thumbnailImage,
        gender: product.gender,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Search results",
      data: processedProducts,
      count: processedProducts.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
    });
  }
};

// Get filter options
const GetFilterOptions = async (req, res) => {
  try {
    const { gender } = req.query;

    let query = { isDeleted: false };
    if (gender) {
      const normalizedGender = normalizeGender(gender);
      query.gender = { $regex: new RegExp(normalizedGender, "i") };
    }

    const products = await Product.find(query).lean();

    // Extract unique values
    const categoriesMap = {};
    const subCategoriesMap = {};
    const shoeTypesMap = {};
    const sizesMap = {};
    const colorsMap = {};

    products.forEach((product) => {
      if (product.category) {
        categoriesMap[product.category] =
          (categoriesMap[product.category] || 0) + 1;
      }
      if (product.subCategory) {
        subCategoriesMap[product.subCategory] =
          (subCategoriesMap[product.subCategory] || 0) + 1;
      }

      const shoeType =
        product.specifications?.closure ||
        product.subCategory ||
        product.category;
      if (shoeType) {
        shoeTypesMap[shoeType] = (shoeTypesMap[shoeType] || 0) + 1;
      }

      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant) => {
          if (variant.colorName) {
            const key = `${variant.colorName}|${variant.hexCode || "#000000"}`;
            colorsMap[key] = (colorsMap[key] || 0) + 1;
          }
          if (variant.sizes && Array.isArray(variant.sizes)) {
            variant.sizes.forEach((size) => {
              if (size && size.size) {
                sizesMap[size.size] = (sizesMap[size.size] || 0) + 1;
              }
            });
          }
        });
      }
    });

    const categories = Object.keys(categoriesMap).map((name) => ({
      name,
      count: categoriesMap[name],
    }));
    const subCategories = Object.keys(subCategoriesMap).map((name) => ({
      name,
      count: subCategoriesMap[name],
    }));
    const shoeTypes = Object.keys(shoeTypesMap).map((name) => ({
      name,
      count: shoeTypesMap[name],
    }));
    const sizes = Object.keys(sizesMap).map((size) => ({
      size,
      count: sizesMap[size],
    }));
    const colors = Object.keys(colorsMap).map((key) => {
      const [name, hexCode] = key.split("|");
      return { name, hexCode, count: colorsMap[key] };
    });

    // Sort
    categories.sort((a, b) => b.count - a.count);
    subCategories.sort((a, b) => b.count - a.count);
    shoeTypes.sort((a, b) => b.count - a.count);
    sizes.sort((a, b) => {
      const sizeA = parseInt(a.size.match(/\d+/)?.[0] || 0);
      const sizeB = parseInt(b.size.match(/\d+/)?.[0] || 0);
      return sizeA - sizeB;
    });
    colors.sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      message: "Filter options fetched successfully",
      data: {
        categories,
        subCategories,
        shoeTypes,
        sizes,
        colors,
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: error.message,
    });
  }
};

export {
  GetAllProducts,
  GetSingleProduct,
  GetProductsByCategory,
  GetProductsByGender,
  SearchProducts,
  GetFilterOptions,
};
