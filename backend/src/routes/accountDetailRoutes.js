import express from "express";
import {
  getAccountDetailById,
  updateGameNameByAccount,
  updateGameNameById,
  addChronById,
} from "../controllers/accountDetailController.js";

const router = express.Router();

router.get("/:id", getAccountDetailById);

// Update the game name for an account's detail by account id
router.put("/account/:accountId/game-name", updateGameNameByAccount);

// Update the game name directly by AccountDetail id
router.put("/:id/game-name", updateGameNameById);

// Award chron (minutes) to an AccountDetail by id
router.post("/:id/chron", addChronById);

export default router;
