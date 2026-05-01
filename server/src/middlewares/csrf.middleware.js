import crypto from "crypto";
import { csrfCookieOptions } from "../utils/cookieOptions.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh-token",
  "/api/auth/csrf-token",
]);

export const issueCsrfToken = (req, res) => {
  const csrfToken = crypto.randomBytes(24).toString("hex");
  return res
    .cookie("csrfToken", csrfToken, csrfCookieOptions())
    .status(200)
    .json({ csrfToken });
};

export const verifyCsrfToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("x-csrf-token");

  // console.log("CSRF Validation - Cookie Token:", cookieToken);
  // console.log("CSRF Validation - Header Token:", headerToken);

  // Bypass CSRF in development mode for easy Postman testing
  if (process.env.NODE_ENV !== "production") {
    // console.log("Development mode: Bypassing CSRF check");
    return next();
  }

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
};
