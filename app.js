import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { RedisStore } from "connect-redis";
import redisClient from "./db/redisClient.js";
import { createUsersTable } from "./db/createTable.js";
import { authenticateUser } from "./middlewares/authenticate.js";
import { checkHeaderVersion } from "./middlewares/checkHeader.js";
import { classifyRouter } from "./routes/classifyRouter.js";
import { profilesRouter } from "./routes/profilesRouter.js";
import { usersRouter } from "./routes/usersRouter.js";
import { createTable } from "./db/createTable.js";
import { authRouter } from "./routes/auth.js";
import { authLimiter, apiLimiter } from "./middlewares/rateLimit.js";

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  }),
);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

await createUsersTable();

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
    );
  });
  next();
});

app.use("/auth", authLimiter, authRouter);

app.use("/api/classify", apiLimiter, authenticateUser, classifyRouter);

app.use(
  "/api/profiles",
  apiLimiter,
  authenticateUser,
  checkHeaderVersion,
  profilesRouter,
);

app.use(
  "/api/users",
  apiLimiter,
  authenticateUser,
  checkHeaderVersion,
  usersRouter,
);

app.use((req, res) => {
  res.status(404).json({
    error: "Invalid endpoint",
    message:
      "Endpoint is invalid. Check the API documentation for more information",
  });
});

startServer();

async function startServer() {
  try {
    await createTable();
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`This server is listening on port: ${PORT}`),
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
