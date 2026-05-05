import express from "express";
import { checkAdminAccess } from "../middlewares/adminAccess.js";
import { getDashboardStats } from "../controllers/usersController.js";
import {
  handlePostProfiles,
  exportProfiles,
  handleGetProfilesById,
  handleDeleteProfilesById,
  handleGetProfilesByQueryParams,
  handleGetProfilesBySearchQueryParams,
  uploadCSVProfiles,
} from "../controllers/profilesController.js";

export const profilesRouter = express.Router();

// for the post endpoint of /api/profiles
profilesRouter.post("/", checkAdminAccess, handlePostProfiles);

// POST /api/profiles/upload — stream-ingest a CSV file of profiles
profilesRouter.post("/upload", checkAdminAccess, uploadCSVProfiles);

// for get endpoint of api/profiles/export?format=csv
profilesRouter.get("/export", checkAdminAccess, exportProfiles);

// GET /users/dashboard - Get dashboard statistics
profilesRouter.get("/dashboard", getDashboardStats);

// for get endpoint of /api/profiles for natural language query
profilesRouter.get("/search", handleGetProfilesBySearchQueryParams);

// for get endpoint of api/profiles/{id}
profilesRouter.get("/:id", handleGetProfilesById);

// for get endpoint of api/profiles
profilesRouter.get("/", handleGetProfilesByQueryParams);

profilesRouter.delete("/:id", checkAdminAccess, handleDeleteProfilesById);
