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

app.set("trust proxy", 1);

app.use(cors());

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

await createUsersTable();

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
  checkHeaderVersion,
  authenticateUser,
  profilesRouter,
);

app.use(
  "/api/users",
  apiLimiter,
  checkHeaderVersion,
  authenticateUser,
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
