import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import { isTokenBlacklisted, blacklistToken } from "../db/tokenBlacklist.js";
import {
  getUser,
  checkUserExists,
  getLoginUserFromId,
  createAndLoginUser,
  logoutUserDB,
} from "../models/userData.js";
import { access } from "fs";

export function redirectUserToGitHub(req, res) {
  // generate state for github
  const state = crypto.randomBytes(16).toString("hex");

  // PKCE verifier
  const verifier = generateVerifier();
  const challenge = generateChallenge(verifier);

  // save state and verifier in session
  req.session.state = state;
  req.session.code_verifier = verifier;

  // constructor parameters for github request
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    state: state,
    scope: "user:email",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  // redirects the user to github with parameters
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

export async function handleGitHubCallback(req, res) {
  const { code, state } = req.query;

  if (!state || !req.session.state || state !== req.session.state) {
    return res.status(403).send("State mismatch. Potential CSRF attack.");
  }

  try {
    // trade code and verifier for Auth0 github tokens
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        code_verifier: req.session.code_verifier,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const { access_token } = tokenResponse.data;

    // get user information
    const githubUserInfo = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const githubUser = githubUserInfo.data;
    const { login, id, avatar_url } = githubUser;
    let email = githubUser.email;

    if (!email) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );

      // Find the primary email
      const primaryEmail = emailResponse.data.find((email) => email.primary);
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "No email found" });
    }

    let insightaUser;

    // check if the user already exists in the user table and add if it doesn't add user
    if (await checkUserExists(id)) {
      // get the user id and attach it to the session
      insightaUser = await getLoginUserFromId(id);
    } else {
      // add the user to the table
      insightaUser = await createAndLoginUser(login, id, avatar_url, email);
    }

    // generate tokens (3m and 5m expiries)
    const accessToken = jwt.sign(
      { id: insightaUser.id, role: insightaUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "3m" },
    );

    const refreshToken = jwt.sign(
      { id: insightaUser.id, role: insightaUser.role },
      process.env.REFRESH_SECRET,
      { expiresIn: "5m" },
    );

    // Cookie options: secure only in production, lax sameSite for cross-origin in dev
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    // Set both tokens as HTTP-only cookies
    res.cookie("access_token", accessToken, cookieOptions);
    res.cookie("refresh_token", refreshToken, cookieOptions);

    // Redirect to dashboard (no tokens exposed to client)
    const redirectUrl = req.get("Referer")
      ? new URL(req.get("Referer")).origin + "/dashboard.html"
      : process.env.FRONTEND_URL || "http://localhost:5500/dashboard.html";
    res.redirect(redirectUrl);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Authentication failed");
  }
}

export async function handleGitHubCliCallback(req, res) {
  const { code, code_verifier } = req.body;

  try {
    // trade code and verifier for Auth0 github tokens
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        code_verifier: code_verifier,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const { access_token } = tokenResponse.data;

    // get user information
    const githubUserInfo = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const githubUser = githubUserInfo.data;
    const { login, id, avatar_url } = githubUser;
    let email = githubUser.email;

    if (!email) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );

      // Find the primary email
      const primaryEmail = emailResponse.data.find((email) => email.primary);
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "No email found" });
    }

    let insightaUser;

    // check if the user already exists in the user table and add if it doesn't add user
    if (await checkUserExists(id)) {
      // get the user id and attach it to the session
      insightaUser = await getLoginUserFromId(id);
    } else {
      // add the user to the table
      insightaUser = await createAndLoginUser(login, id, avatar_url, email);
    }

    // generate tokens (3m and 5m expiries)
    const accessToken = jwt.sign(
      { id: insightaUser.id, role: insightaUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "3m" },
    );

    const refreshToken = jwt.sign(
      { id: insightaUser.id, role: insightaUser.role },
      process.env.REFRESH_SECRET,
      { expiresIn: "5m" },
    );

    // Cookie options: secure only in production, lax sameSite for cross-origin in dev
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    };

    // CLI: Set access_token in cookie and return both tokens in JSON
    res.cookie("access_token", accessToken, cookieOptions);
    res.json({
      status: "success",
      username: githubUser.login,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    console.error("CLI Callback Error:", err);
    res.status(500).json({
      status: "error",
      message: "Authentication failed",
      details: err.message,
    });
  }
}

export async function refreshToken(req, res) {
  // Get refresh token from body (CLI) or cookie (Web)
  const refresh_token = req.body.refresh_token || req.cookies.refresh_token;

  if (!refresh_token) {
    return res
      .status(400)
      .json({ status: "error", message: "No refresh token provided" });
  }

  // Verify refresh token
  try {
    // check if token has already been used (blacklisted)
    if (await isTokenBlacklisted(refresh_token)) {
      return res
        .status(401)
        .json({ status: "error", message: "Refresh token has been revoked" });
    }

    // check if it is expired and valid
    const decodedRefreshToken = jwt.verify(
      refresh_token,
      process.env.REFRESH_SECRET,
    );

    // get user id from token claims
    const userId = decodedRefreshToken.id;

    if (!(await checkUserExists(userId, false))) {
      // if user does not exist send an error message
      return res
        .status(401)
        .json({ status: "error", message: "User does not exist" });
    }

    // since user exists then issue new pair of tokens

    // blacklist the old refresh token
    await blacklistToken(refresh_token, decodedRefreshToken);

    // Get user role from DB for the new token claims
    const userForRefresh = await getUser(userId);

    // Issue a new Access Token
    const newAccessToken = jwt.sign(
      { id: userId, role: userForRefresh.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "3m",
      },
    );

    // Issue a new Refresh Token
    const newRefreshToken = jwt.sign(
      { id: userId, role: userForRefresh.role },
      process.env.REFRESH_SECRET,
      { expiresIn: "5m" },
    );

    // Cookie options: secure only in production, lax sameSite for cross-origin in dev
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    };

    // Set both tokens as HTTP-only cookies
    res.cookie("access_token", newAccessToken, cookieOptions);
    res.cookie("refresh_token", newRefreshToken, cookieOptions);

    // Return tokens in JSON (for CLI) or just success (for web)
    res.json({
      status: "success",
      refresh_token: newRefreshToken,
      access_token: newAccessToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Access Token expired at:", err.expiredAt);
      return res
        .status(401)
        .json({ status: "error", message: "Refresh Token has expired" });
    }

    console.log(err);
    res.status(401).json({ status: "error", message: "Refresh token invalid" });
  }
}

export async function logoutUser(req, res) {
  // Get refresh token from body (CLI) or cookie (Web)
  const refresh_token = req.body.refresh_token || req.cookies.refresh_token;
  const access_token =
    req.body.access_token ||
    req.cookies.access_token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (!refresh_token) {
    return res
      .status(400)
      .json({ status: "error", message: "No refresh token provided" });
  }

  try {
    // check if access/refresh token is expired and valid
    const decodedRefreshToken = jwt.verify(
      refresh_token,
      process.env.REFRESH_SECRET,
    );
    const decodedAccessToken = jwt.verify(access_token, process.env.JWT_SECRET);

    // blacklist the refresh token
    await blacklistToken(refresh_token, decodedRefreshToken);

    // blacklist the access token
    await blacklistToken(access_token, decodedAccessToken);

    // get user id from token claims
    const userId = decodedRefreshToken.id;

    // change is_active to false
    await logoutUserDB(userId);

    // Clear both cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Token expired at:", err.expiredAt);
      // Even if tokens are expired, clear both cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      return res.status(200).json({ message: "Logged out successfully" });
    }

    console.log(err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }

  res.status(200).json({ message: "Logged out successfully" });
}

// ======================= HELPER FUNCTIONS ====================================
// generate code-verifier
function generateVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

// generate code-challenger from verifier
function generateChallenge(verifier) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest()
    .toString("base64url");
}
