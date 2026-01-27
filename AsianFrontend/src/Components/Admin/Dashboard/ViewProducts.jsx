// Components/Admin/Dashboard/ViewProducts.jsx
import React, { useState, useEffect } from "react";
import styles from "../../../Styles/Admin/ViewProducts.module.css";
import api from "../../../services/axiosConfig";
import { toast } from "react-toastify";
import ActionDropdown from "../../Common/ActionDropdown";
import {
  FiBox,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiArchive,
  FiCheckCircle,
  FiStar,
  FiX,
  FiPackage,
  FiShoppingBag,
  FiAlertCircle,
} from "react-icons/fi";

const ViewProducts = ({
  setActiveMenu,
  setSelectedProductId,
  filterType = "all",
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, categoryFilter, statusFilter, searchTerm, filterType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(filterType === "pending" && { approved: "false" }),
        ...(filterType === "featured" && { featured: "true" }),
      });

      console.log("Fetching products with params:", params.toString());

      const response = await api.get(`/admin/products?${params}`);

      console.log("Products response:", response.data);

      if (response.data.success) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.response?.data?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (productId) => {
    setSelectedProductId(productId);
    setActiveMenu("edit-product");
  };

  const handleDelete = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"?`))
      return;

    try {
      const response = await api.delete(`/admin/products/${productId}`);

      if (response.data.success) {
        toast.success("✅ Product deleted successfully!");
        fetchProducts();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to delete product"
      );
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      const response = await api.patch(
        `/admin/products/${productId}/toggle-status`
      );

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to update status"
      );
    }
  };

  const handleApproveProduct = async (productId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/products/${productId}/approve`, {
        isApproved: !currentStatus,
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to approve product"
      );
    }
  };

  const handleFeatureProduct = async (productId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/products/${productId}/feature`, {
        isFeatured: !currentStatus,
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Feature error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to feature product"
      );
    }
  };

  const getProductActions = (product) => {
    const actions = [
      {
        label: "View Details",
        icon: <FiEye size={16} />,
        onClick: () => handleViewProduct(product),
        variant: "primary",
      },
      {
        label: "Edit Product",
        icon: <FiEdit size={16} />,
        onClick: () => handleEditProduct(product._id),
      },
      {
        label: product.isArchived ? "Activate" : "Archive",
        icon: <FiArchive size={16} />,
        onClick: () => handleToggleStatus(product._id),
        variant: product.isArchived ? "success" : "warning",
      },
    ];

    if (product.hasOwnProperty("isApproved")) {
      actions.push({
        label: product.isApproved ? "Unapprove" : "Approve",
        icon: <FiCheckCircle size={16} />,
        onClick: () => handleApproveProduct(product._id, product.isApproved),
        variant: product.isApproved ? "warning" : "success",
      });
    }

    if (product.hasOwnProperty("isFeatured")) {
      actions.push({
        label: product.isFeatured ? "Unfeature" : "Feature",
        icon: <FiStar size={16} />,
        onClick: () => handleFeatureProduct(product._id, product.isFeatured),
        variant: product.isFeatured ? "warning" : "success",
      });
    }

    actions.push({ divider: true });
    actions.push({
      label: "Delete Product",
      icon: <FiTrash2 size={16} />,
      onClick: () => handleDelete(product._id, product.title),
      variant: "danger",
    });

    return actions;
  };

  const getTotalStock = (product) => {
    let total = 0;
    if (product?.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        if (variant?.sizes && Array.isArray(variant.sizes)) {
          variant.sizes.forEach((size) => {
            total += size?.stock || 0;
          });
        }
      });
    }
    return total;
  };

  // Safe price formatting helper
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "N/A";
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "N/A";
    return `₹${numPrice.toLocaleString("en-IN")}`;
  };

  const getActiveProductsCount = () => {
    return products.filter((p) => !p.isArchived).length;
  };

  const getArchivedProductsCount = () => {
    return products.filter((p) => p.isArchived).length;
  };

  const getFeaturedProductsCount = () => {
    return products.filter((p) => p.isFeatured).length;
  };

  const getLowStockProductsCount = () => {
    return products.filter((p) => getTotalStock(p) < 10).length;
  };

  if (loading && products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FiBox size={28} />
          <div>
            <h1 className={styles.title}>Product Management</h1>
            <p className={styles.subtitle}>
              {filterType === "pending"
                ? "Products Pending Approval"
                : filterType === "featured"
                  ? "Featured Products"
                  : "Manage all products"}
            </p>
          </div>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setActiveMenu("add-product")}
        >
          <FiPlus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <FiPackage size={20} />
          <div>
            <span className={styles.summaryCount}>
              {getActiveProductsCount()}
            </span>
            <span className={styles.summaryLabel}>Active</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <FiArchive size={20} />
          <div>
            <span className={styles.summaryCount}>
              {getArchivedProductsCount()}
            </span>
            <span className={styles.summaryLabel}>Archived</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <FiStar size={20} color="#f59e0b" />
          <div>
            <span className={styles.summaryCount}>
              {getFeaturedProductsCount()}
            </span>
            <span className={styles.summaryLabel}>Featured</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <FiAlertCircle size={20} color="#ef4444" />
          <div>
            <span className={styles.summaryCount}>
              {getLowStockProductsCount()}
            </span>
            <span className={styles.summaryLabel}>Low Stock</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search by title, SKU, or description..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <FiFilter size={16} />
          <span>Category:</span>
          <button
            className={`${styles.filterBtn} ${categoryFilter === "all" ? styles.active : ""
              }`}
            onClick={() => handleCategoryFilter("all")}
          >
            All
          </button>
          {categories.slice(0, 3).map((cat) => (
            <button
              key={cat._id}
              className={`${styles.filterBtn} ${categoryFilter === cat.name ? styles.active : ""
                }`}
              onClick={() => handleCategoryFilter(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span>Status:</span>
          <button
            className={`${styles.filterBtn} ${statusFilter === "all" ? styles.active : ""
              }`}
            onClick={() => handleStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${statusFilter === "active" ? styles.active : ""
              }`}
            onClick={() => handleStatusFilter("active")}
          >
            Active
          </button>
          <button
            className={`${styles.filterBtn} ${statusFilter === "archived" ? styles.active : ""
              }`}
            onClick={() => handleStatusFilter("archived")}
          >
            Archived
          </button>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={fetchProducts}
          disabled={loading}
          title="Refresh Products"
        >
          <FiRefreshCw size={18} className={loading ? styles.spinning : ""} />
        </button>
      </div>

      {/* Products Table */}
      <div className={styles.tableContainer}>
        {products.length === 0 ? (
          <div className={styles.emptyState}>
            <FiBox size={64} />
            <h3>No products found</h3>
            <p>Try adjusting your filters or add a new product.</p>
            <button
              className={styles.addBtn}
              onClick={() => setActiveMenu("add-product")}
              style={{ marginTop: "20px" }}
            >
              <FiPlus size={18} />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className={styles.productCell}>
                        {product.variants?.[0]?.images?.[0] ? (
                          <img
                            src={product.variants[0].images[0]}
                            alt={product.title || "Product"}
                            className={styles.productImage}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={styles.noImage}
                          style={{
                            display: product.variants?.[0]?.images?.[0]
                              ? "none"
                              : "flex",
                          }}
                        >
                          <FiBox size={24} />
                        </div>
                        <div>
                          <div className={styles.productTitle}>
                            {product.title || "Untitled Product"}
                            {product.isFeatured && (
                              <FiStar
                                size={14}
                                color="#f59e0b"
                                fill="#f59e0b"
                                style={{ marginLeft: 6 }}
                                title="Featured"
                              />
                            )}
                          </div>
                          <div className={styles.productSlug}>
                            {product.slug || "no-slug"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.priceCell}>
                        <span className={styles.sellingPrice}>
                          {formatPrice(product.sellingPrice)}
                        </span>
                        {product.mrp &&
                          product.sellingPrice &&
                          product.mrp > product.sellingPrice && (
                            <span className={styles.mrp}>
                              {formatPrice(product.mrp)}
                            </span>
                          )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.stockBadge} ${getTotalStock(product) === 0
                            ? styles.outOfStock
                            : getTotalStock(product) < 10
                              ? styles.lowStock
                              : styles.inStock
                          }`}
                      >
                        {getTotalStock(product)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.sellerInfo}>
                        <span className={styles.sellerName}>
                          {product.seller?.name || "N/A"}
                        </span>
                        {product.seller?.brandName && (
                          <span className={styles.brandName}>
                            {product.seller.brandName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span
                          className={`${styles.statusBadge} ${product.isArchived ? styles.archived : styles.active
                            }`}
                        >
                          {product.isArchived ? "Archived" : "Active"}
                        </span>
                        {product.hasOwnProperty("isApproved") &&
                          !product.isApproved && (
                            <span className={styles.pendingBadge}>Pending</span>
                          )}
                      </div>
                    </td>
                    <td>
                      <ActionDropdown
                        actions={getProductActions(product)}
                        align="right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className={styles.modalOverlay} onClick={closeViewModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Product Details</h2>
              <button className={styles.closeBtn} onClick={closeViewModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Title:</strong>
                <span>{selectedProduct.title || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Category:</strong>
                <span>{selectedProduct.category || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Selling Price:</strong>
                <span>{formatPrice(selectedProduct.sellingPrice)}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>MRP:</strong>
                <span>{formatPrice(selectedProduct.mrp)}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Stock:</strong>
                <span>{getTotalStock(selectedProduct)}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Seller:</strong>
                <span>{selectedProduct.seller?.name || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Status:</strong>
                <span
                  className={`${styles.statusBadge} ${selectedProduct.isArchived ? styles.archived : styles.active
                    }`}
                >
                  {selectedProduct.isArchived ? "Archived" : "Active"}
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.editBtn}
                onClick={() => {
                  closeViewModal();
                  handleEditProduct(selectedProduct._id);
                }}
              >
                <FiEdit size={16} />
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProducts;
