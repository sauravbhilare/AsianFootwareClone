// Redux/userStore.js
import { configureStore, createSlice } from "@reduxjs/toolkit";

// ============================================
// USER SLICE WITH PERSISTENCE
// ============================================
const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: JSON.parse(localStorage.getItem("userInfo")) || null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
  },
  reducers: {
    login: (state, action) => {
      console.log("🔄 Redux Login Action:", action.payload);

      state.userInfo = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Persist to localStorage
      localStorage.setItem("userInfo", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);

      console.log("✅ User stored in Redux and localStorage:", {
        user: action.payload.user,
        role: action.payload.user.role,
        token: action.payload.token ? "Saved" : "Missing",
      });
    },
    logout: (state) => {
      console.log("🚪 Redux Logout Action");

      state.userInfo = null;
      state.token = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");

      console.log("✅ User logged out, localStorage cleared");
    },
    updateUser: (state, action) => {
      console.log("🔄 Redux Update User Action:", action.payload);

      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem("userInfo", JSON.stringify(state.userInfo));

      console.log("✅ User updated in Redux and localStorage");
    },
  },
});

export const { login, logout, updateUser } = userSlice.actions;

// ============================================
// WISHLIST SLICE
// ============================================
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    count: parseInt(localStorage.getItem("wishlistCount")) || 0,
  },
  reducers: {
    incrementWishlist: (state) => {
      state.count += 1;
      localStorage.setItem("wishlistCount", state.count);
    },
    decrementWishlist: (state) => {
      if (state.count > 0) {
        state.count -= 1;
        localStorage.setItem("wishlistCount", state.count);
      }
    },
    setWishlistCount: (state, action) => {
      state.count = action.payload;
      localStorage.setItem("wishlistCount", action.payload);
    },
    clearWishlist: (state) => {
      state.count = 0;
      localStorage.removeItem("wishlistCount");
    },
  },
});

export const {
  incrementWishlist,
  decrementWishlist,
  setWishlistCount,
  clearWishlist,
} = wishlistSlice.actions;

// ============================================
// CART SLICE
// ============================================
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    count: parseInt(localStorage.getItem("cartCount")) || 0,
    items: JSON.parse(localStorage.getItem("cartItems")) || [],
  },
  reducers: {
    incrementCart: (state) => {
      state.count += 1;
      localStorage.setItem("cartCount", state.count);
    },
    decrementCart: (state) => {
      if (state.count > 0) {
        state.count -= 1;
        localStorage.setItem("cartCount", state.count);
      }
    },
    setCartCount: (state, action) => {
      state.count = action.payload;
      localStorage.setItem("cartCount", action.payload);
    },
    setCartItems: (state, action) => {
      state.items = action.payload;
      state.count = action.payload.reduce(
        (total, item) => total + item.quantity,
        0
      );
      localStorage.setItem("cartItems", JSON.stringify(action.payload));
      localStorage.setItem("cartCount", state.count);
    },
    clearCart: (state) => {
      state.count = 0;
      state.items = [];
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cartCount");
    },
  },
});

export const {
  incrementCart,
  decrementCart,
  setCartCount,
  setCartItems,
  clearCart,
} = cartSlice.actions;

// ============================================
// CONFIGURE STORE
// ============================================
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    wishlist: wishlistSlice.reducer,
    cart: cartSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for localStorage objects
    }),
});

// ✅ Log Redux state changes (development only)
if (import.meta.env.MODE === "development") {
  store.subscribe(() => {
    const state = store.getState();
    console.log("🔄 Redux State Updated:", {
      user: state.user.userInfo,
      isAuthenticated: state.user.isAuthenticated,
      role: state.user.userInfo?.role,
    });
  });
}

export default store;
