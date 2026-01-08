import express from "express";
import {
  updateGameNameByAccount,
  updateGameNameById,
} from "../controllers/accountDetailController.js";

const router = express.Router();

// Update the game name for an account's detail by account id
router.put("/account/:accountId/game-name", updateGameNameByAccount);

// Update the game name directly by AccountDetail id
router.put("/:id/game-name", updateGameNameById);

export default router;
