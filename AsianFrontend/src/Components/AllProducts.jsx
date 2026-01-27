// src/Pages/AllProducts.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Filters from "../Components/Filter";
import ProductCard from "../Components/ProductCard";
import styles from "../Styles/AllProducts.module.css";
import api from "../services/axiosConfig";

const AllProducts = () => {
  const location = useLocation();
  const isInitialMount = useRef(true);
  const abortControllerRef = useRef(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12,
  });

  // Parse initial URL params
  const getInitialFilters = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return {
      gender: params.get("gender") || "Men", // Changed to match DB
      sortBy: "createdAt",
      sortOrder: "desc",
      sizes: [],
      priceRange: "all",
      types: params.get("type")
        ? params
          .get("type")
          .split(",")
          .map((t) => t.trim())
        : [],
      category: params.get("category") || "",
      subCategory: params.get("subCategory") || "",
      page: 1,
      limit: 12,
    };
  }, [location.search]);

  const [filters, setFilters] = useState(getInitialFilters);

  // Sync state with URL if URL changes externally (e.g. clicking header links)
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [location.search, getInitialFilters]);

  // Update URL without triggering re-render loop
  const updateURL = useCallback((currentFilters) => {
    const urlParams = new URLSearchParams();

    if (currentFilters.gender && currentFilters.gender !== "Men") {
      urlParams.append("gender", currentFilters.gender);
    }
    if (currentFilters.category) {
      urlParams.append("category", currentFilters.category);
    }
    if (currentFilters.subCategory) {
      urlParams.append("subCategory", currentFilters.subCategory);
    }
    if (currentFilters.types.length > 0) {
      urlParams.append("type", currentFilters.types.join(","));
    }

    const queryString = urlParams.toString();
    const newUrl = `/products${queryString ? "?" + queryString : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Fetch products function
  const fetchProducts = useCallback(async (currentFilters) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add all filter parameters
      if (currentFilters.gender) params.append("gender", currentFilters.gender);
      if (currentFilters.category)
        params.append("category", currentFilters.category);
      if (currentFilters.subCategory)
        params.append("subCategory", currentFilters.subCategory);
      if (currentFilters.sortBy) params.append("sortBy", currentFilters.sortBy);
      if (currentFilters.sortOrder)
        params.append("sortOrder", currentFilters.sortOrder);
      if (currentFilters.types.length > 0)
        params.append("type", currentFilters.types.join(","));
      if (currentFilters.sizes.length > 0)
        params.append("sizes", currentFilters.sizes.join(","));

      // Handle price range
      if (currentFilters.priceRange !== "all") {
        switch (currentFilters.priceRange) {
          case "under1000":
            params.append("maxPrice", "1000");
            break;
          case "1001-1500":
            params.append("minPrice", "1001");
            params.append("maxPrice", "1500");
            break;
          case "1500-2000":
            params.append("minPrice", "1500");
            params.append("maxPrice", "2000");
            break;
          case "above2000":
            params.append("minPrice", "2000");
            break;
          default:
            break;
        }
      }

      params.append("page", currentFilters.page.toString());
      params.append("limit", currentFilters.limit.toString());

      console.log(
        "Fetching products with URL:",
        `/public-products/products?${params.toString()}`
      );

      const response = await api.get(
        `/public-products/products?${params.toString()}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setPagination(
          response.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            limit: 12,
          }
        );
      } else {
        setError(response.data.message || "Failed to fetch products");
      }
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError") {
        console.log("Request cancelled");
        return;
      }
      console.error("Error fetching products:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch products. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchProducts(filters);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, fetchProducts]);

  // Handler Functions
  const handleGenderChange = useCallback(
    (gender) => {
      const newFilters = {
        ...filters,
        gender,
        types: [],
        category: "",
        subCategory: "",
        page: 1,
      };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleSortChange = useCallback((sort) => {
    let sortBy = "createdAt";
    let sortOrder = "desc";

    switch (sort) {
      case "newArrivals":
        sortBy = "createdAt";
        sortOrder = "desc";
        break;
      case "lowToHigh":
        sortBy = "sellingPrice";
        sortOrder = "asc";
        break;
      case "highToLow":
        sortBy = "sellingPrice";
        sortOrder = "desc";
        break;
      default:
        sortBy = "createdAt";
        sortOrder = "desc";
    }

    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const handleSizeSelect = useCallback((sizes) => {
    setFilters((prev) => ({ ...prev, sizes, page: 1 }));
  }, []);

  const handlePriceSelect = useCallback((priceRange) => {
    setFilters((prev) => ({ ...prev, priceRange, page: 1 }));
  }, []);

  const handleTypeSelect = useCallback(
    (types) => {
      const newFilters = {
        ...filters,
        types,
        category: "",
        subCategory: "",
        page: 1,
      };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleCategorySelect = useCallback(
    (category) => {
      const newFilters = {
        ...filters,
        category,
        types: [],
        subCategory: "",
        page: 1,
      };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleSubCategorySelect = useCallback(
    (subCategory) => {
      const newFilters = {
        ...filters,
        subCategory,
        types: [],
        category: "",
        page: 1,
      };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const toggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const getPageTitle = useCallback(() => {
    const genderDisplay =
      filters.gender === "Men"
        ? "Men's"
        : filters.gender === "Women"
          ? "Women's"
          : filters.gender;

    if (filters.types.length > 0) {
      return `${genderDisplay} ${filters.types.join(", ")}`;
    }
    if (filters.category) {
      return `${genderDisplay} ${filters.category}`;
    }
    if (filters.subCategory) {
      return `${genderDisplay} ${filters.subCategory}`;
    }
    return `${genderDisplay} Shoes`;
  }, [filters.gender, filters.types, filters.category, filters.subCategory]);

  const clearAllFilters = useCallback(() => {
    const defaultFilters = {
      gender: "Men",
      sortBy: "createdAt",
      sortOrder: "desc",
      sizes: [],
      priceRange: "all",
      types: [],
      category: "",
      subCategory: "",
      page: 1,
      limit: 12,
    };
    setFilters(defaultFilters);
    updateURL(defaultFilters);
  }, [updateURL]);

  const handlePageChange = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleRetry = useCallback(() => {
    fetchProducts(filters);
  }, [fetchProducts, filters]);

  // Get selected sort value for Filter component
  const getSelectedSort = () => {
    if (filters.sortBy === "sellingPrice") {
      return filters.sortOrder === "asc" ? "lowToHigh" : "highToLow";
    }
    if (filters.sortBy === "createdAt") {
      return "newArrivals";
    }
    return "relevance";
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Mobile Filter Toggle */}
        <div className={styles.filterToggle} onClick={toggleFilter}>
          <span className={styles.filterToggleTitle}>
            Filters{" "}
            {(filters.types.length > 0 || filters.sizes.length > 0) &&
              `(${filters.types.length + filters.sizes.length})`}
          </span>
          <FontAwesomeIcon
            icon={isFilterOpen ? faTimes : faFilter}
            className={`${styles.filterIcon} ${isFilterOpen ? styles.open : ""
              }`}
          />
        </div>

        {/* LEFT FILTER SIDEBAR */}
        <div
          className={`${styles.sidebar} ${isFilterOpen ? styles.sidebarOpen : ""
            }`}
        >
          <Filters
            onGenderChange={handleGenderChange}
            onSortChange={handleSortChange}
            onSizeSelect={handleSizeSelect}
            onPriceSelect={handlePriceSelect}
            onTypeSelect={handleTypeSelect}
            onCategorySelect={handleCategorySelect}
            onSubCategorySelect={handleSubCategorySelect}
            selectedGender={filters.gender}
            selectedSort={getSelectedSort()}
            selectedTypes={filters.types}
            selectedSizes={filters.sizes}
            selectedCategory={filters.category}
            selectedSubCategory={filters.subCategory}
            priceRange={filters.priceRange}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* RIGHT PRODUCT GRID AREA */}
        <div className={styles.mainContent}>
          {/* <div className={styles.header}>
            <h1>{getPageTitle()}</h1>
            <p className={styles.productCount}>
              {isLoading
                ? "Loading..."
                : `${pagination.totalProducts} products found`}
            </p>
          </div> */}

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon
                icon={faSpinner}
                className={styles.spinner}
                spin
              />
              <p>Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button className={styles.retryButton} onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && products.length > 0 && (
            <>
              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <div key={product.id} className={styles.productCardWrapper}>
                    <ProductCard
                      product={{
                        id: product.id,
                        name: product.title || "Untitled Product",
                        subtitle:
                          product.subCategory || product.category || "Shoes",
                        price: product.sellingPrice || 0,
                        oldPrice: product.mrp || 0,
                        discount: product.discountPercentage || 0,
                        image:
                          product.thumbnailImage ||
                          "https://via.placeholder.com/300x300?text=No+Image",
                        gender: product.gender,
                        type: product.shoeType || product.category,
                      }}
                      onAddToCart={() =>
                        console.log("Add to cart:", product.id)
                      }
                      onAddToWishlist={() =>
                        console.log("Add to wishlist:", product.id)
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1 || isLoading}
                  >
                    Previous
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .slice(
                        Math.max(0, filters.page - 3),
                        Math.min(pagination.totalPages, filters.page + 2)
                      )
                      .map((page) => (
                        <button
                          key={page}
                          className={`${styles.pageButton} ${filters.page === page ? styles.activePage : ""
                            }`}
                          onClick={() => handlePageChange(page)}
                          disabled={isLoading}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={
                      filters.page >= pagination.totalPages || isLoading
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* No products found */}
          {!isLoading && !error && products.length === 0 && (
            <div className={styles.noProducts}>
              <div className={styles.noProductsIcon}>🔍</div>
              <h3>No products found</h3>
              <p>Try changing your filters or search criteria.</p>
              <button className={styles.clearFilters} onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
