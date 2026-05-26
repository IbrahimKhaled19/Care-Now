const { z } = require("zod");

const schemas = {
  createUser: z.object({
    email: z.string().email(),
    full_name: z.string().min(1).max(200),
    role: z.enum(["admin", "moderator", "provider", "patient"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
    account_number: z.string().optional(),
  }),

  updateUser: z.object({
    full_name: z.string().min(1).max(200).optional(),
    account_number: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  createRequest: z.object({
    patient_id: z.string().min(1).nullish(),
    provider_id: z.string().min(1).nullish(),
    service: z.string().min(1),
    status: z.enum(["waiting", "in_progress", "completed", "canceled"]).optional(),
    date: z.string().optional(),
  }),

  updateRequest: z.object({
    patient_id: z.string().min(1).optional(),
    provider_id: z.string().min(1).nullable().optional(),
    service: z.string().min(1).optional(),
    status: z.enum(["waiting", "in_progress", "completed", "canceled"]).optional(),
    date: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  createProvider: z.object({
    email: z.string().email(),
    full_name: z.string().min(1).max(200),
    clerk_user_id: z.string().optional(),
    account_number: z.string().optional(),
    specialty: z.string().optional(),
    credentials: z.string().optional(),
    accept_rate: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    avatar: z.string().optional(),
  }),

  updateProvider: z.object({
    full_name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    status: z.enum(["active", "suspended"]).optional(),
    account_number: z.string().optional(),
    specialty: z.string().optional(),
    credentials: z.string().optional(),
    accept_rate: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    avatar: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  createPatient: z.object({
    email: z.string().email(),
    full_name: z.string().min(1).max(200),
    clerk_user_id: z.string().optional(),
    account_number: z.string().optional(),
    location: z.string().optional(),
    avatar: z.string().optional(),
    date_joined: z.string().optional(),
  }),

  updatePatient: z.object({
    full_name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    status: z.enum(["active", "suspended"]).optional(),
    account_number: z.string().optional(),
    location: z.string().optional(),
    avatar: z.string().optional(),
    date_joined: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  createTransaction: z.object({
    patient_id: z.string().min(1).nullish(),
    provider_id: z.string().min(1).nullish(),
    service: z.string().min(1),
    amount: z.number().positive(),
    status: z.enum(["completed", "pending", "canceled"]).optional(),
    date: z.string().optional(),
  }),

  createWithdrawal: z.object({
    id: z.string().optional(),
    user_id: z.string().min(1).nullish(),
    amount: z.number().positive(),
    status: z.enum(["completed", "pending", "failed"]).optional(),
    method: z.string().min(1),
    requested_date: z.string().optional(),
    processed_date: z.string().optional().nullable(),
  }),

  updateWithdrawal: z.object({
    status: z.enum(["completed", "pending", "failed"]),
    processed_date: z.string().optional().nullable(),
  }),

  createAdmin: z.object({
    email: z.string().email(),
    full_name: z.string().min(1).max(200),
    clerk_user_id: z.string().optional(),
    role: z.enum(["admin", "moderator"]),
    status: z.enum(["active", "suspended"]).optional(),
    account_number: z.string().optional(),
    password: z.string().optional(),
  }),

  updateAdmin: z.object({
    full_name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    role: z.enum(["admin", "moderator"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
    account_number: z.string().optional(),
    password: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  // --- PATCH schemas (all fields optional + nullable) ---

  patchProvider: z.object({
    full_name: z.string().min(1).max(200).nullable().optional(),
    email: z.string().email().nullable().optional(),
    status: z.enum(["active", "suspended"]).nullable().optional(),
    account_number: z.string().nullable().optional(),
    specialty: z.string().nullable().optional(),
    credentials: z.string().nullable().optional(),
    accept_rate: z.string().nullable().optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    avatar: z.string().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  patchPatient: z.object({
    full_name: z.string().min(1).max(200).nullable().optional(),
    email: z.string().email().nullable().optional(),
    status: z.enum(["active", "suspended"]).nullable().optional(),
    account_number: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    date_joined: z.string().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  patchRequest: z.object({
    patient_id: z.string().min(1).nullable().optional(),
    provider_id: z.string().min(1).nullable().optional(),
    service: z.string().min(1).nullable().optional(),
    status: z.enum(["waiting", "in_progress", "completed", "canceled"]).nullable().optional(),
    date: z.string().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),

  patchAdmin: z.object({
    full_name: z.string().min(1).max(200).nullable().optional(),
    email: z.string().email().nullable().optional(),
    role: z.enum(["admin", "moderator"]).nullable().optional(),
    status: z.enum(["active", "suspended"]).nullable().optional(),
    account_number: z.string().nullable().optional(),
    password: z.string().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),
};

/**
 * Middleware factory: validate req.body against a named schema.
 * @param {string} schemaName - Key in the schemas object
 */
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: `Unknown schema: ${schemaName}` });
    }

    // Sanitize: convert empty strings to undefined for optional fields
    const body = { ...req.body };
    for (const [key, value] of Object.entries(body)) {
      if (value === "") {
        delete body[key];
      }
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    req.validated = result.data;
    next();
  };
}

// ============================================================
// Route Parameter Validation
// ============================================================

const paramSchemas = {
  uuid: z.object({ id: z.string().uuid("Invalid ID format") }),
  integer: z.object({ id: z.string().regex(/^\d+$/, "ID must be a positive integer").transform(Number) }),
  text: z.object({ id: z.string().min(1, "ID required") }),
};

/**
 * Middleware factory: validate req.params against a named param schema.
 * @param {string} schemaName - Key in the paramSchemas object ("uuid", "integer", "text")
 */
function validateParam(schemaName) {
  return (req, res, next) => {
    const schema = paramSchemas[schemaName];
    if (!schema) {
      return next();
    }
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid ID format",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req.params = result.data;
    next();
  };
}

module.exports = { validate, schemas, validateParam };
