# My Approach to improve Database Performance

## Part 1: Query Performance

**Connection pooling** — `pg.Pool` keeps persistent connections open. No TCP handshake or auth round-trip per request.

**Redis response caching** — `middlewares/redis.js` caches full responses. Cache hits return immediately with zero DB involvement. TTL is controlled by `REDIS_EXPIRY_TIME`. On Redis outage, requests fall through to the database transparently.

**Composite index on `(country_id, gender)`** — the two most-used filter columns. Built with `CONCURRENTLY` so reads and writes are never blocked during index creation.

**Parameterized queries** — PostgreSQL caches the query plan for parameterized statements. All queries use `$n` placeholders throughout.

### Response Time After Injecting 500,000+ profile data into the database

| Scenario                              | Time in (ms) |
| ------------------------------------- | ------------ |
| Filtered query with no index or cache (2033 profiles) | 516           |
| Filtered query with index             |   1010        |
| Filtered query with cache (Redis hit) | 464          |
| Natural-language search with no cache | 768          |
| Natural-language search with cache    | 383          |

---

## Part 2: Query Normalization

`util/parseSearchQuery.js` converts any natural-language query into a canonical filter object with a fixed schema: `{ country_id, gender, min_age, max_age, age_group }`.

`middlewares/normalizeSearchQuery.js` parses the query once per request and attaches the result to `req.parsedFilters`.

`middlewares/redis.js` keys the cache on a SHA-1 hash of `req.parsedFilters` (not the raw query string). `object-hash` is order-independent, so `{ gender: "female", country_id: "NG" }` and `{ country_id: "NG", gender: "female" }` produce the same key. Two differently phrased but semantically equivalent queries share one cache entry.

---

## Part 3: CSV Data Ingestion

`busboy` parses the `multipart/form-data` request as a stream and pipes the file directly into `csv-parse`, which operates as an async iterator.

Each row is checked for missing fields, invalid gender, and non-positive age before entering the batch. Bad rows are counted by reason and skipped; the rest continue.

Valid rows accumulate in a 500-row buffer. Each flush sends one multi-row `INSERT … ON CONFLICT (name) DO NOTHING`. A `Set` deduplicates names within the batch before the query runs. Batch size of 500 keeps query payloads small while still being orders of magnitude faster than row-by-row inserts.

`flushBatch` runs in a `finally` block so buffered rows at the point of error are still attempted. A batch-level DB error skips only that batch; all previously committed rows remain. There is no transaction wrapping the full upload — rolling back 500 k rows on a transient error would be worse than losing one batch.

Each upload has its own `busboy` instance and buffer. No shared state. `ON CONFLICT DO NOTHING` handles races between concurrent uploads inserting the same name.

### Failure handling

| Scenario                                | Behaviour                                 |
| --------------------------------------- | ----------------------------------------- |
| Wrong `Content-Type`                    | `400` before processing                   |
| Non-CSV file                            | `400`; stream drained and discarded       |
| No file in request                      | `400` after parse completes               |
| Malformed row (encoding / column count) | `malformed_row`, skipped                  |
| Missing required field                  | `missing_fields`, skipped                 |
| Invalid gender                          | `invalid_gender`, skipped                 |
| Non-positive / non-numeric age          | `invalid_age`, skipped                    |
| Duplicate name (within batch)           | `duplicate_name`, skipped (in-memory)     |
| Duplicate name (in DB)                  | `duplicate_name`, skipped (`ON CONFLICT`) |
| Transient DB error on a batch           | `db_error`, prior batches kept            |
