import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  Eye,
  Link as LinkIcon,
  Type,
  Hash,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Admin/AddBanners.module.css";

const AddBanners = ({ setActiveMenu, selectedBannerId }) => {
  // Use selectedBannerId prop instead of useParams
  const isEditMode = Boolean(selectedBannerId);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    link: "",
    order: 0,
    isActive: true,
  });

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Fetch banner data for edit mode
  useEffect(() => {
    if (isEditMode && selectedBannerId) {
      fetchBannerData();
    }
  }, [selectedBannerId, isEditMode]);

  const fetchBannerData = async () => {
    try {
      setFetchLoading(true);
      console.log("Fetching banner with ID:", selectedBannerId);

      const response = await api.get(`/admin/banners/${selectedBannerId}`);
      console.log("Banner data received:", response.data);

      if (response.data.success && response.data.banner) {
        const banner = response.data.banner;

        setFormData({
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          link: banner.link || "",
          order: banner.order || 0,
          isActive: banner.isActive !== undefined ? banner.isActive : true,
        });

        if (banner.image) {
          console.log("Setting existing image:", banner.image);
          setExistingImage(banner.image);
          setImagePreview(getImageUrl(banner.image));
        }
      }
    } catch (err) {
      console.error("Error fetching banner:", err);
      setSubmitError("Failed to load banner data");
    } finally {
      setFetchLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    console.log("File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      }));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        image: "Image size should be less than 5MB",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Image preview created");
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      console.error("Error reading file");
      setErrors((prev) => ({
        ...prev,
        image: "Error reading file. Please try again.",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    console.log("Removing image");
    setImageFile(null);
    setImagePreview(null);

    if (!isEditMode) {
      setExistingImage(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title should be less than 100 characters";
    }

    if (formData.subtitle && formData.subtitle.length > 200) {
      newErrors.subtitle = "Subtitle should be less than 200 characters";
    }

    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = "Please enter a valid URL";
    }

    if (!isEditMode && !imageFile) {
      newErrors.image = "Banner image is required";
    }

    if (formData.order < 0) {
      newErrors.order = "Order cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return string.startsWith("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    setLoading(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("subtitle", formData.subtitle.trim());
      formDataToSend.append("link", formData.link.trim());
      formDataToSend.append("order", formData.order.toString());
      formDataToSend.append("isActive", formData.isActive.toString());

      if (imageFile) {
        console.log("Appending image file to FormData:", imageFile.name);
        formDataToSend.append("image", imageFile);
      }

      console.log("FormData contents:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }

      let response;
      if (isEditMode) {
        console.log("Updating banner with ID:", selectedBannerId);
        response = await api.put(
          `/admin/banners/${selectedBannerId}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        console.log("Creating new banner");
        response = await api.post("/admin/banners", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      console.log("API response:", response.data);

      if (response.data.success) {
        setSuccessMessage(
          isEditMode
            ? "Banner updated successfully!"
            : "Banner created successfully!"
        );

        // Redirect back to banners list after short delay
        setTimeout(() => {
          setActiveMenu("banners"); // ✅ Use setActiveMenu instead of navigate
        }, 1500);
      } else {
        setSubmitError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting banner:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      setSubmitError(
        err.response?.data?.message ||
        `Failed to ${isEditMode ? "update" : "create"} banner`
      );
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${baseUrl}${imagePath}`;
  };

  if (fetchLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Loader className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading banner data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => setActiveMenu("banners")} // ✅ Use setActiveMenu
          className={styles.backButton}
        >
          <ArrowLeft className={styles.backIcon} />
          Back to Banners
        </button>

        <h1 className={styles.headerTitle}>
          {isEditMode ? "Edit Banner" : "Add New Banner"}
        </h1>
        <p className={styles.headerSubtitle}>
          {isEditMode
            ? "Update the banner details below"
            : "Fill in the details to create a new banner"}
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle className={styles.alertIcon} />
          {successMessage}
        </div>
      )}

      {submitError && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle className={styles.alertIcon} />
          {submitError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Left Column - Image Upload */}
          <div className={styles.imageSection}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <ImageIcon className={styles.sectionTitleIcon} />
                Banner Image
              </h2>

              {imagePreview ? (
                <div className={styles.imagePreviewContainer}>
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className={styles.imagePreview}
                    onError={(e) => {
                      console.error("Error loading image preview");
                      e.target.src = "/placeholder-banner.png";
                      e.target.onerror = null;
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className={styles.removeImageButton}
                  >
                    <X className={styles.removeImageIcon} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.changeImageButton}
                  >
                    <Upload className={styles.changeImageIcon} />
                    Change Image
                  </button>

                  {isEditMode && !imageFile && existingImage && (
                    <div className={styles.existingImageNote}>
                      Current banner image
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""
                    } ${errors.image ? styles.dropzoneError : ""}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload
                    className={`${styles.dropzoneIcon} ${isDragging ? styles.dropzoneIconDragging : ""
                      }`}
                  />
                  <p className={styles.dropzoneText}>
                    <span className={styles.dropzoneTextHighlight}>
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className={styles.dropzoneSubtext}>
                    PNG, JPG, GIF, or WebP (max 5MB)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileInputChange}
                className={styles.hiddenInput}
              />

              {errors.image && (
                <p className={styles.errorText}>
                  <AlertCircle className={styles.errorIcon} />
                  {errors.image}
                </p>
              )}

              <div className={styles.tipsBox}>
                <p className={styles.tipsTitle}>💡 Tips for best results:</p>
                <ul className={styles.tipsList}>
                  <li className={styles.tipItem}>
                    • Recommended size: 1920x600 pixels
                  </li>
                  <li className={styles.tipItem}>• Use high-quality images</li>
                  <li className={styles.tipItem}>
                    • Keep important content centered
                  </li>
                  <li className={styles.tipItem}>
                    • File size must be under 5MB
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className={styles.detailsSection}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Type className={styles.sectionTitleIcon} />
                Banner Details
              </h2>

              <div className={styles.formFields}>
                {/* Title */}
                <div className={styles.formField}>
                  <label htmlFor="title" className={styles.fieldLabel}>
                    Title <span className={styles.fieldLabelRequired}>*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter banner title"
                    className={`${styles.input} ${errors.title ? styles.inputError : ""
                      }`}
                    maxLength={100}
                    disabled={loading}
                  />
                  <div className={styles.inputFooter}>
                    {errors.title ? (
                      <p className={styles.errorText}>
                        <AlertCircle className={styles.errorIcon} />
                        {errors.title}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <span className={styles.charCount}>
                      {formData.title.length}/100
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                <div className={styles.formField}>
                  <label htmlFor="subtitle" className={styles.fieldLabel}>
                    Subtitle
                  </label>
                  <textarea
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Enter banner subtitle (optional)"
                    rows={3}
                    className={`${styles.input} ${styles.textarea} ${errors.subtitle ? styles.inputError : ""
                      }`}
                    maxLength={200}
                    disabled={loading}
                  />
                  <div className={styles.inputFooter}>
                    {errors.subtitle ? (
                      <p className={styles.errorText}>
                        <AlertCircle className={styles.errorIcon} />
                        {errors.subtitle}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <span className={styles.charCount}>
                      {formData.subtitle.length}/200
                    </span>
                  </div>
                </div>

                {/* Link */}
                <div className={styles.formField}>
                  <label htmlFor="link" className={styles.fieldLabel}>
                    <span className={styles.fieldLabelIcon}>
                      <LinkIcon className={styles.labelIcon} />
                      Link URL
                    </span>
                  </label>
                  <input
                    type="text"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com/page or /category/shoes"
                    className={`${styles.input} ${errors.link ? styles.inputError : ""
                      }`}
                    disabled={loading}
                  />
                  {errors.link && (
                    <p className={styles.errorText}>
                      <AlertCircle className={styles.errorIcon} />
                      {errors.link}
                    </p>
                  )}
                  <p className={styles.fieldHint}>
                    Where should users go when they click the banner?
                  </p>
                </div>

                {/* Order and Status Row */}
                <div className={styles.formRow}>
                  {/* Order */}
                  <div className={styles.formField}>
                    <label htmlFor="order" className={styles.fieldLabel}>
                      <span className={styles.fieldLabelIcon}>
                        <Hash className={styles.labelIcon} />
                        Display Order
                      </span>
                    </label>
                    <input
                      type="number"
                      id="order"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      min="0"
                      className={`${styles.input} ${errors.order ? styles.inputError : ""
                        }`}
                      disabled={loading}
                    />
                    {errors.order && (
                      <p className={styles.errorText}>
                        <AlertCircle className={styles.errorIcon} />
                        {errors.order}
                      </p>
                    )}
                    <p className={styles.fieldHint}>
                      Lower numbers appear first
                    </p>
                  </div>

                  {/* Status */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Status</label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: !prev.isActive,
                        }))
                      }
                      className={`${styles.toggleButton} ${formData.isActive ? styles.toggleButtonActive : ""
                        }`}
                      disabled={loading}
                    >
                      <div className={styles.toggleContent}>
                        {formData.isActive ? (
                          <>
                            <ToggleRight
                              className={`${styles.toggleIcon} ${styles.toggleIconActive}`}
                            />
                            <span
                              className={`${styles.toggleText} ${styles.toggleTextActive}`}
                            >
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft
                              className={`${styles.toggleIcon} ${styles.toggleIconInactive}`}
                            />
                            <span
                              className={`${styles.toggleText} ${styles.toggleTextInactive}`}
                            >
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                      <span className={styles.toggleHint}>Click to toggle</span>
                    </button>
                    <p className={styles.fieldHint}>
                      {formData.isActive
                        ? "Banner is visible on the website"
                        : "Banner is hidden from the website"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {imagePreview && formData.title && (
                <div className={styles.previewSection}>
                  <h3 className={styles.previewTitle}>
                    <Eye className={styles.previewTitleIcon} />
                    Preview
                  </h3>
                  <div className={styles.previewContainer}>
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className={styles.previewImage}
                    />
                    <div className={styles.previewOverlay}>
                      <div className={styles.previewContent}>
                        <h4 className={styles.previewContentTitle}>
                          {formData.title}
                        </h4>
                        {formData.subtitle && (
                          <p className={styles.previewContentSubtitle}>
                            {formData.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setActiveMenu("banners")} // ✅ Use setActiveMenu
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <Loader
                        className={`${styles.submitButtonIcon} ${styles.submitButtonSpinner}`}
                      />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className={styles.submitButtonIcon} />
                      {isEditMode ? "Update Banner" : "Create Banner"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddBanners;
