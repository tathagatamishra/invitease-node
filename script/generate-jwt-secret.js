// generate-jwt-secret.js
import crypto from "crypto";

const SECRET_LENGTH = 64; // 64 bytes = 512-bit strength

const jwtSecret = crypto.randomBytes(SECRET_LENGTH).toString("hex");

console.log("\nSecure JWT Secret Generated:\n");
console.log(jwtSecret);
console.log("\nSave this in your .env file as:\n");
console.log(`JWT_SECRET=${jwtSecret}\n`);

// node generate-jwt-secret.js
// or
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
