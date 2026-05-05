import { parseSearchQuery } from "../util/parseSearchQuery.js";

export async function normalizeSearchQuery(req, res, next) {
  if (req.path === "/search" && req.query.q) {
    req.parsedFilters = await parseSearchQuery(req.query.q);
  }
  next();
}
