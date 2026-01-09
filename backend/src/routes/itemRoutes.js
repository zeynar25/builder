import express from "express";
import {
  shop,
  buyItem,
  sellPlacement,
  movePlacement,
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

router.post("/buy", buyItem);
router.post("/sell", sellPlacement);
router.post("/move", movePlacement);

export default router;
