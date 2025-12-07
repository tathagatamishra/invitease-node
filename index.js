// index.js
require("@dotenvx/dotenvx").config();
const express = require("express");
const cors = require("cors");
const route = require("./router/route");
const connectDB = require("./db/connection");

const app = express();

app.use(cors());
app.use(express.json());
app.use(route);
connectDB()

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("server running on " + PORT);
});
