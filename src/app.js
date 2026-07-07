process.env.TZ = 'Asia/Kolkata';
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import auth from "./routes/auth.js";
import patient from "./routes/patient.js";
import hospitalRoutes from "./routes/hospital.js";
import staffRoutes from "./routes/staff.js";
import { authenticate } from "./middleware/authMiddleware.js";
import doctorRoutes from "./routes/doctor.js";
import globalRoutes from "./routes/global.js";
import { connectRedis } from "./utils/redis.js";
dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://q-medix-fe.vercel.app",
  "https://q-medix-fe.vercel.app/",
  `http://localhost:${process.env.FRONTEND_PORT || 5173}`,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
connectRedis();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});


app.use("/auth",auth);
app.use("/patient",patient);
app.use("/doctor",doctorRoutes);
app.use("/hospital", hospitalRoutes);
app.use("/staff", staffRoutes);
app.use("/global",globalRoutes);
app.use(errorHandler);

export default app;
