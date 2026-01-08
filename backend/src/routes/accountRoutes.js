import express from "express";
import { signin, signup } from "../controllers/accountController.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);

export default router;
