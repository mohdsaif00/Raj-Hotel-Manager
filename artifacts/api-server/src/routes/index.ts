import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import roomsRouter from "./rooms.js";
import bookingsRouter from "./bookings.js";
import paymentsRouter from "./payments.js";
import ordersRouter from "./orders.js";
import analyticsRouter from "./analytics.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/rooms", roomsRouter);
router.use(bookingsRouter);
router.use(paymentsRouter);
router.use(ordersRouter);
router.use(analyticsRouter);

router.post("/upload-image", authMiddleware, async (req, res) => {
  try {
    const { imageBase64, folder } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Image data required" });
      return;
    }
    const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
    const match = cloudinaryUrl.replace(/^cloudinary:\/\//, "").match(/^([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      res.status(500).json({ error: "Cloudinary not configured" });
      return;
    }
    const [, apiKey, apiSecret, cloudName] = match;
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: folder || "raj-hotel",
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("UploadImage error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
