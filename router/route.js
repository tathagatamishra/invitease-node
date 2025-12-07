// router/route.js
const express = require("express");
const router = express.Router();

router.get("/debug", (req, res) => {
  let data = "😍 V1";
  return req.setEncoding({ data: data });
});

module.exports = router