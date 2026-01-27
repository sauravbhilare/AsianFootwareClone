import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axiosConfig";
import styles from "../../Styles/SingleProduct/SingleProductPage.module.css";
import ImageGallery from "../SingleProduct/ImageGallery";
import ProductSidebar from "../SingleProduct/ProductSidebar";

import Footer from "../../Components/Footer";
import Header from "../../Components/Header";

const SingleProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0); // NEW: Shared state

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/public-products/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          setError(response.data.message || "Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        if (err.response?.status === 404) {
          setError("Product not found");
        } else {
          setError("Failed to load product. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const transformProductData = (apiProduct) => {
    if (!apiProduct) return null;
    const allImages = [];
    if (apiProduct.variants?.[0]?.images?.[0]) {
      allImages.push(apiProduct.variants[0].images[0]);
    }
    (apiProduct.variants || []).forEach((variant) => {
      (variant.images || []).forEach((img) => {
        if (!allImages.includes(img)) {
          allImages.push(img);
        }
      });
    });
    if (allImages.length === 0) {
      allImages.push("/api/placeholder/600/600?text=No+Image");
    }
    const colors = (apiProduct.variants || []).map((variant, index) => ({
      id: index + 1,
      name: variant.colorName || "Unknown",
      hexCode: variant.hexCode || "#000000",
      img: variant.images?.[0] || "/api/placeholder/50/50?text=Color",
      selected: index === 0,
      hasStock: variant.sizes?.some((size) => size?.stock > 0) || false,
    }));
    return {
      id: apiProduct.id,
      title: apiProduct.title || "Untitled Product",
      subtitle: apiProduct.description || apiProduct.subCategory || "",
      slug: apiProduct.slug,
      currentPrice: apiProduct.sellingPrice || 0,
      originalPrice: apiProduct.mrp || 0,
      discountPercentage: apiProduct.discountPercentage || 0,
      images: allImages,
      colors: colors,
      availableSizes: apiProduct.availableSizes || [],
      variants: apiProduct.variants || [],
      category: apiProduct.category,
      subCategory: apiProduct.subCategory,
      description: apiProduct.description || "",
      gender: apiProduct.gender,
      specifications: apiProduct.specifications || {},
      totalStock: apiProduct.totalStock,
      inStock: apiProduct.inStock,
      shoeType: apiProduct.shoeType,
    };
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <p>Loading product details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className={styles.errorContainer}>
          <h2>Oops! Something went wrong</h2>
          <p>{error || "Product not found"}</p>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            Go Back to Home
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const transformedProduct = transformProductData(product);

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <ImageGallery
            key={selectedColorIndex}
            images={transformedProduct.images}
            variants={transformedProduct.variants}
            selectedColorIndex={selectedColorIndex} // NEW: Pass state
          />
          <ProductSidebar
            product={transformedProduct}
            selectedColorIndex={selectedColorIndex} // NEW: Pass state
            setSelectedColorIndex={setSelectedColorIndex} // NEW: Pass setter
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SingleProductPage;
