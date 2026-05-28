/**
 * Shared query-building utilities for route handlers.
 * Eliminates duplicated filter/pagination logic across route files.
 */

/**
 * Build a WHERE clause from an array of conditions.
 * @param {string[]} conditions - SQL conditions like "u.status = $1"
 * @returns {string} "WHERE cond1 AND cond2" or "" if no conditions
 */
function buildWhere(conditions) {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

/**
 * Parse and validate pagination parameters from query string.
 * Enforces max limit of 100 to prevent full-table dumps.
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Execute a paginated query with a parallel count query.
 * Returns data wrapped in the standard envelope { data, meta }.
 * @param {object} db - pg Pool instance
 * @param {string} dataQuery - SQL for the data rows (should include LIMIT/OFFSET placeholders)
 * @param {any[]} dataParams - Parameters for the data query
 * @param {string} countQuery - SQL for the total count (no LIMIT/OFFSET)
 * @param {any[]} countParams - Parameters for the count query
 * @param {number} page - Current page number
 * @param {number} limit - Rows per page
 * @returns {Promise<{ data: any[], meta: { total: number, page: number, limit: number, hasMore: boolean } }>}
 */
async function paginatedQuery(db, dataQuery, dataParams, countQuery, countParams, page, limit) {
  const [data, countResult] = await Promise.all([
    db.query(dataQuery, dataParams),
    db.query(countQuery, countParams),
  ]);
  const total = parseInt(countResult.rows[0].count);
  return {
    data: data.rows,
    meta: { total, page, limit, hasMore: page * limit < total },
  };
}

/**
 * Build SQL filter conditions from common query parameters.
 * @param {object} options
 * @param {string} [options.status] - Status filter value
 * @param {string} [options.search] - Search term for ILIKE matching
 * @param {string[]} [options.searchFields] - Column names to search (e.g. ["u.full_name", "p.specialty"])
 * @param {{ column: string, value: string }} [options.roleFilter] - Role-based ownership filter
 * @param {number} [options.paramStart=1] - Starting parameter index for SQL placeholders
 * @returns {{ conditions: string[], params: any[], nextIdx: number }}
 */
function buildFilters({ status, search, searchFields, roleFilter, paramStart = 1, statusColumn = "status" }) {
  const conditions = [];
  const params = [];
  let idx = paramStart;

  if (roleFilter) {
    conditions.push(`${roleFilter.column} = $${idx++}`);
    params.push(roleFilter.value);
  }

  if (status) {
    conditions.push(`${statusColumn} = $${idx++}`);
    params.push(status);
  }

  if (search && searchFields && searchFields.length > 0) {
    const searchClauses = searchFields.map((f) => `${f} ILIKE $${idx}`);
    conditions.push(`(${searchClauses.join(" OR ")})`);
    params.push(`%${search}%`);
    idx++;
  }

  return { conditions, params, nextIdx: idx };
}

module.exports = { buildWhere, parsePagination, paginatedQuery, buildFilters };
