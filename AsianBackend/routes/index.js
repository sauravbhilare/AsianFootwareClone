// routes/index.js
import { Router } from "express";
import authRouter from "./auth.route.js";
import sellerRoute from "./seller.routes.js";
import adminRoute from "./admin.route.js";
import adminUploadRoute from "./adminUpload.routes.js";
import uploadRoute from "./upload.routes.js";
import { isRoleSeller } from "../middlewears/isRoleSeller.js";
import tokenDecoder from "../middlewears/tokenMiddlewears.js";
import productRoute from "./product.routes.js";
import publicRouter from "./public.route.js";
import publicProductRouter from "./public.product.routes.js";
import wishlistRouter from "./wishlist.route.js";
import userRouter from "./user.route.js";
import isRoleAdmin from "../middlewears/isRoleAdmin.js";

const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/seller", tokenDecoder, isRoleSeller, sellerRoute);
mainRouter.use("/admin", tokenDecoder, isRoleAdmin, adminRoute);
mainRouter.use("/admin/upload", adminUploadRoute);
mainRouter.use("/upload", uploadRoute);
mainRouter.use("/product", tokenDecoder, productRoute);
mainRouter.use("/public", publicRouter);
mainRouter.use("/public-products", publicProductRouter);
mainRouter.use("/wishlist", wishlistRouter);
mainRouter.use("/user", userRouter);

export default mainRouter;
