import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { connectDb } from "./config/db.js";
import accountRoutes from "./routes/accountRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import itemCategoryRoutes from "./routes/itemCategoryRoutes.js";
import express from "express";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json()); // parse JSON request bodies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
const PORT = process.env.PORT || 5001;

connectDb();

app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.use("/api/account", accountRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/item-categories", itemCategoryRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
