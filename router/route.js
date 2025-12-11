// router/route.js
const express = require("express");
const router = express.Router();
const { getCloudSignature } = require("../controllers/cloudinaryCtrl");
const { uploadGalleryImage } = require("../controllers/galleryCtrl");

router.post("/cloud/signature", getCloudSignature);

router.post("/gallery/upload", uploadGalleryImage);

router.get("/debug", (req, res) => {
  let data = "😍 V1";
  return res.send({ data: data });
});

module.exports = router;
