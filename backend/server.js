const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.post("/api/signin", (req, res) => {
  // signin logic will go here
});

app.post("/api/signup", (req, res) => {
  // signup logic will go here
  res.status(201).send("User signed up successfully!");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
