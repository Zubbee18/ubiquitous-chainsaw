import { db } from "../db/openDBConnection.js";
import { getCountryIdFromQuery } from "../util/getCountryIdFromQuery.js";

export async function retrieveProfileDataByQueryParams(
  query,
  baseUrl = "/api/profiles",
) {
  const {
    gender,
    country_id,
    age_group,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by,
    order,
    page,
    limit,
  } = query;

  let sqlQuery = "SELECT * FROM profiles";
  let param = [];
  let filterConditions = [];
  let paramIndex = 1;

  // Build filter conditions
  if (gender) {
    filterConditions.push(`gender = $${paramIndex++}`);
    param.push(gender.toLowerCase());
  }

  if (country_id) {
    filterConditions.push(`country_id = $${paramIndex++}`);
    param.push(country_id.toUpperCase());
  }

  if (age_group) {
    filterConditions.push(`age_group = $${paramIndex++}`);
    param.push(age_group.toLowerCase());
  }

  if (min_age) {
    filterConditions.push(`age >= $${paramIndex++}`);
    param.push(min_age);
  }

  if (max_age) {
    filterConditions.push(`age <= $${paramIndex++}`);
    param.push(max_age);
  }

  if (min_gender_probability) {
    filterConditions.push(`gender_probability >= $${paramIndex++}`);
    param.push(min_gender_probability);
  }

  if (min_country_probability) {
    filterConditions.push(`country_probability >= $${paramIndex++}`);
    param.push(min_country_probability);
  }

  if (filterConditions.length > 0) {
    sqlQuery += " WHERE " + filterConditions.join(" AND ");
  }

  // Add ORDER BY clause (column names can't be parameterized)
  if (
    sort_by &&
    ["age", "created_at", "gender_probability"].includes(sort_by)
  ) {
    const orderDirection =
      order && ["ASC", "DESC"].includes(order.toUpperCase())
        ? order.toUpperCase()
        : "ASC";
    sqlQuery += ` ORDER BY ${sort_by} ${orderDirection}`;
  } else if (
    sort_by &&
    !["age", "created_at", "gender_probability"].includes(sort_by)
  ) {
    return {
      message: "Invalid query parameters",
    };
  }

  // Add pagination
  const currentPage = parseInt(page) || 1;
  const currentLimit = Math.min(parseInt(limit) || 10, 50);
  const offset = (currentPage - 1) * currentLimit;

  sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  param.push(currentLimit, offset);

  try {
    // Get the total count and data
    // PostgreSQL: db.query() returns an object with a 'rows' array
    const countResult = await db.query(
      "SELECT COUNT(*) AS total FROM profiles",
    );
    const dataResult = await db.query(sqlQuery, param);

    const totalEntries = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalEntries / currentLimit);

    // Generate pagination links
    const links = generatePaginationLinks(
      baseUrl,
      currentPage,
      totalPages,
      query,
    );

    return {
      data: dataResult.rows, // Access the rows array from the result
      pagination: {
        currentPage: currentPage,
        pageLimit: currentLimit,
        totalEntries: totalEntries,
        totalPages: totalPages,
      },
      links: links,
      message: "successful",
    };
  } catch (err) {
    throw new Error(`Data could not be retrieved: ${err.message}`);
  }
}

export async function retrieveProfileDataForExport(query) {
  const {
    gender,
    country_id,
    age_group,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by,
    order,
    page,
    limit,
  } = query;

  let sqlQuery = "SELECT * FROM profiles";
  let param = [];
  let filterConditions = [];
  let paramIndex = 1;

  // Build filter conditions
  if (gender) {
    filterConditions.push(`gender = $${paramIndex++}`);
    param.push(gender.toLowerCase());
  }

  if (country_id) {
    filterConditions.push(`country_id = $${paramIndex++}`);
    param.push(country_id.toUpperCase());
  }

  if (age_group) {
    filterConditions.push(`age_group = $${paramIndex++}`);
    param.push(age_group.toLowerCase());
  }

  if (min_age) {
    filterConditions.push(`age >= $${paramIndex++}`);
    param.push(min_age);
  }

  if (max_age) {
    filterConditions.push(`age <= $${paramIndex++}`);
    param.push(max_age);
  }

  if (min_gender_probability) {
    filterConditions.push(`gender_probability >= $${paramIndex++}`);
    param.push(min_gender_probability);
  }

  if (min_country_probability) {
    filterConditions.push(`country_probability >= $${paramIndex++}`);
    param.push(min_country_probability);
  }

  if (filterConditions.length > 0) {
    sqlQuery += " WHERE " + filterConditions.join(" AND ");
  }

  // Add ORDER BY clause (column names can't be parameterized)
  if (
    sort_by &&
    ["age", "created_at", "gender_probability"].includes(sort_by)
  ) {
    const orderDirection =
      order && ["ASC", "DESC"].includes(order.toUpperCase())
        ? order.toUpperCase()
        : "ASC";
    sqlQuery += ` ORDER BY ${sort_by} ${orderDirection}`;
  } else if (
    sort_by &&
    !["age", "created_at", "gender_probability"].includes(sort_by)
  ) {
    return {
      message: "Invalid query parameters",
    };
  }

  try {
    // Get the total count and data
    // PostgreSQL: db.query() returns an object with a 'rows' array
    const countResult = await db.query(
      "SELECT COUNT(*) AS total FROM profiles",
    );
    const dataResult = await db.query(sqlQuery, param);

    return {
      data: dataResult.rows, // Access the rows array from the result
      message: "successful",
    };
  } catch (err) {
    throw new Error(`Data could not be retrieved: ${err.message}`);
  }
}

export async function retrieveProfileDataBySearchParams(
  query,
  baseUrl = "/api/profiles/search",
) {
  const { q, page, limit } = query;
  let sqlQuery = "SELECT * FROM profiles";
  let param = [];
  let conditions = [];
  let paramIndex = 1;

  // get by search parameters
  if (q) {
    const lowerQuery = q.toLowerCase();

    // check for gender (including plurals)
    // if both "male" and "female" are mentioned, don't filter by gender
    const hasFemale =
      lowerQuery.includes("female") || lowerQuery.includes("females");
    const hasMale = lowerQuery.includes("male") || lowerQuery.includes("males");

    if (hasFemale && !hasMale) {
      // Only "female" or "females" mentioned
      conditions.push(`gender = $${paramIndex++}`);
      param.push("female");
    } else if (hasMale && !hasFemale) {
      // Only "male" or "males" mentioned (but not "female"/"females")
      conditions.push(`gender = $${paramIndex++}`);
      param.push("male");
    }
    // If both or neither are mentioned, don't add gender filter

    // check for country_id
    const countryId = await getCountryIdFromQuery(q);
    if (countryId) {
      conditions.push(`country_id = $${paramIndex++}`);
      param.push(countryId);
    }

    // check for age_group (including plurals)
    if (
      lowerQuery.includes("adult") ||
      lowerQuery.includes("adults") ||
      lowerQuery.includes("child") ||
      lowerQuery.includes("children") ||
      lowerQuery.includes("teenager") ||
      lowerQuery.includes("teenagers") ||
      lowerQuery.includes("senior") ||
      lowerQuery.includes("seniors")
    ) {
      let age_group = "";

      if (lowerQuery.includes("senior")) {
        age_group = "senior";
      } else if (lowerQuery.includes("teenager")) {
        age_group = "teenager";
      } else if (lowerQuery.includes("adult")) {
        age_group = "adult";
      } else if (lowerQuery.includes("child")) {
        age_group = "child";
      }

      if (age_group) {
        conditions.push(`age_group = $${paramIndex++}`);
        param.push(age_group);
      }
    }

    // check for "young" keyword → maps to ages 16-24
    if (lowerQuery.includes("young")) {
      conditions.push(`age >= $${paramIndex++}`);
      param.push(16);
      conditions.push(`age <= $${paramIndex++}`);
      param.push(24);
    }

    // check for age expressions like "above X", "below X", "under X", "over X"
    // Pattern: "above/over/below/under" followed by a number
    const aboveMatch = lowerQuery.match(/(?:above|over)\s+(\d+)/);
    const belowMatch = lowerQuery.match(/(?:below|under)\s+(\d+)/);

    if (aboveMatch) {
      const minAge = parseInt(aboveMatch[1]);
      conditions.push(`age >= $${paramIndex++}`);
      param.push(minAge);
    }

    if (belowMatch) {
      const maxAge = parseInt(belowMatch[1]);
      conditions.push(`age <= $${paramIndex++}`);
      param.push(maxAge);
    }

    // check if the query matches any of the above
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    } else {
      return {
        message: "Unable to interpret query",
      };
    }
  } else {
    return {
      message: "Invalid query parameters",
    };
  }

  // Add pagination
  const currentPage = parseInt(page) || 1;
  const currentLimit = Math.min(parseInt(limit) || 10, 50);
  const offset = (currentPage - 1) * currentLimit;

  sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  param.push(currentLimit, offset);

  try {
    // Get the total count and data
    // PostgreSQL: db.query() returns an object with a 'rows' array
    const countResult = await db.query(
      "SELECT COUNT(*) AS total FROM profiles",
    );
    const dataResult = await db.query(sqlQuery, param);

    const totalEntries = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalEntries / currentLimit);

    // Generate pagination links
    const links = generatePaginationLinks(
      baseUrl,
      currentPage,
      totalPages,
      query,
    );

    return {
      data: dataResult.rows, // Access the rows array from the result
      pagination: {
        currentPage: currentPage,
        pageLimit: currentLimit,
        totalEntries: totalEntries,
        totalPages: totalPages,
      },
      links: links,
      message: "successful",
    };
  } catch (err) {
    throw new Error(`Data could not be retrieved: ${err.message}`);
  }
}

export async function retrieveProfileDataById(id) {
  try {
    // PostgreSQL: db.query() returns an object with a 'rows' array
    const result = await db.query(`SELECT * FROM profiles WHERE id=$1`, [id]);
    return result.rows[0]; // Return first row or undefined
  } catch (err) {
    throw new Error(`Error: ${err.message}`);
  }
}

// ==================== HELPER FUNCTIONS =========================
// Helper function to build query strings from parameters
function buildQueryString(params) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      queryParts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      );
    }
  }
  return queryParts.join("&");
}

// Helper function to generate pagination links
function generatePaginationLinks(
  baseUrl,
  currentPage,
  totalPages,
  queryParams,
) {
  const links = {};

  // Helper to build a link for a specific page
  const buildLink = (page) => {
    const params = { ...queryParams, page };
    const queryString = buildQueryString(params);
    return `${baseUrl}?${queryString}`;
  };

  // Self link (current page)
  links.self = buildLink(currentPage);

  // Previous link (only if not on first page)
  if (currentPage > 1) {
    links.prev = buildLink(currentPage - 1);
  } else {
    links.prev = null;
  }

  // Next link (only if not on last page)
  if (currentPage < totalPages) {
    links.next = buildLink(currentPage + 1);
  } else {
    links.next = null;
  }

  return links;
}
