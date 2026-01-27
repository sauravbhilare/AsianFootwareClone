// Pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "../../Styles/Admin/AdminDashboard.module.css";
import AdminTopBar from "../../Components/Admin/Dashboard/AdminTopBar";
import AdminVerticalNavbar from "../../Components/Admin/Dashboard/AdminVerticalNavbar";
import AdminMainContent from "../../Components/Admin/Dashboard/AdminMainContent";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  // State management for different entities
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBannerId, setSelectedBannerId] = useState(null);

  // Protection is handled by ProtectedRoute

  if (!user || user.role !== "admin") {
    // Fallback just in case, though ProtectedRoute should handle it
    return null;
  }

  return (
    <div className={styles["admin-dashboard"]}>
      <AdminTopBar />
      <div className={styles["dashboard-body"]}>
        <AdminVerticalNavbar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <AdminMainContent
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          selectedSellerId={selectedSellerId}
          setSelectedSellerId={setSelectedSellerId}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          selectedOrderId={selectedOrderId}
          setSelectedOrderId={setSelectedOrderId}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          selectedBannerId={selectedBannerId}
          setSelectedBannerId={setSelectedBannerId}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
