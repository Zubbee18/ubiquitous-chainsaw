import { createTable } from "../db/createTable.js";
import { db } from "../db/openDBConnection.js";
import * as countryCodes from "country-codes-list";

const myCountryCodesObject = countryCodes.customList(
  "countryCode",
  "{countryNameEn}",
);

// Store the processed result with a UUID v7 id and UTC created_at timestamp
export async function storeProcessedResult(processedData) {
  await createTable();

  try {
    const {
      id,
      name,
      gender,
      gender_probability,
      age,
      age_group,
      country_id,
      country_probability,
    } = processedData;

    const country_name = myCountryCodesObject[country_id];

    // PostgreSQL: query returns an object with a 'rows' array
    const queryResult = await db.query(
      `SELECT * FROM profiles WHERE name = $1`,
      [name],
    );
    const queryData = queryResult.rows[0]; // Get first row or undefined

    if (!queryData) {
      await db.query(
        `
    INSERT INTO profiles (id, name, gender, gender_probability, age, age_group, country_id, country_probability, country_name)
    VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9 )`,
        [
          id,
          name,
          gender,
          gender_probability,
          age,
          age_group,
          country_id,
          country_probability,
          country_name,
        ],
      );

      // Fetch the inserted data
      const insertedResult = await db.query(
        `SELECT * FROM profiles WHERE id = $1`,
        [id],
      );
      const insertedData = insertedResult.rows[0];

      console.log("Profile data has been entered in to the table");

      // send the entry back to the controller
      return { message: "Profile created successfully", data: insertedData };
    } else {
      // send the entry back to the controller
      return { message: "Profile already exists", data: queryData };
    }
  } catch (err) {
    console.log(`Error inserting profile data: ${err.message}`);
  }
}

// Batch-insert multiple profile rows in a single query.
// Uses ON CONFLICT (name) DO NOTHING so duplicate names are silently skipped.
// Returns { insertedCount, duplicateCount }.
export async function batchInsertProfiles(rows) {
  if (rows.length === 0) return { insertedCount: 0, duplicateCount: 0 };

  const cols = [
    "id",
    "name",
    "gender",
    "gender_probability",
    "age",
    "age_group",
    "country_id",
    "country_name",
    "country_probability",
  ];
  const numCols = cols.length;
  const valuesClauses = [];
  const params = [];

  rows.forEach((row, i) => {
    const base = i * numCols;
    valuesClauses.push(
      `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9})`,
    );
    params.push(
      row.id,
      row.name,
      row.gender,
      row.gender_probability,
      row.age,
      row.age_group,
      row.country_id,
      row.country_name,
      row.country_probability,
    );
  });

  const sql = `
    INSERT INTO profiles (${cols.join(", ")})
    VALUES ${valuesClauses.join(", ")}
    ON CONFLICT (name) DO NOTHING
    RETURNING id
  `;

  const result = await db.query(sql, params);
  const insertedCount = result.rowCount;
  const duplicateCount = rows.length - insertedCount;
  return { insertedCount, duplicateCount };
}
