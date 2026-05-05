import { v7 as uuidv7 } from "uuid";
import { db } from "../db/openDBConnection.js";

export async function checkUserExists(userId, github = true) {
  const userExists = await db.query(
    `SELECT * FROM users WHERE ${github ? "github_id" : "id"}=$1`,
    [userId],
  );

  let existing = false;

  if (userExists.rows[0]) existing = true;

  return existing;
}

export async function getLoginUserFromId(githubUserId) {
  const result = await db.query(
    `UPDATE users SET last_login_at = NOW() AT TIME ZONE 'UTC', is_active = TRUE WHERE github_id=$1
                    RETURNING *`,
    [githubUserId],
  );

  return result.rows[0];
}

export async function getUser(userId) {
  const user = await db.query("SELECT * FROM users WHERE id=$1", [userId]);

  return user.rows[0];
}

export async function createAndLoginUser(login, id, avatar_url, email) {
  const userId = uuidv7();

  const adminCheck = await db.query(
    `SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`,
  );
  const role = adminCheck.rows.length > 0 ? "analyst" : "admin";

  const newUser = await db.query(
    `INSERT INTO users (id, github_id, username, email, avatar_url, role, is_active, last_login_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() AT TIME ZONE 'UTC')
                    RETURNING *`,
    [userId, id, login, email, avatar_url, role, true],
  );

  return newUser.rows[0];
}

export async function logoutUserDB(userId) {
  return await db.query(`UPDATE users SET is_active = FALSE WHERE id=$1`, [
    userId,
  ]);
}

/**
 * Returns the first admin user in the DB, or creates a seeded one if none exists.
 * Used exclusively by the test_code shortcut path.
 */
export async function getOrCreateSeedAdminUser() {
  // Try to fetch an existing admin
  const existing = await db.query(
    `SELECT * FROM users WHERE role = 'admin' ORDER BY last_login_at ASC LIMIT 1`,
  );
  if (existing.rows[0]) {
    // Update last_login_at so the token reflects an active session
    const updated = await db.query(
      `UPDATE users SET last_login_at = NOW() AT TIME ZONE 'UTC', is_active = TRUE
       WHERE id = $1 RETURNING *`,
      [existing.rows[0].id],
    );
    return updated.rows[0];
  }

  // No admin exists — create a deterministic seed admin
  const userId = uuidv7();
  const newUser = await db.query(
    `INSERT INTO users (id, github_id, username, email, avatar_url, role, is_active, last_login_at)
     VALUES ($1, $2, $3, $4, $5, 'admin', TRUE, NOW() AT TIME ZONE 'UTC')
     ON CONFLICT (github_id) DO UPDATE
       SET last_login_at = NOW() AT TIME ZONE 'UTC', is_active = TRUE
     RETURNING *`,
    [userId, "seed_admin_test", "seed_admin", "seed_admin@test.local", ""],
  );
  return newUser.rows[0];
}
