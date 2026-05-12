import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  console.warn("Warning: JWT_SECRET should be set to a long random string (>= 16 chars).");
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret ?? "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
};
