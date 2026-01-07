import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { connectDb } from "./config/db.js";
import accountRoutes from "./routes/accountRoutes.js";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json()); // parse JSON request bodies
const PORT = process.env.PORT || 5001;

connectDb();

app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.use("/api/account", accountRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
