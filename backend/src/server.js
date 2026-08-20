import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ticketsRouter from "./routes/tickets.js";
import hardwareRouter from "./routes/hardware.js";
import adminRouter from "./routes/admin.js";
import usersRouter from "./routes/users.js";
import techniciansRouter from "./routes/technicians.js";
import departmentsRouter from "./routes/departments.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// security headers
app.use(helmet());

// rate limit (adjust as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS: whitelist origins from FRONTEND_URL env var (comma-separated)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools like Postman or server-to-server
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use("/api/tickets", ticketsRouter);
app.use("/api/hardware", hardwareRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/departments", departmentsRouter);

app.listen(port, () => {
  console.log("Servidor backend corriendo en http://localhost:" + port);
});

export default app;
