import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ticketsRouter from "./routes/tickets.js";
import hardwareRouter from "./routes/hardware.js";
import adminRouter from "./routes/admin.js";
import usersRouter from "./routes/users.js";
import techniciansRouter from "./routes/technicians.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use("/api/tickets", ticketsRouter);
app.use("/api/hardware", hardwareRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);
app.use("/api/technicians", techniciansRouter);

app.listen(port, () => {
    console.log("Servidor backend corriendo en http://localhost:" + port);
});
