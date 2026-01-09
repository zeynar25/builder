import express from "express";
import {
  getAccountDetailById,
  updateGameNameByAccount,
  updateGameNameById,
} from "../controllers/accountDetailController.js";

const router = express.Router();

router.get("/:id", getAccountDetailById);

// Update the game name for an account's detail by account id
router.put("/account/:accountId/game-name", updateGameNameByAccount);

// Update the game name directly by AccountDetail id
router.put("/:id/game-name", updateGameNameById);

export default router;
