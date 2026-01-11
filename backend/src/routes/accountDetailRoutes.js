import express from "express";
import multer from "multer";
import path from "path";
import {
  getAccountDetailById,
  updateGameNameByAccount,
  updateGameNameById,
  addChronById,
  uploadProfileImageById,
} from "../controllers/accountDetailController.js";

const router = express.Router();

// Multer storage for profile images (saved under backend/uploads/profiles)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "profiles"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/:id", getAccountDetailById);

// Update the game name for an account's detail by account id
router.put("/account/:accountId/game-name", updateGameNameByAccount);

// Update the game name directly by AccountDetail id
router.put("/:id/game-name", updateGameNameById);

// Award chron (minutes) to an AccountDetail by id
router.post("/:id/chron", addChronById);

// Upload / replace profile image by AccountDetail id
router.post(
  "/:id/profile-image",
  upload.single("image"),
  uploadProfileImageById
);

export default router;
