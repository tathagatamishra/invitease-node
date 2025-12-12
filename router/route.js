// router/route.js
const express = require("express");
const router = express.Router();

const { getCloudSignature } = require("../controllers/cloudinaryCtrl");
const { uploadGalleryImage } = require("../controllers/galleryCtrl");
const { verifyToken } = require("../middlewares/authMiddleware");

const authCtrl = require("../controllers/authController");
const passport = require("passport");

// existing routes
router.post("/cloud/signature", getCloudSignature);
router.post("/gallery/upload", uploadGalleryImage);

router.get("/debug", (req, res) => {
  let data = "😃 V1";
  return res.send({ data: data });
});

// email
router.post("/auth/signup", authCtrl.signupWithEmail);
router.post("/auth/login", authCtrl.loginWithEmail);
router.get("/auth/logout", authCtrl.logout);

// Protected profile
router.get("/auth/profile", verifyToken, authCtrl.currentProfile);

// google
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    session: false,
  }),
  authCtrl.oauthCallbackHandler
);

// ___________________________________________________
// facebook
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/auth/failure",
    session: false,
  }),
  authCtrl.oauthCallbackHandler
);
// linkedin
router.get("/auth/linkedin", passport.authenticate("linkedin"));
router.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: "/auth/failure",
    session: false,
  }),
  authCtrl.oauthCallbackHandler
);
// ___________________________________________________
router.get("/auth/failure", (req, res) =>
  res.status(401).json({ ok: false, message: "Authentication failed" })
);

module.exports = router;
