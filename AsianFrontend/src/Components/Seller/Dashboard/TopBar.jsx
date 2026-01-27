import React, { useState, useRef, useEffect } from "react";
import styles from "../../../Styles/Seller/TopBar.module.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axiosConfig.js";
import { logout } from "../../../Redux/userStore";
import ProfileModal from "../../../Modals/ProfileModal.jsx";
import { FaUserCircle, FaUser, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";

const TopBar = () => {
  const user = useSelector((state) => state.user.userInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleLogin = () => {
    setDropdownOpen(false);
    navigate("/login");
  };

  // ✅ UPDATED LOGOUT FUNCTION
  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      const response = await api.post("/auth/logout"); // ← Changed GET to POST
      if (response.data.success) {
        dispatch(logout());
        alert(response.data.message);
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Still logout locally even if API fails
      dispatch(logout());
      navigate("/");
    }
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className={styles["top-bar"]}>
        <div className={styles["logo-section"]}>
          <img
            src="https://cdn.asianlive.in/digital-website/logo_9971506315137345656.png?tr=w-200"
            alt="Asian Footwears Logo"
            className={styles["brand-logo"]}
          />
        </div>

        <div
          className={styles["user-info"]}
          ref={dropdownRef}
          onClick={toggleDropdown}
        >
          <div className={styles["user-icon"]}>
            <FaUserCircle size={24} />
          </div>

          <span className={styles["user-name"]}>
            Hi, {user && user.name ? user.name : "Seller"}
          </span>

          {dropdownOpen && (
            <div
              className={styles["user-dropdown"]}
              onClick={(e) => e.stopPropagation()}
            >
              {user && user.userId ? (
                <>
                  <button onClick={handleProfileClick}>
                    <FaUser /> Profile
                  </button>
                  <button onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </>
              ) : (
                <button onClick={handleLogin}>
                  <FaSignInAlt /> Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {profileModalOpen && (
        <ProfileModal
          user={user}
          onClose={closeProfileModal}
          isOpen={profileModalOpen}
        />
      )}
    </>
  );
};

export default TopBar;
