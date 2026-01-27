// OrderDetails.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiCopy,
  FiCheck,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiHelpCircle,
  FiRefreshCw,
  FiMessageSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { BsBox, BsReceipt } from "react-icons/bs";
import { MdLocalShipping, MdDeliveryDining } from "react-icons/md";
import { HiOutlineReceiptRefund } from "react-icons/hi";
import api from "../../services/axiosConfig";
import styles from "../../Styles/Orders/OrderDetails.module.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/product/getOrderById/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <FiClock size={16} />;
      case "confirmed":
        return <FiCheckCircle size={16} />;
      case "shipped":
        return <FiTruck size={16} />;
      case "out for delivery":
        return <MdDeliveryDining size={16} />;
      case "delivered":
        return <FiCheckCircle size={16} />;
      case "cancelled":
        return <FiXCircle size={16} />;
      default:
        return <FiClock size={16} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return styles.statusPending;
      case "confirmed":
        return styles.statusConfirmed;
      case "shipped":
        return styles.statusShipped;
      case "out for delivery":
        return styles.statusOutForDelivery;
      case "delivered":
        return styles.statusDelivered;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getTrackingSteps = () => {
    const steps = [
      { key: "ordered", label: "Order Placed", icon: FiPackage },
      { key: "confirmed", label: "Confirmed", icon: FiCheckCircle },
      { key: "shipped", label: "Shipped", icon: MdLocalShipping },
      {
        key: "out for delivery",
        label: "Out for Delivery",
        icon: MdDeliveryDining,
      },
      { key: "delivered", label: "Delivered", icon: FiCheck },
    ];

    const statusOrder = [
      "pending",
      "confirmed",
      "shipped",
      "out for delivery",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(order?.orderStatus?.toLowerCase());

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <FiAlertCircle size={48} />
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button onClick={() => navigate("/orders")}>
            <FiArrowLeft size={14} /> Back to Orders
          </button>
          <button onClick={fetchOrder}>
            <FiRefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps();

  return (
    <div className={styles.wrapper}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => navigate("/orders")}>
        <FiArrowLeft size={16} />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className={styles.orderHeader}>
        <div className={styles.headerLeft}>
          <h1>Order Details</h1>
          <div className={styles.orderIdRow}>
            <span className={styles.orderId}>{order?.orderId}</span>
            <button className={styles.copyBtn} onClick={copyOrderId}>
              {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className={styles.orderDate}>
            Placed on {formatDateTime(order?.createdAt)}
          </p>
        </div>
        <div
          className={`${styles.statusBadge} ${getStatusClass(
            order?.orderStatus
          )}`}
        >
          {getStatusIcon(order?.orderStatus)}
          <span>{order?.orderStatus}</span>
        </div>
      </div>

      {/* Order Tracking */}
      {order?.orderStatus?.toLowerCase() !== "cancelled" && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>
              <FiTruck size={16} /> Order Tracking
            </h2>
          </div>

          <div className={styles.trackingContainer}>
            <div className={styles.trackingLine}>
              <div
                className={styles.trackingProgress}
                style={{
                  width: `${(trackingSteps.filter((s) => s.completed).length - 1) * 25
                    }%`,
                }}
              />
            </div>
            <div className={styles.trackingSteps}>
              {trackingSteps.map((step, index) => (
                <div
                  key={step.key}
                  className={`${styles.trackingStep} ${step.completed ? styles.completed : ""
                    } ${step.current ? styles.current : ""}`}
                >
                  <div className={styles.stepIcon}>
                    <step.icon size={16} />
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {order?.expectedDelivery && order?.orderStatus !== "delivered" && (
            <div className={styles.expectedDelivery}>
              <FiClock size={14} />
              <span>
                Expected Delivery:{" "}
                <strong>{formatDate(order.expectedDelivery)}</strong>
              </span>
            </div>
          )}
        </section>
      )}

      <div className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Order Items */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>
                <BsBox size={16} /> Items Ordered ({order?.products?.length})
              </h2>
            </div>

            <div className={styles.itemsList}>
              {order?.products?.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <img
                      src={item.imgUrl || item.product?.imgUrl}
                      alt={item.title || item.product?.title}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h4>{item.title || item.product?.title}</h4>
                    <div className={styles.itemMeta}>
                      {item.size && (
                        <span className={styles.metaItem}>
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className={styles.metaItem}>
                          Color: {item.color}
                        </span>
                      )}
                      <span className={styles.metaItem}>
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className={styles.itemPriceRow}>
                      <span className={styles.itemPrice}>
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                      <span
                        className={`${styles.itemStatus} ${getStatusClass(
                          item.productStatus
                        )}`}
                      >
                        {item.productStatus || "Processing"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.itemActionBtn}>
                      <BsReceipt size={12} /> Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Address */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>
                <FiMapPin size={16} /> Delivery Address
              </h2>
            </div>

            <div className={styles.addressContent}>
              <p className={styles.name}>{order?.shippingAddress?.name}</p>
              <p className={styles.addr}>{order?.shippingAddress?.address}</p>
              <p className={styles.addr}>
                {order?.shippingAddress?.city}, {order?.shippingAddress?.state}{" "}
                - {order?.shippingAddress?.pincode}
              </p>
              <p className={styles.phone}>
                <FiPhone size={12} />
                {order?.shippingAddress?.phone}
              </p>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className={styles.rightCol}>
          {/* Payment Summary */}
          <div className={styles.sideCard}>
            <h3>
              <BsReceipt size={14} /> Payment Summary
            </h3>

            <div className={styles.paymentInfo}>
              <div className={styles.payRow}>
                <span>Payment Method</span>
                <span>{order?.paymentMethod}</span>
              </div>
              <div className={styles.payRow}>
                <span>Payment Status</span>
                <span className={styles.paymentStatus}>
                  {order?.paymentStatus}
                </span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.priceDetails}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <span>₹{Number(order?.totalAmount || 0).toFixed(2)}</span>
              </div>
              {order?.couponDiscount > 0 && (
                <div className={styles.priceRow}>
                  <span>Coupon Discount</span>
                  <span className={styles.discount}>
                    -₹{Number(order.couponDiscount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className={styles.priceRow}>
                <span>Delivery</span>
                <span
                  className={order?.deliveryCharges === 0 ? styles.free : ""}
                >
                  {order?.deliveryCharges === 0
                    ? "FREE"
                    : `₹${order?.deliveryCharges}`}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span>Total Amount</span>
                <span>₹{Number(order?.finalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.sideCard}>
            <h3>Quick Actions</h3>
            <div className={styles.actionsList}>
              <button className={styles.actionBtn}>
                <FiDownload size={14} />
                Download Invoice
              </button>
              {order?.orderStatus !== "delivered" &&
                order?.orderStatus !== "cancelled" && (
                  <button className={styles.actionBtn}>
                    <FiXCircle size={14} />
                    Cancel Order
                  </button>
                )}
              {order?.orderStatus === "delivered" && (
                <button className={styles.actionBtn}>
                  <HiOutlineReceiptRefund size={14} />
                  Return/Refund
                </button>
              )}
              <button className={styles.actionBtn}>
                <FiMessageSquare size={14} />
                Contact Support
              </button>
            </div>
          </div>

          {/* Help */}
          <div className={styles.helpCard}>
            <FiHelpCircle size={18} />
            <div>
              <h4>Need Help?</h4>
              <p>Contact us for any queries regarding your order.</p>
              <a href="mailto:support@example.com">support@example.com</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetails;
