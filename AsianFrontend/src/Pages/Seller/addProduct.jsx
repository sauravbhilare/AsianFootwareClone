import React, { useState, useEffect } from "react";
import api from "../../services/axiosConfig.js";
import styles from "../../Styles/Seller/AddProduct.module.css";

import {
  Package,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Plus,
  Trash,
  X,
  Check,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Save,
  Tag,
  Hash,
  Layers,
  Zap,
  Award,
  Star,
  TrendingUp,
} from "lucide-react";

// Map Lucide icons to the existing Icons object structure
const Icons = {
  Package,
  DollarSign,
  Settings,
  Picture: ImageIcon, // Map Image to Picture to avoid constructor conflict
  Plus,
  Trash,
  X,
  Check,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Save,
  Tag,
  Hash,
  Layers,
  Zap,
  Award,
  Star,
  TrendingUp,
};

// Available tags configuration
const AVAILABLE_TAGS = [
  {
    value: "new-arrival",
    label: "New Arrival",
    icon: "Zap",
    color: "#10b981",
    bgColor: "#d1fae5",
    description: "Mark as newly added product",
  },
  {
    value: "best-seller",
    label: "Best Seller",
    icon: "Award",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    description: "Highlight top selling item",
  },
  {
    value: "featured",
    label: "Featured",
    icon: "Star",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    description: "Feature on homepage",
  },
  {
    value: "trending",
    label: "Trending",
    icon: "TrendingUp",
    color: "#ef4444",
    bgColor: "#fee2e2",
    description: "Show as trending product",
  },
];

const AddProduct = ({ productId, setActiveMenu }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState({ 0: true });

  const initialProductData = {
    title: "",
    slug: "",
    description: "",
    category: "",
    subCategory: "",
    gender: "Unisex",
    mrp: "",
    sellingPrice: "",
    specifications: {
      upperMaterial: "",
      soleMaterial: "",
      insole: "",
      closure: "",
    },
    variants: [
      {
        colorName: "",
        hexCode: "#000000",
        images: [""],
        sizes: [{ size: "", sku: "", stock: 0, priceOverride: null }],
      },
    ],
    tags: [], // NEW: Add tags to initial state
  };

  const [productData, setProductData] = useState(initialProductData);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get("/seller/get-categories");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await api.get(`/seller/get-category/${categoryId}`);
      if (response.data.success && response.data.category) {
        setSubCategories(response.data.category.subCategories || []);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchExistingProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seller/get-ProductsByID/${productId}`);
      if (response.data.success) {
        const product = response.data.product;
        setProductData({
          title: product.title || "",
          slug: product.slug || "",
          description: product.description || "",
          category: product.category || "",
          subCategory: product.subCategory || "",
          gender: product.gender || "Unisex",
          mrp: product.mrp || "",
          sellingPrice: product.sellingPrice || "",
          specifications: {
            upperMaterial: product.specifications?.upperMaterial || "",
            soleMaterial: product.specifications?.soleMaterial || "",
            insole: product.specifications?.insole || "",
            closure: product.specifications?.closure || "",
          },
          variants: product.variants?.length
            ? product.variants
            : initialProductData.variants,
          tags: product.tags || [], // NEW: Load tags
        });

        if (product.category) {
          const selectedCat = categories.find(
            (cat) => cat.name === product.category
          );
          if (selectedCat) fetchSubCategories(selectedCat._id);
        }
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setMessage({ type: "error", text: "Failed to load product" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchExistingProduct();
    } else {
      setIsEditing(false);
      setProductData(initialProductData);
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "category") {
        updated.subCategory = "";
        const selectedCat = categories.find(
          (cat) => cat._id === value || cat.name === value
        );
        if (selectedCat?._id) {
          fetchSubCategories(selectedCat._id);
        } else {
          setSubCategories([]);
        }
      }
      return updated;
    });
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [name]: value },
    }));
  };

  // ==================== TAG HANDLERS ====================

  const handleTagToggle = (tagValue) => {
    setProductData((prev) => {
      const currentTags = prev.tags || [];
      const isSelected = currentTags.includes(tagValue);

      if (isSelected) {
        return {
          ...prev,
          tags: currentTags.filter((t) => t !== tagValue),
        };
      } else {
        return {
          ...prev,
          tags: [...currentTags, tagValue],
        };
      }
    });
  };

  const handleRemoveTag = (tagValue) => {
    setProductData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagValue),
    }));
  };

  const handleClearAllTags = () => {
    setProductData((prev) => ({
      ...prev,
      tags: [],
    }));
  };

  // Get icon component by name
  const getTagIcon = (iconName, size = 16) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
  };

  // ==================== VARIANT HANDLERS ====================

  const handleVariantChange = (idx, e) => {
    const { name, value } = e.target;
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[idx] = { ...variants[idx], [name]: value };
      return { ...prev, variants };
    });
  };

  const handleImageChange = (varIdx, imgIdx, value) => {
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[varIdx].images[imgIdx] = value;
      return { ...prev, variants };
    });
  };

  const addImage = (varIdx) => {
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[varIdx].images.push("");
      return { ...prev, variants };
    });
  };

  const removeImage = (varIdx, imgIdx) => {
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[varIdx].images.splice(imgIdx, 1);
      return { ...prev, variants };
    });
  };

  const handleSizeChange = (varIdx, sizeIdx, e) => {
    const { name, value } = e.target;
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[varIdx].sizes[sizeIdx] = {
        ...variants[varIdx].sizes[sizeIdx],
        [name]:
          name === "stock" || name === "priceOverride" ? Number(value) : value,
      };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    const newIdx = productData.variants.length;
    setProductData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          colorName: "",
          hexCode: "#000000",
          images: [""],
          sizes: [{ size: "", sku: "", stock: 0, priceOverride: null }],
        },
      ],
    }));
    setExpandedVariants((prev) => ({ ...prev, [newIdx]: true }));
  };

  const removeVariant = (idx) => {
    if (productData.variants.length > 1) {
      setProductData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== idx),
      }));
    }
  };

  const addSize = (varIdx) => {
    setProductData((prev) => {
      const variants = [...prev.variants];
      variants[varIdx].sizes.push({
        size: "",
        sku: "",
        stock: 0,
        priceOverride: null,
      });
      return { ...prev, variants };
    });
  };

  const removeSize = (varIdx, sizeIdx) => {
    if (productData.variants[varIdx].sizes.length > 1) {
      setProductData((prev) => {
        const variants = [...prev.variants];
        variants[varIdx].sizes.splice(sizeIdx, 1);
        return { ...prev, variants };
      });
    }
  };

  const generateSKU = (varIdx, sizeIdx, size) => {
    if (!size || !productData.title) return;
    const code = productData.title
      .replace(/\s+/g, "")
      .toUpperCase()
      .slice(0, 6);
    const color = productData.variants[varIdx].colorName
      .replace(/\s+/g, "")
      .toUpperCase()
      .slice(0, 3);
    const sku = `${code}-${color}-${size}`;
    handleSizeChange(varIdx, sizeIdx, { target: { name: "sku", value: sku } });
  };

  const toggleVariant = (idx) => {
    setExpandedVariants((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const calculateDiscount = () => {
    if (productData.mrp && productData.sellingPrice) {
      const mrp = Number(productData.mrp);
      const sp = Number(productData.sellingPrice);
      if (mrp > 0) return Math.round(((mrp - sp) / mrp) * 100);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (
        !productData.title ||
        !productData.category ||
        !productData.mrp ||
        !productData.sellingPrice
      ) {
        throw new Error("Please fill all required fields");
      }

      const hasValidVariants = productData.variants.every(
        (v) =>
          v.colorName &&
          v.hexCode &&
          v.images.some((img) => img.trim()) &&
          v.sizes.every((s) => s.size && s.sku)
      );

      if (!hasValidVariants) {
        throw new Error("Please complete all variant details");
      }

      let response;
      if (isEditing) {
        response = await api.put(
          `/seller/UpdateProduct/${productId}`,
          productData
        );
      } else {
        const slug =
          productData.slug ||
          productData.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        response = await api.post("/seller/add-Products", {
          ...productData,
          slug,
        });
      }

      if (response.data.success) {
        setMessage({ type: "success", text: response.data.message });
        if (!isEditing) {
          setProductData(initialProductData);
          setSubCategories([]);
        }
      } else {
        setMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || error.message || "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spin}>
            <Icons.Loader size={32} />
          </div>
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icons.Package size={22} />
          <h1>{isEditing ? "Edit Product" : "Add Product"}</h1>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? (
            <span className={styles.spin}>
              <Icons.Loader size={16} />
            </span>
          ) : (
            <Icons.Save size={16} />
          )}
          <span>{saving ? "Saving..." : isEditing ? "Update" : "Save"}</span>
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === "success" ? (
            <Icons.Check size={18} />
          ) : (
            <Icons.AlertCircle size={18} />
          )}
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
          >
            <Icons.X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.leftCol}>
            {/* Basic Info */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Icons.Tag size={16} />
                <span>Basic Information</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={productData.title}
                    onChange={handleChange}
                    placeholder="Product title"
                    required
                  />
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Category *</label>
                    <select
                      name="category"
                      value={productData.category}
                      onChange={handleChange}
                      required
                      disabled={loadingCategories}
                    >
                      <option value="">Select</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Sub Category</label>
                    <select
                      name="subCategory"
                      value={productData.subCategory}
                      onChange={handleChange}
                      disabled={!productData.category}
                    >
                      <option value="">Select</option>
                      {subCategories.map((sub) => (
                        <option key={sub._id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={productData.gender}
                      onChange={handleChange}
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Kids">Kids</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={productData.slug}
                      onChange={handleChange}
                      placeholder="auto-generated"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={productData.description}
                    onChange={handleChange}
                    placeholder="Product description..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* NEW: Product Tags Section */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Icons.Tag size={16} />
                <span>Product Tags</span>
                {productData.tags?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTags}
                    className={styles.clearTagsBtn}
                  >
                    <Icons.X size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.tagDescription}>
                  Add tags to help categorize and highlight your product.
                </p>

                {/* Tag Selection Grid */}
                <div className={styles.tagsGrid}>
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = productData.tags?.includes(tag.value);

                    return (
                      <button
                        key={tag.value}
                        type="button"
                        className={`${styles.tagOption} ${
                          isSelected ? styles.tagSelected : ""
                        }`}
                        onClick={() => handleTagToggle(tag.value)}
                        style={{
                          "--tag-color": tag.color,
                          "--tag-bg-color": tag.bgColor,
                        }}
                      >
                        <div
                          className={styles.tagIconWrapper}
                          style={{
                            backgroundColor: isSelected
                              ? tag.color
                              : tag.bgColor,
                            color: isSelected ? "#fff" : tag.color,
                          }}
                        >
                          {getTagIcon(tag.icon, 14)}
                        </div>
                        <div className={styles.tagInfo}>
                          <span className={styles.tagLabel}>{tag.label}</span>
                          <span className={styles.tagDesc}>
                            {tag.description}
                          </span>
                        </div>
                        <div className={styles.tagCheckbox}>
                          {isSelected ? (
                            <Icons.Check size={14} />
                          ) : (
                            <div className={styles.emptyCheckbox}></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Tags Preview */}
                {productData.tags?.length > 0 && (
                  <div className={styles.selectedTagsPreview}>
                    <span className={styles.selectedTagsLabel}>Selected:</span>
                    <div className={styles.selectedTagsList}>
                      {productData.tags.map((tagValue) => {
                        const tagInfo = AVAILABLE_TAGS.find(
                          (t) => t.value === tagValue
                        );
                        if (!tagInfo) return null;

                        return (
                          <span
                            key={tagValue}
                            className={styles.selectedTagChip}
                            style={{
                              backgroundColor: tagInfo.bgColor,
                              color: tagInfo.color,
                              borderColor: tagInfo.color,
                            }}
                          >
                            {getTagIcon(tagInfo.icon, 12)}
                            <span>{tagInfo.label}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tagValue)}
                              className={styles.removeTagBtn}
                              style={{ color: tagInfo.color }}
                            >
                              <Icons.X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Icons.DollarSign size={16} />
                <span>Pricing</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label>MRP (₹) *</label>
                    <input
                      type="number"
                      name="mrp"
                      value={productData.mrp}
                      onChange={handleChange}
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Selling Price (₹) *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={productData.sellingPrice}
                      onChange={handleChange}
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Discount</label>
                    <div className={styles.discountBadge}>
                      {calculateDiscount()}% OFF
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Icons.Settings size={16} />
                <span>Specifications</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Upper Material</label>
                    <input
                      type="text"
                      name="upperMaterial"
                      value={productData.specifications.upperMaterial}
                      onChange={handleSpecChange}
                      placeholder="e.g., Mesh"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Sole Material</label>
                    <input
                      type="text"
                      name="soleMaterial"
                      value={productData.specifications.soleMaterial}
                      onChange={handleSpecChange}
                      placeholder="e.g., Rubber"
                    />
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Insole</label>
                    <input
                      type="text"
                      name="insole"
                      value={productData.specifications.insole}
                      onChange={handleSpecChange}
                      placeholder="e.g., Memory Foam"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Closure</label>
                    <input
                      type="text"
                      name="closure"
                      value={productData.specifications.closure}
                      onChange={handleSpecChange}
                      placeholder="e.g., Lace-up"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Variants */}
          <div className={styles.rightCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Icons.Layers size={16} />
                <span>Variants ({productData.variants.length})</span>
                <button
                  type="button"
                  onClick={addVariant}
                  className={styles.addBtn}
                >
                  <Icons.Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
              <div className={styles.cardBody}>
                {productData.variants.map((variant, varIdx) => (
                  <div key={varIdx} className={styles.variantCard}>
                    {/* Variant Header */}
                    <div
                      className={styles.variantHeader}
                      onClick={() => toggleVariant(varIdx)}
                    >
                      <div className={styles.variantInfo}>
                        <div
                          className={styles.colorDot}
                          style={{ background: variant.hexCode }}
                        />
                        <span className={styles.variantName}>
                          {variant.colorName || `Variant ${varIdx + 1}`}
                        </span>
                        <span className={styles.sizeCount}>
                          {variant.sizes.length} size
                          {variant.sizes.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className={styles.variantActions}>
                        {productData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVariant(varIdx);
                            }}
                            className={styles.deleteBtn}
                          >
                            <Icons.Trash size={14} />
                          </button>
                        )}
                        {expandedVariants[varIdx] ? (
                          <Icons.ChevronUp size={18} />
                        ) : (
                          <Icons.ChevronDown size={18} />
                        )}
                      </div>
                    </div>

                    {/* Variant Body */}
                    {expandedVariants[varIdx] && (
                      <div className={styles.variantBody}>
                        <div className={styles.row2}>
                          <div className={styles.field}>
                            <label>Color Name *</label>
                            <input
                              type="text"
                              name="colorName"
                              value={variant.colorName}
                              onChange={(e) => handleVariantChange(varIdx, e)}
                              placeholder="e.g., Navy Blue"
                              required
                            />
                          </div>
                          <div className={styles.field}>
                            <label>Color Code *</label>
                            <div className={styles.colorInput}>
                              <input
                                type="color"
                                name="hexCode"
                                value={variant.hexCode}
                                onChange={(e) => handleVariantChange(varIdx, e)}
                                className={styles.colorPicker}
                              />
                              <input
                                type="text"
                                name="hexCode"
                                value={variant.hexCode}
                                onChange={(e) => handleVariantChange(varIdx, e)}
                                className={styles.colorText}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Images */}
                        <div className={styles.field}>
                          <div className={styles.fieldHeader}>
                            <label>
                              <Icons.Picture size={14} />
                              <span>Images *</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => addImage(varIdx)}
                              className={styles.addSmallBtn}
                              title="Add Image"
                            >
                              <Icons.Plus size={12} />
                            </button>
                          </div>
                          <div className={styles.imageGrid}>
                            {variant.images.map((img, imgIdx) => (
                              <div key={imgIdx} className={styles.imageItem}>
                                <input
                                  type="text"
                                  value={img}
                                  onChange={(e) =>
                                    handleImageChange(
                                      varIdx,
                                      imgIdx,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Image URL"
                                  required={imgIdx === 0}
                                />
                                {img && (
                                  <div className={styles.imagePreview}>
                                    <img
                                      src={img}
                                      alt=""
                                      onError={(e) =>
                                        (e.target.style.display = "none")
                                      }
                                    />
                                  </div>
                                )}
                                {variant.images.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeImage(varIdx, imgIdx)}
                                    className={styles.removeImgBtn}
                                  >
                                    <Icons.X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sizes */}
                        <div className={styles.field}>
                          <div className={styles.fieldHeader}>
                            <label>
                              <Icons.Hash size={14} />
                              <span>Sizes *</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => addSize(varIdx)}
                              className={styles.addSmallBtn}
                            >
                              <Icons.Plus size={12} />
                            </button>
                          </div>
                          <div className={styles.sizesTable}>
                            <div className={styles.sizeHeader}>
                              <span>Size</span>
                              <span>SKU</span>
                              <span>Stock</span>
                              <span></span>
                            </div>
                            {variant.sizes.map((size, sizeIdx) => (
                              <div key={sizeIdx} className={styles.sizeRow}>
                                <input
                                  type="text"
                                  name="size"
                                  value={size.size}
                                  onChange={(e) =>
                                    handleSizeChange(varIdx, sizeIdx, e)
                                  }
                                  onBlur={(e) =>
                                    generateSKU(varIdx, sizeIdx, e.target.value)
                                  }
                                  placeholder="UK 7"
                                  required
                                />
                                <input
                                  type="text"
                                  name="sku"
                                  value={size.sku}
                                  onChange={(e) =>
                                    handleSizeChange(varIdx, sizeIdx, e)
                                  }
                                  placeholder="SKU"
                                  required
                                />
                                <input
                                  type="number"
                                  name="stock"
                                  value={size.stock}
                                  onChange={(e) =>
                                    handleSizeChange(varIdx, sizeIdx, e)
                                  }
                                  placeholder="0"
                                  min="0"
                                  required
                                />
                                {variant.sizes.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeSize(varIdx, sizeIdx)}
                                    className={styles.removeSizeBtn}
                                  >
                                    <Icons.X size={12} />
                                  </button>
                                ) : (
                                  <span></span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
