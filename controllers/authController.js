// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND = process.env.FRONTEND_ORIGIN;

function createToken(user) {
  const payload = { sub: user._id, email: user.email, role: user.role || 'receiver' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

exports.signupWithEmail = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email and password required" });

    const exist = await User.findOne({ email });
    if (exist) return res.status(409).json({ ok: false, message: "User already exists" });

    const user = new User({
      email,
      fullName: fullName || "",
      loginMethods: ["email"],
      verified: false,
      role: "sender" // or 'receiver' depending on your preference
    });

    await user.setPassword(password);
    await user.save();

    const token = createToken(user);
    return res.json({ ok: true, token, user: user.safeObject() });
  } catch (err) {
    console.error("signupWithEmail:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await user.checkPassword(password);
    if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = createToken(user);
    return res.json({ ok: true, token, user: user.safeObject() });
  } catch (err) {
    console.error("loginWithEmail:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/* OAuth callback handler (passport attaches req.user) */
exports.oauthCallbackHandler = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${FRONTEND}/auth/error`);

    const token = createToken(user);
    // redirect with token in fragment (frontend reads fragment)
    return res.redirect(`${FRONTEND}/auth/success#token=${token}`);
  } catch (err) {
    console.error("oauthCallbackHandler:", err);
    return res.redirect(`${FRONTEND}/auth/error`);
  }
};

/* protected profile */
exports.currentProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ ok: false });
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ ok: false });
    delete user.passwordHash;
    delete user.whatsappSession;
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("currentProfile:", err);
    return res.status(500).json({ ok: false });
  }
};

/* Logout - destroys session (Passport + express-session) */
exports.logout = (req, res) => {
  try {
    // For Passport 0.6+ req.logout requires a callback
    if (req.logout) {
      req.logout(function(err) {
        // ignore logout error but destroy session below
        if (err) console.warn('req.logout error', err);
        // destroy session
        if (req.session) {
          req.session.destroy((sdErr) => {
            // clear cookie for express-session default name 'connect.sid'
            res.clearCookie('connect.sid', { path: '/' });
            return res.json({ ok: true, message: 'Logged out (session destroyed)' });
          });
        } else {
          res.json({ ok: true, message: 'Logged out' });
        }
      });
    } else {
      // fallback: destroy session if exists
      if (req.session) {
        req.session.destroy(() => {
          res.clearCookie('connect.sid', { path: '/' });
          return res.json({ ok: true, message: 'Logged out' });
        });
      } else {
        res.json({ ok: true, message: 'Logged out' });
      }
    }
  } catch (err) {
    console.error('Logout error', err);
    res.status(500).json({ ok: false, message: 'Logout failed' });
  }
};