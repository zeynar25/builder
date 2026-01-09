import express from "express";
import {
  shop,
  buyItem,
  createItem,
  getItem,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

const router = express.Router();

router.get("/", shop);
router.post("/", createItem);
router.get("/:id", getItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

router.patch("/buy/:id", buyItem);

export default router;
