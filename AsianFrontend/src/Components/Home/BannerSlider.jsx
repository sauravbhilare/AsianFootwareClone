import React, { useState, useEffect, useRef } from "react";
import styles from "../../Styles/Home/BannerSlider.module.css";
import api from "../../services/axiosConfig";

// Import default images as fallback
import banner1 from "../../assets/banner.png";
// import banner2 from "../../assets/banner.png";
// import banner3 from "../../assets/banner.png";

const defaultImages = [banner1];

function BannerSlider() {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Track failed images to prevent infinite loop
  const failedImagesRef = useRef(new Set());

  // Fetch banners from API
  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      failedImagesRef.current.clear();

      const response = await api.get("/public/banners");

      console.log("📦 Banner Response:", response.data);

      if (
        response.data.success &&
        response.data.banners &&
        response.data.banners.length > 0
      ) {
        // ✅ Use imageUrl (full URL) from response
        const bannerImages = response.data.banners
          .map((banner) => {
            console.log("🖼️ Banner URL:", banner.imageUrl);
            return banner.imageUrl;
          })
          .filter((url) => url); // Filter out null/undefined

        if (bannerImages.length > 0) {
          setImages(bannerImages);
          console.log("✅ Loaded", bannerImages.length, "banners from API");
        } else {
          console.log("⚠️ No valid banner URLs, using defaults");
          setImages(defaultImages);
        }
      } else {
        console.log("⚠️ No banners found, using defaults");
        setImages(defaultImages);
      }
    } catch (error) {
      console.error("❌ Error fetching banners:", error);
      console.log("⚠️ Using default banner images");
      setImages(defaultImages);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto slide every 3 seconds
  useEffect(() => {
    if (images.length > 1 && !isLoading) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [images.length, isLoading]);

  // ✅ Handle image error - PREVENTS INFINITE LOOP
  const handleImageError = (e) => {
    const failedUrl = e.target.src;

    // Prevent handling same error multiple times
    if (failedImagesRef.current.has(failedUrl)) {
      return;
    }

    console.error("❌ Image failed:", failedUrl);
    failedImagesRef.current.add(failedUrl);

    // Remove onerror to prevent loop
    e.target.onerror = null;

    // Use default image
    e.target.src = defaultImages[0];
  };

  // Get current image safely
  const currentImage = images[index] || defaultImages[0];

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.sliderContainer}>
        <div className={styles.slider}>
          <img
            src={defaultImages[0]}
            alt="loading banner"
            className={styles.image}
          />
        </div>
        <div className={styles.indicators}>
          {defaultImages.map((_, i) => (
            <div
              key={i}
              className={`${styles.line} ${index === i ? styles.active : ""}`}
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.slider}>
        <img
          key={`banner-${index}`} // ✅ Force re-render on index change
          src={currentImage}
          alt={`banner ${index + 1}`}
          className={styles.image}
          onError={handleImageError}
        />
      </div>

      {/* Bottom Indicator Lines */}
      <div className={styles.indicators}>
        {images.map((_, i) => (
          <div
            key={i}
            className={`${styles.line} ${index === i ? styles.active : ""}`}
            onClick={() => setIndex(i)}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default BannerSlider;
