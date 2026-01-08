// Builder's backend is running on https://builder-3mjo.onrender.com

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { connectDb } from "./config/db.js";
import accountRoutes from "./routes/accountRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import itemCategoryRoutes from "./routes/itemCategoryRoutes.js";
import accountDetailRoutes from "./routes/accountDetailRoutes.js";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json()); // parse JSON request bodies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8081",
    credentials: true,
  })
);
const PORT = process.env.PORT || 5001;

connectDb();

app.get("/", (req, res) => {
  res.status(200).send("Welcome to Builder!");
});

app.use("/api/account", accountRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/item-categories", itemCategoryRoutes);
app.use("/api/account-detail", accountDetailRoutes);

// Swagger UI at /docs (serve backend/swagger.yaml)
try {
  const swaggerDocument = YAML.load(path.join(__dirname, "..", "swagger.yaml"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn(
    "Swagger UI not available (install 'swagger-ui-express' and 'yamljs')."
  );
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
