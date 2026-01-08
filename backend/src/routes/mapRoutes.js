import express from "express";
import { getMap } from "../controllers/mapController.js";

const router = express.Router();

// GET /api/maps/:id - return map metadata and tiles grid
router.get("/:id", getMap);

export default router;
