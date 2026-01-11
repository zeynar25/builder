import express from "express";
import {
  getMap,
  updateMapName,
  expandMap,
} from "../controllers/mapController.js";

const router = express.Router();

// GET /api/maps/:id - return map metadata and tiles grid
// list maps by account id
import { getMapsByAccount } from "../controllers/mapController.js";

router.get("/account/:accountId", getMapsByAccount);

// GET /api/maps/:id - return map metadata and tiles grid
router.get("/:id", getMap);

// Update map name
router.put("/:id/name", updateMapName);

// Expand map dimensions, spending chrons
router.post("/:id/expand", expandMap);

export default router;
