import express from "express";
const router = express.Router();
export default router;

router.post("/signin", (req, res) => {
  // signin logic will go here
  res.status(200).send({ message: "User signed in successfully!" });
});

router.post("/signup", (req, res) => {
  // signup logic will go here
  res.status(201).send({ message: "User signed up successfully!" });
});
