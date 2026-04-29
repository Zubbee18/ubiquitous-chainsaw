import jwt from "jsonwebtoken";
import { getUser, checkUserExists } from "../models/userData.js";
import { isTokenBlacklisted, blacklistToken } from "../db/tokenBlacklist.js";

export async function authenticateUser(req, res, next) {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res
      .status(400)
      .json({ status: "error", message: "No access token" });
  }

  try {
    // check if the token is expired or valid - if not, error
    const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    console.log("Token is valid:", decodedAccessToken);

    // get user id from token claims
    const id = decodedAccessToken.id;

    // check if the user exists then attach the user to request and move forward
    if (await checkUserExists(id, false)) {
      console.log(id);
      req.user = await getUser(id);
      return next();
    }

    // if user does not exist send an error message
    return res
      .status(401)
      .json({ status: "error", message: "User does not exist" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Access Token expired at:", err.expiredAt);

      // Try to refresh token automatically for web clients (using cookie)
      if (req.cookies.refresh_token) {
        try {
          const refreshToken = req.cookies.refresh_token;

          // Check if refresh token is blacklisted
          if (await isTokenBlacklisted(refreshToken)) {
            return res.status(401).json({
              status: "error",
              message: "Session expired. Please log in again.",
            });
          }

          // Verify refresh token
          const decodedRefreshToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET,
          );
          const userId = decodedRefreshToken.id;

          // Check if user exists
          if (!(await checkUserExists(userId, false))) {
            return res
              .status(401)
              .json({ status: "error", message: "User does not exist" });
          }

          // Blacklist old tokens
          await blacklistToken(refreshToken, decodedRefreshToken);
          if (accessToken) {
            try {
              const oldDecoded = jwt.decode(accessToken);
              await blacklistToken(accessToken, oldDecoded);
            } catch (err) {
              throw new Error("Token cannot be decoded", err);
            }
          }

          // Issue new tokens
          const userForAutoRefresh = await getUser(userId);
          const newAccessToken = jwt.sign(
            { id: userId, role: userForAutoRefresh.role },
            process.env.JWT_SECRET,
            { expiresIn: "3m" },
          );

          const newRefreshToken = jwt.sign(
            { id: userId, role: userForAutoRefresh.role },
            process.env.REFRESH_SECRET,
            { expiresIn: "5m" },
          );

          // Set new tokens as HTTP-only cookies
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          };
          res.cookie("access_token", newAccessToken, cookieOptions);
          res.cookie("refresh_token", newRefreshToken, cookieOptions);

          // Attach user and continue
          req.user = await getUser(userId);
          console.log("Token auto-refreshed for web client");
          return next();
        } catch (refreshErr) {
          console.log("Auto-refresh failed:", refreshErr.message);
          return res.status(401).json({
            status: "error",
            message: "Refresh token expired. Please log in again.",
          });
        }
      }

      // For CLI or when no refresh token in cookie, return error
      return res
        .status(400)
        .json({ status: "error", message: "Access Token has expired" });
    }

    console.log(err);

    if (err.message === "invalid signature") {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid Access Token" });
    }
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error. Authentication Failed",
    });
  }
}
