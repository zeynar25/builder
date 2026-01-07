import express from "express";
import {
  signin,
  signup,
  accountController,
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/", accountController);
router.post("/signin", signin);
router.post("/signup", signup);

export default router;
