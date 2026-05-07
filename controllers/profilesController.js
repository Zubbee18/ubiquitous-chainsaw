import { v7 as uuidv7 } from "uuid";
import { deleteProfileDataById } from "../models/deleteProfileData.js";
import {
  storeProcessedResult,
  batchInsertProfiles,
} from "../models/storeProcessedResult.js";
import {
  retrieveProfileDataById,
  retrieveProfileDataByQueryParams,
  retrieveProfileDataBySearchParams,
  retrieveProfileDataForExport,
} from "../models/retrieveProfileData.js";
import axios from "axios";
import { parse } from "json2csv";
import { parse as csvParse } from "csv-parse";
import busboy from "busboy";
import * as countryCodes from "country-codes-list";

export function handlePostProfiles(req, res) {
  const { name } = req.body;

  if (name) {
    if (/^[0-9]+$/.test(name)) {
      // supposed to check for nonsensical names but for now I can only check for names without numbers
      res.status(422).json({
        status: "error",
        message:
          "Invalid 'name' parameter. Name must contain only alphabetic characters",
      });
      return;
    }

    // retrieve data
    try {
      axios
        .all([
          axios.get(`https://api.genderize.io/?name=${name}`),
          axios.get(`https://api.agify.io?name=${name}`),
          axios.get(`https://api.nationalize.io?name=${name}`),
        ])

        .then(
          axios.spread(async (genderRes, ageRes, nationRes) => {
            // process data
            const processedData = processPostData(
              res,
              genderRes.data,
              ageRes.data,
              nationRes.data,
            );

            // insert data and return a response
            const response = await storeProcessedResult(processedData);

            // send json response
            if (response.message === "Profile created successfully") {
              return res
                .status(201)
                .json({ status: "success", data: response.data });
            } else {
              return res.status(201).json({
                status: "success",
                message: response.message,
                data: response.data,
              });
            }
          }),
        );
    } catch (err) {
      res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
      throw new Error(`Was unable to get or process data: ${err}`);
    }
  } else {
    res.status(400).json({
      status: "error",
      message:
        "Missing 'name' parameter. Please add a name query to your API call",
    });
  }
}

export async function exportProfiles(req, res) {
  try {
    const profileData = await retrieveProfileDataForExport(req.query);

    // Handle error cases
    if (profileData.message === "Unable to interpret query") {
      return res
        .status(400)
        .json({ status: "error", message: profileData.message });
    }

    if (profileData.message === "Invalid query parameters") {
      return res
        .status(422)
        .json({ status: "error", message: profileData.message });
    }

    if (profileData.data.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No profiles found matching the criteria",
      });
    }

    // Check if CSV format is requested
    const format = req.query.format || "json";

    if (format.toLowerCase() === "csv") {
      // Define CSV fields
      const fields = [
        "id",
        "name",
        "gender",
        "gender_probability",
        "age",
        "age_group",
        "country_id",
        "country_name",
        "country_probability",
        "created_at",
      ];

      // Convert to CSV
      const csv = parse(profileData.data, { fields });

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="profiles_${new Date().toISOString().split("T")[0]}.csv"`,
      );

      return res.status(200).send(csv);
    } else {
      // Return JSON (existing behavior)
      return res.status(200).json({
        status: "success",
        total: profileData.data.length,
        data: profileData.data,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
}

export async function handleGetProfilesById(req, res) {
  try {
    const id = req.params.id;

    const profile = await retrieveProfileDataById(id);

    if (profile) {
      res.status(200).json({ status: "success", data: profile });
    } else {
      res.status(404).json({ status: "error", message: "Profile not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
}

export async function handleGetProfilesByQueryParams(req, res) {
  try {
    const profileData = await retrieveProfileDataByQueryParams(req.query);

    if (profileData.data.length === 0) {
      res.status(404).json({ status: "error", message: "Profile not found" });
    } else if (profileData.message === "Unable to interpret query") {
      res.status(400).json({ status: "error", message: profileData.message });
    } else if (profileData.message === "Invalid query parameters") {
      res.status(422).json({ status: "error", message: profileData.message });
    } else {
      res.status(200).json({
        status: "success",
        page: profileData.pagination.currentPage,
        limit: profileData.pagination.pageLimit,
        total: profileData.pagination.totalEntries,
        total_pages: profileData.pagination.totalPages,
        links: profileData.links,
        data: profileData.data,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
}

export async function handleGetProfilesBySearchQueryParams(req, res) {
  try {
    const profileData = await retrieveProfileDataBySearchParams(
      req.query,
      undefined,
      req.parsedFilters ?? null,
    );

    if (profileData.data?.length === 0) {
      res.status(404).json({ status: "error", message: "Profile not found" });
    } else if (profileData.message === "Unable to interpret query") {
      res.status(400).json({ status: "error", message: profileData.message });
    } else if (profileData.message === "Invalid query parameters") {
      res.status(422).json({ status: "error", message: profileData.message });
    } else {
      res.status(200).json({
        status: "success",
        page: profileData.pagination.currentPage,
        limit: profileData.pagination.pageLimit,
        total: profileData.pagination.totalEntries,
        total_pages: profileData.pagination.totalPages,
        links: profileData.links,
        data: profileData.data,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
}

export async function handleDeleteProfilesById(req, res) {
  try {
    const id = req.params.id;

    if (id) {
      const message = await deleteProfileDataById(id);

      if (message === "Delete successful") {
        res.status(204).end();
      } else if (message === "Data does not exist") {
        res.status(404).json({
          status: "error",
          message: `Profile data with id: ${id} does not exist`,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Delete was unsuccessful. Please try again",
        });
      }
    } else {
      res.status(400).json({
        status: "error",
        message: "Include a query id in your request",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
}

function processPostData(res, genderRes, ageRes, nationRes) {
  let resData = {};
  resData.id = uuidv7();
  resData.name = genderRes.name.toLowerCase();

  try {
    // Extract gender, gender_probability, and count from Genderize. Rename count to sample_size
    if (genderRes.gender && genderRes.count) {
      // Rename count to sample_size
      resData.gender = genderRes.gender;
      resData.gender_probability = genderRes.probability;
      resData.sample_size = genderRes.count;
    } else {
      res.status(502).json({
        status: "502",
        message: "Genderize returned an invalid response",
      });
      return;
    }

    // Extract age from Agify. Classify age_group: 0–12 → child, 13–19 → teenager, 20–59 → adult, 60+ → senior
    if (ageRes.age) {
      resData.age = ageRes.age;
      resData.age_group =
        ageRes.age < 13
          ? "child"
          : ageRes.age < 20
            ? "teenager"
            : ageRes.age < 60
              ? "adult"
              : "senior";
    } else {
      res
        .status(502)
        .json({ status: "502", message: "Agify returned an invalid response" });
      return;
    }

    // Extract country list from Nationalize. Pick the country with the highest probability as country_id
    if (nationRes.country && nationRes.country.length > 0) {
      resData.country_id = nationRes.country[0].country_id; //picks the first country since it's already in desc order
      resData.country_probability =
        +nationRes.country[0].probability.toFixed(2);
    } else {
      res.status(502).json({
        status: "502",
        message: "Nationalize returned an invalid response",
      });
      return;
    }

    return resData;
  } catch (err) {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
    throw new Error(`Was unable to process data: ${err}`);
  }
}

export function uploadCSVProfiles(req, res) {
  const contentType = req.headers["content-type"] ?? "";
  console.log(`[CSV Upload] Request received — content-type: ${contentType}`);

  // check if it's a form-data
  if (!contentType.includes("multipart/form-data")) {
    console.warn("[CSV Upload] Rejected: not multipart/form-data");
    return res.status(400).json({
      status: "error",
      message: "Request must be multipart/form-data",
    });
  }

  let responseSent = false;
  function sendResponse(status, body) {
    if (!responseSent) {
      responseSent = true;
      console.log(`[CSV Upload] Response ${status}:`, body);
      res.status(status).json(body);
    }
  }

  let fileProcessingPromise = null;

  // set up the stream on busboy
  const bb = busboy({ headers: req.headers, limits: { files: 1 } });

  bb.on("file", (fieldname, file, info) => {
    // provides the filestream, filename and metadata
    const { filename = "", mimeType = "" } = info;
    console.log(
      `[CSV Upload] File field received — field: '${fieldname}', filename: '${filename}', mimeType: '${mimeType}'`,
    );

    // check if it's a csv file
    const isCSV =
      mimeType === "text/csv" ||
      mimeType === "application/vnd.ms-excel" ||
      filename.toLowerCase().endsWith(".csv");

    if (!isCSV) {
      file.resume(); // drain and discard
      console.warn(
        `[CSV Upload] Rejected: file is not a CSV (mimeType='${mimeType}', filename='${filename}')`,
      );
      return sendResponse(400, {
        status: "error",
        message: "Uploaded file must be a CSV (.csv)",
      });
    }

    // start the file processing promise and then if send a response
    fileProcessingPromise = processCSVStream(file)
      .then((stats) => {
        const reasons = {};
        for (const [key, val] of Object.entries(stats.reasons)) {
          if (val > 0) reasons[key] = val;
        }
        sendResponse(200, {
          status: "success",
          total_rows: stats.total_rows,
          inserted: stats.inserted,
          skipped: stats.skipped,
          reasons,
        });
      })
      .catch((err) => {
        console.error(`[CSV Upload] Stream error: ${err.message}`, err.stack);
        sendResponse(500, {
          status: "error",
          message: "Internal Server Error",
        });
      });
  });

  // busboy v1 emits 'close' when done, not 'finish'
  bb.on("close", async () => {
    console.log("[CSV Upload] Busboy finished parsing multipart body");
    if (fileProcessingPromise) {
      await fileProcessingPromise;
    } else {
      console.warn("[CSV Upload] No file field found in request");
      sendResponse(400, {
        status: "error",
        message: "No CSV file was uploaded",
      });
    }
  });

  bb.on("error", (err) => {
    console.error(`[CSV Upload] Busboy error: ${err.message}`, err.stack);
    sendResponse(400, { status: "error", message: "Failed to parse upload" });
  });

  req.pipe(bb);
}

// ================================ HELPER FUNCTIONS FOR CSV UPLOAD ====================================
const countryCodesMap = countryCodes.customList(
  "countryCode",
  "{countryNameEn}",
);
const VALID_GENDERS = new Set(["male", "female"]);
const CSV_BATCH_SIZE = 500;

function classifyAgeGroup(age) {
  if (age < 13) return "child";
  if (age < 20) return "teenager";
  if (age < 60) return "adult";
  return "senior";
}

function validateCSVRow(row) {
  const name = row.name?.trim();
  const gender = row.gender?.trim()?.toLowerCase();
  const age = row.age;
  const countryId = row.country_id?.trim();

  if (
    !name ||
    !gender ||
    age === undefined ||
    age === null ||
    age === "" ||
    !countryId
  ) {
    return { valid: false, reason: "missing_fields" };
  }

  if (!VALID_GENDERS.has(gender)) {
    return { valid: false, reason: "invalid_gender" };
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge <= 0) {
    return { valid: false, reason: "invalid_age" };
  }

  return { valid: true };
}

async function processCSVStream(file) {
  console.log("[CSV] Stream processing started");
  const startTime = Date.now();

  const stats = {
    total_rows: 0,
    inserted: 0,
    skipped: 0,
    reasons: {},
  };

  function bumpReason(reason) {
    stats.skipped++;
    stats.reasons[reason] = (stats.reasons[reason] ?? 0) + 1;
  }

  const parser = file.pipe(
    csvParse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      skip_records_with_error: true,
    }),
  );

  // Count malformed rows that csv-parse skips internally
  parser.on("skip", (err) => {
    stats.total_rows++;
    bumpReason("malformed_row");
    console.warn(
      `[CSV] Malformed row ~${stats.total_rows} skipped: ${err.message}`,
    );
  });

  let batch = [];
  const batchNameSet = new Set();
  let batchNumber = 0;

  async function flushBatch() {
    if (batch.length === 0) return;
    batchNumber++;
    const toInsert = batch.splice(0);
    batchNameSet.clear();
    console.log(
      `[CSV] Batch #${batchNumber}: flushing ${toInsert.length} rows (${stats.total_rows} total read)`,
    );
    try {
      const { insertedCount, duplicateCount } =
        await batchInsertProfiles(toInsert);
      stats.inserted += insertedCount;
      if (duplicateCount > 0) {
        stats.skipped += duplicateCount;
        stats.reasons.duplicate_name =
          (stats.reasons.duplicate_name ?? 0) + duplicateCount;
      }
      console.log(
        `[CSV] Batch #${batchNumber}: inserted ${insertedCount}, duplicates ${duplicateCount}`,
      );
    } catch (err) {
      // Transient DB error: skip the batch but keep what was already committed
      stats.skipped += toInsert.length;
      stats.reasons.db_error = (stats.reasons.db_error ?? 0) + toInsert.length;
      console.error(
        `[CSV] Batch #${batchNumber} DB error (${toInsert.length} rows skipped): ${err.message}`,
      );
    }
  }

  try {
    for await (const row of parser) {
      stats.total_rows++;

      if (stats.total_rows % 10000 === 0) {
        console.log(
          `[CSV] Progress: ${stats.total_rows} rows read, ${stats.inserted} inserted, ${stats.skipped} skipped`,
        );
      }

      const validation = validateCSVRow(row);
      if (!validation.valid) {
        bumpReason(validation.reason);
        continue;
      }

      const name = row.name.trim().toLowerCase();

      // Deduplicate within the current batch
      if (batchNameSet.has(name)) {
        bumpReason("duplicate_name");
        continue;
      }

      const age = parseInt(row.age, 10);
      batchNameSet.add(name);
      batch.push({
        id: uuidv7(),
        name,
        gender: row.gender.trim().toLowerCase(),
        gender_probability: parseFloat(row.gender_probability) || 0,
        age,
        age_group: classifyAgeGroup(age),
        country_id: row.country_id.trim().toUpperCase(),
        country_name:
          countryCodesMap[row.country_id.trim().toUpperCase()] ||
          row.country_name?.trim() ||
          "",
        country_probability: parseFloat(row.country_probability) || 0,
      });

      if (batch.length >= CSV_BATCH_SIZE) {
        await flushBatch();
      }
    }
  } finally {
    console.log("[CSV] End of file — flushing remaining rows");
    await flushBatch();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[CSV] Done in ${elapsed}s — total: ${stats.total_rows}, inserted: ${stats.inserted}, skipped: ${stats.skipped}`,
    stats.reasons,
  );
  return stats;
}
