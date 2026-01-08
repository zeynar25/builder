import express from "express";
import {
  listCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/itemCategoryController.js";

const router = express.Router();

router.get("/", listCategories);
router.post("/", createCategory);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
