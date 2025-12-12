// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connection");
const route = require("./router/route");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://invitease.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server / curl
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-email",
      "x-email-token",
    ],
  })
);

app.use(express.json());

// -------------------------------
const passport = require("passport");
const session = require("express-session");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
    // https --> secure:true || http --> secure:false
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport");
// -------------------------------

app.use(route);
connectDB();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running...`);
});
