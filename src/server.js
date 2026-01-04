import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import blockRoutes from "./routes/blocknumber.routes.js";
import lotteryRoutes from "./routes/lottery.routes.js";
import entryRoutes from "./routes/entry.routes.js";
import cutConfigRoutes from "./routes/cutConfig.routes.js";

config();
connectDB();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "https://lotto-app-one.vercel.app",
      "https://lotto-service.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(/.*/, cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use((req, res, next) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/blocknumber", blockRoutes);
app.use("/api/lottery", lotteryRoutes);
app.use("/api/entry", entryRoutes);
app.use("/api", cutConfigRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
