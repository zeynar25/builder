import accountRoutes from "./routes/accountRoutes.js";

const express = require("express");
const app = express();

router.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.use("/api/account", accountRoutes);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
