// components/admin/banners/ViewBanners.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Grid,
  List,
  ArrowUpDown,
} from "lucide-react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Admin/ViewBanners.module.css";

const ViewBanners = ({ setActiveMenu, setSelectedBannerId }) => {
  // State management
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBanners, setTotalBanners] = useState(0);
  const [limit] = useState(10);

  // View mode state
  const [viewMode, setViewMode] = useState("grid");

  // Modal state for delete confirmation
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    bannerId: null,
    bannerTitle: "",
  });

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    banner: null,
  });

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await api.get(`/admin/banners?${params.toString()}`);

      if (response.data.success) {
        let filteredBanners = response.data.banners || [];

        // Client-side search filtering
        if (searchTerm) {
          filteredBanners = filteredBanners.filter(
            (banner) =>
              banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              banner.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setBanners(filteredBanners);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalBanners(
          response.data.pagination?.total || filteredBanners.length
        );
      }
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError(err.response?.data?.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, sortBy, sortOrder, statusFilter, searchTerm]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Handle toggle status
  const handleToggleStatus = async (bannerId) => {
    try {
      const response = await api.patch(
        `/admin/banners/${bannerId}/toggle-status`
      );

      if (response.data.success) {
        setSuccessMessage(
          response.data.message || "Banner status updated successfully"
        );
        fetchBanners();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle banner status");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.bannerId) return;

    try {
      const response = await api.delete(
        `/admin/banners/${deleteModal.bannerId}`
      );

      if (response.data.success) {
        setSuccessMessage("Banner deleted successfully");
        setDeleteModal({ isOpen: false, bannerId: null, bannerTitle: "" });
        fetchBanners();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete banner");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (banner) => {
    setDeleteModal({
      isOpen: true,
      bannerId: banner._id,
      bannerTitle: banner.title,
    });
  };

  // Open preview modal
  const openPreviewModal = (banner) => {
    setPreviewModal({
      isOpen: true,
      banner,
    });
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // ✅ Handle navigation to add banner
  const handleAddBanner = () => {
    setActiveMenu("add-banner");
  };

  // ✅ Handle navigation to edit banner
  const handleEditBanner = (bannerId) => {
    setSelectedBannerId(bannerId);
    setActiveMenu("edit-banner");
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${baseUrl}${imagePath}`;
  };

  // Render banner card (Grid view)
  const renderBannerCard = (banner) => (
    <div key={banner._id} className={styles.bannerCard}>
      {/* Banner Image */}
      <div className={styles.bannerImageContainer}>
        {banner.image ? (
          <img
            src={getImageUrl(banner.image)}
            alt={banner.title}
            className={styles.bannerImage}
            onError={(e) => {
              e.target.src = "/placeholder-banner.png";
              e.target.onerror = null;
            }}
          />
        ) : (
          <div className={styles.bannerImagePlaceholder}>
            <ImageIcon className={styles.bannerImagePlaceholderIcon} />
          </div>
        )}

        {/* Status Badge */}
        <span
          className={`${styles.bannerBadge} ${styles.statusBadge} ${banner.isActive ? styles.statusActive : styles.statusInactive
            }`}
        >
          {banner.isActive ? "Active" : "Inactive"}
        </span>

        {/* Order Badge */}
        <span className={`${styles.bannerBadge} ${styles.orderBadge}`}>
          Order: {banner.order || 0}
        </span>
      </div>

      {/* Banner Content */}
      <div className={styles.bannerContent}>
        <h3 className={styles.bannerTitle}>{banner.title}</h3>
        {banner.subtitle && (
          <p className={styles.bannerSubtitle}>{banner.subtitle}</p>
        )}

        {banner.link && (
          <a
            href={banner.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bannerLink}
          >
            <ExternalLink className={styles.bannerLinkIcon} />
            View Link
          </a>
        )}

        <div className={styles.bannerDate}>
          Created: {new Date(banner.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.bannerActions}>
        <div className={styles.actionButtonsGroup}>
          <button
            onClick={() => openPreviewModal(banner)}
            className={`${styles.actionButton} ${styles.actionButtonView}`}
            title="Preview"
          >
            <Eye className={styles.actionIcon} />
          </button>
          <button
            onClick={() => handleEditBanner(banner._id)} // ✅ Updated
            className={`${styles.actionButton} ${styles.actionButtonEdit}`}
            title="Edit"
          >
            <Edit className={styles.actionIcon} />
          </button>
          <button
            onClick={() => openDeleteModal(banner)}
            className={`${styles.actionButton} ${styles.actionButtonDelete}`}
            title="Delete"
          >
            <Trash2 className={styles.actionIcon} />
          </button>
        </div>

        <button
          onClick={() => handleToggleStatus(banner._id)}
          className={`${styles.actionButtonToggle} ${banner.isActive
              ? styles.actionButtonToggleActive
              : styles.actionButtonToggleInactive
            }`}
          title={banner.isActive ? "Deactivate" : "Activate"}
        >
          {banner.isActive ? (
            <ToggleRight className={styles.toggleIcon} />
          ) : (
            <ToggleLeft className={styles.toggleIcon} />
          )}
        </button>
      </div>
    </div>
  );

  // Render banner row (List view)
  const renderBannerRow = (banner) => (
    <tr key={banner._id} className={styles.tableRow}>
      <td className={styles.tableCell}>
        <div className={styles.tableBannerInfo}>
          <div className={styles.tableThumbnail}>
            {banner.image ? (
              <img
                src={getImageUrl(banner.image)}
                alt={banner.title}
                className={styles.tableThumbnailImage}
                onError={(e) => {
                  e.target.src = "/placeholder-banner.png";
                  e.target.onerror = null;
                }}
              />
            ) : (
              <div className={styles.tableThumbnailPlaceholder}>
                <ImageIcon className={styles.tableThumbnailIcon} />
              </div>
            )}
          </div>
          <div>
            <div className={styles.tableBannerTitle}>{banner.title}</div>
            {banner.subtitle && (
              <div className={styles.tableBannerSubtitle}>
                {banner.subtitle}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
        <span className={`${styles.bannerBadge} ${styles.orderBadge}`}>
          {banner.order || 0}
        </span>
      </td>
      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
        <span
          className={`${styles.bannerBadge} ${banner.isActive ? styles.statusActive : styles.statusInactive
            }`}
        >
          {banner.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
        {banner.link ? (
          <a
            href={banner.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bannerLink}
          >
            <ExternalLink className={styles.tableLinkIcon} />
          </a>
        ) : (
          <span className={styles.tableLinkPlaceholder}>-</span>
        )}
      </td>
      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
        <span className={styles.tableDateText}>
          {new Date(banner.createdAt).toLocaleDateString()}
        </span>
      </td>
      <td className={styles.tableCell}>
        <div className={styles.tableActionsCell}>
          <button
            onClick={() => openPreviewModal(banner)}
            className={`${styles.tableActionButton} ${styles.actionButtonView}`}
            title="Preview"
          >
            <Eye className={styles.actionIcon} />
          </button>
          <button
            onClick={() => handleEditBanner(banner._id)} // ✅ Updated
            className={`${styles.tableActionButton} ${styles.actionButtonEdit}`}
            title="Edit"
          >
            <Edit className={styles.actionIcon} />
          </button>
          <button
            onClick={() => handleToggleStatus(banner._id)}
            className={`${styles.tableActionButton} ${banner.isActive
                ? styles.actionButtonToggleActive
                : styles.actionButtonToggleInactive
              }`}
            title={banner.isActive ? "Deactivate" : "Activate"}
          >
            {banner.isActive ? (
              <ToggleRight className={styles.actionIcon} />
            ) : (
              <ToggleLeft className={styles.actionIcon} />
            )}
          </button>
          <button
            onClick={() => openDeleteModal(banner)}
            className={`${styles.tableActionButton} ${styles.actionButtonDelete}`}
            title="Delete"
          >
            <Trash2 className={styles.actionIcon} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Banner Management</h1>
            <p className={styles.headerSubtitle}>
              Manage your website banners and promotional images
            </p>
          </div>
          {/* ✅ Updated to use handleAddBanner */}
          <button onClick={handleAddBanner} className={styles.addButton}>
            <Plus className={styles.addButtonIcon} />
            Add New Banner
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle className={styles.alertIcon} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle className={styles.alertIcon} />
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filtersGroup}>
            {/* Status Filter */}
            <div className={styles.filterWrapper}>
              <Filter className={styles.filterIcon} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="order-asc">Order (Low to High)</option>
              <option value="order-desc">Order (High to Low)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>

            {/* View Mode Toggle */}
            <div className={styles.viewModeToggle}>
              <button
                onClick={() => setViewMode("grid")}
                className={`${styles.viewModeButton} ${viewMode === "grid" ? styles.viewModeButtonActive : ""
                  }`}
              >
                <Grid className={styles.viewModeIcon} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`${styles.viewModeButton} ${viewMode === "list" ? styles.viewModeButtonActive : ""
                  }`}
              >
                <List className={styles.viewModeIcon} />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchBanners}
              className={styles.refreshButton}
              title="Refresh"
            >
              <RefreshCw
                className={`${styles.refreshIcon} ${loading ? styles.refreshIconSpinning : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className={styles.resultsCount}>
          Showing {banners.length} of {totalBanners} banners
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      ) : banners.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Banners Found</h3>
          <p className={styles.emptyText}>
            {searchTerm || statusFilter
              ? "No banners match your search criteria."
              : "Get started by adding your first banner."}
          </p>
          {/* ✅ Updated to use handleAddBanner */}
          <button onClick={handleAddBanner} className={styles.addButton}>
            <Plus className={styles.addButtonIcon} />
            Add Banner
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className={styles.bannerGrid}>{banners.map(renderBannerCard)}</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Banner</th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                >
                  <button
                    onClick={() => handleSortChange("order")}
                    className={styles.sortButton}
                  >
                    Order
                    <ArrowUpDown className={styles.sortIcon} />
                  </button>
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                >
                  Status
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                >
                  Link
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                >
                  <button
                    onClick={() => handleSortChange("createdAt")}
                    className={styles.sortButton}
                  >
                    Created
                    <ArrowUpDown className={styles.sortIcon} />
                  </button>
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {banners.map(renderBannerRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </div>
          <div className={styles.paginationButtons}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              <ChevronLeft className={styles.paginationIcon} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`${styles.paginationButton} ${currentPage === pageNum ? styles.paginationButtonActive : ""
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              <ChevronRight className={styles.paginationIcon} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Banner</h3>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    bannerId: null,
                    bannerTitle: "",
                  })
                }
                className={styles.modalCloseButton}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.modalIconWrapper}>
                <AlertCircle className={styles.modalAlertIcon} />
              </div>
              <p className={styles.modalText}>
                Are you sure you want to delete the banner{" "}
                <span className={styles.modalTextBold}>
                  "{deleteModal.bannerTitle}"
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    bannerId: null,
                    bannerTitle: "",
                  })
                }
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={`${styles.modalButton} ${styles.modalButtonDelete}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && previewModal.banner && (
        <div className={styles.modalOverlay}>
          <div className={styles.previewModal}>
            <div className={styles.previewModalHeader}>
              <h3 className={styles.modalTitle}>Banner Preview</h3>
              <button
                onClick={() => setPreviewModal({ isOpen: false, banner: null })}
                className={styles.modalCloseButton}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.previewModalContent}>
              {/* Banner Image */}
              <div className={styles.previewImageContainer}>
                {previewModal.banner.image ? (
                  <img
                    src={getImageUrl(previewModal.banner.image)}
                    alt={previewModal.banner.title}
                    className={styles.previewImage}
                    onError={(e) => {
                      e.target.src = "/placeholder-banner.png";
                      e.target.onerror = null;
                    }}
                  />
                ) : (
                  <div className={styles.previewImagePlaceholder}>
                    <ImageIcon className={styles.previewImagePlaceholderIcon} />
                  </div>
                )}
              </div>

              {/* Banner Details */}
              <div className={styles.previewDetails}>
                <div className={styles.previewField}>
                  <span className={styles.previewLabel}>Title</span>
                  <p className={styles.previewValue}>
                    {previewModal.banner.title}
                  </p>
                </div>

                {previewModal.banner.subtitle && (
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Subtitle</span>
                    <p className={styles.previewValueText}>
                      {previewModal.banner.subtitle}
                    </p>
                  </div>
                )}

                <div className={styles.previewStatusRow}>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Status</span>
                    <p>
                      <span
                        className={`${styles.bannerBadge} ${previewModal.banner.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                          }`}
                      >
                        {previewModal.banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>

                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Order</span>
                    <p className={styles.previewValueText}>
                      {previewModal.banner.order || 0}
                    </p>
                  </div>
                </div>

                {previewModal.banner.link && (
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Link</span>
                    <a
                      href={previewModal.banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.previewLink}
                    >
                      {previewModal.banner.link}
                      <ExternalLink className={styles.previewLinkIcon} />
                    </a>
                  </div>
                )}

                <div className={styles.previewField}>
                  <span className={styles.previewLabel}>Created</span>
                  <p className={styles.previewValueText}>
                    {new Date(previewModal.banner.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.previewModalFooter}>
              <button
                onClick={() => setPreviewModal({ isOpen: false, banner: null })}
                className={styles.previewCloseButton}
              >
                Close
              </button>
              {/* ✅ Updated to use handleEditBanner */}
              <button
                onClick={() => {
                  handleEditBanner(previewModal.banner._id);
                  setPreviewModal({ isOpen: false, banner: null });
                }}
                className={styles.previewEditButton}
              >
                Edit Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBanners;
