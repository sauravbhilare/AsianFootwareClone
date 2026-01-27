import React, { useState, useEffect, useRef } from "react";
import styles from "../../Styles/SingleProduct/ImageGallery.module.css";

const ImageGallery = ({ images, variants = [], selectedColorIndex = 0 }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const imageWrapperRef = useRef(null);

  // Get images for selected color variant
  const getImagesForVariant = (variantIndex) => {
    if (variants[variantIndex]?.images?.length > 0) {
      return variants[variantIndex].images;
    }
    return images;
  };

  const currentVariantImages = getImagesForVariant(selectedColorIndex);



  // Handle mouse move for zoom position - FIXED
  const handleMouseMove = (e) => {
    if (!imageWrapperRef.current) return;

    const rect = imageWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // X position within the wrapper
    const y = e.clientY - rect.top; // Y position within the wrapper
    const width = rect.width;
    const height = rect.height;

    // Calculate percentage position (0-100)
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    // Update zoom transform origin to follow cursor
    setZoomStyle({
      transformOrigin: `${xPercent}% ${yPercent}%`,
    });
  };

  // Reset zoom when mouse leaves
  const handleMouseLeave = () => {
    setIsZoomed(false);
    setZoomStyle({});
  };

  return (
    <div className={styles.galleryContainer}>
      {/* Left Column: Thumbnails */}
      <div className={styles.thumbnailColumn}>
        <button
          className={styles.navButton}
          onClick={() => {
            if (selectedImageIndex > 0) {
              setSelectedImageIndex(selectedImageIndex - 1);
            }
          }}
          disabled={selectedImageIndex === 0}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>

        <div className={styles.thumbnailList}>
          {currentVariantImages.map((img, index) => (
            <div
              key={`${selectedColorIndex}-${index}`}
              className={`${styles.thumbnailWrapper} ${index === selectedImageIndex ? styles.selected : ""
                }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={img}
                alt={`Thumbnail ${index}`}
                className={styles.thumbnailImage}
                onError={(e) => {
                  e.target.src = "/api/placeholder/100/100?text=No+Image";
                }}
              />
            </div>
          ))}
        </div>

        <button
          className={styles.navButton}
          onClick={() => {
            if (selectedImageIndex < currentVariantImages.length - 1) {
              setSelectedImageIndex(selectedImageIndex + 1);
            }
          }}
          disabled={selectedImageIndex === currentVariantImages.length - 1}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {/* Middle Column: Main Image with Cursor-Following Zoom */}
      <div
        className={styles.mainImageWrapper}
        ref={imageWrapperRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <img
          src={currentVariantImages[selectedImageIndex]}
          alt="Selected Product"
          className={`${styles.mainImage} ${isZoomed ? styles.zoomed : ""}`}
          style={isZoomed ? zoomStyle : {}}
          onError={(e) => {
            e.target.src = "/api/placeholder/600/600?text=No+Image";
          }}
        />

        {/* Zoom indicator icon */}
        <div
          className={`${styles.zoomIndicator} ${isZoomed ? styles.zoomActive : ""
            }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
