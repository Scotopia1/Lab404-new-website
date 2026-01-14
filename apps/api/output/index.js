"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/app.ts
var import_express27 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_morgan = __toESM(require("morgan"));
var import_compression = __toESM(require("compression"));
var import_cookie_parser = __toESM(require("cookie-parser"));

// src/config/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
import_dotenv.default.config({ path: import_path.default.resolve(__dirname, "../../../../.env") });
var config = {
  // Environment
  env: process.env["NODE_ENV"] || "development",
  isDev: process.env["NODE_ENV"] === "development",
  isProd: process.env["NODE_ENV"] === "production",
  // Server
  port: parseInt(process.env["API_PORT"] || "4000", 10),
  apiUrl: process.env["API_URL"] || "http://localhost:4000",
  // Database
  databaseUrl: process.env["DATABASE_URL"] || "",
  // JWT
  jwtSecret: process.env["JWT_SECRET"],
  jwtExpiresIn: process.env["JWT_EXPIRES_IN"] || "7d",
  // CORS
  corsOrigins: (process.env["CORS_ORIGINS"] || "http://localhost:3000,http://localhost:3001").split(",").map((origin) => origin.trim()).filter((origin) => origin.length > 0),
  // ImageKit
  imagekit: {
    publicKey: process.env["IMAGEKIT_PUBLIC_KEY"] || "",
    privateKey: process.env["IMAGEKIT_PRIVATE_KEY"] || "",
    urlEndpoint: process.env["IMAGEKIT_URL_ENDPOINT"] || ""
  },
  // SMTP
  smtp: {
    host: process.env["SMTP_HOST"] || "",
    port: parseInt(process.env["SMTP_PORT"] || "587", 10),
    secure: process.env["SMTP_SECURE"] === "true",
    user: process.env["SMTP_USER"] || "",
    pass: process.env["SMTP_PASS"] || "",
    from: process.env["EMAIL_FROM"] || "noreply@lab404electronics.com"
  },
  // Stripe (Future)
  stripe: {
    secretKey: process.env["STRIPE_SECRET_KEY"] || "",
    webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] || ""
  },
  // Google APIs
  google: {
    apiKey: process.env["GOOGLE_API_KEY"] || "",
    searchEngineId: process.env["GOOGLE_SEARCH_ENGINE_ID"] || ""
  },
  // Store defaults
  store: {
    name: process.env["STORE_NAME"] || "Lab404Electronics",
    currency: process.env["STORE_CURRENCY"] || "USD"
  },
  // URLs
  urls: {
    admin: process.env["ADMIN_URL"] || "http://localhost:3001",
    web: process.env["WEB_URL"] || "http://localhost:3000"
  }
};

// src/middleware/errorHandler.ts
var import_zod = require("zod");

// src/utils/errors.ts
var ApiError = class extends Error {
  statusCode;
  code;
  details;
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
};
var BadRequestError = class extends ApiError {
  constructor(message = "Bad request", details) {
    super(400, "BAD_REQUEST", message, details);
    this.name = "BadRequestError";
  }
};
var UnauthorizedError = class extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
};
var ForbiddenError = class extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
};
var NotFoundError = class extends ApiError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
};
var ConflictError = class extends ApiError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
};
var ValidationError = class extends ApiError {
  constructor(message = "Validation failed", details) {
    super(422, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
};
var TooManyRequestsError = class extends ApiError {
  constructor(message = "Too many requests") {
    super(429, "TOO_MANY_REQUESTS", message);
    this.name = "TooManyRequestsError";
  }
};

// src/utils/response.ts
function sendSuccess(res, data, statusCode = 200, meta) {
  const response = {
    success: true,
    data,
    ...meta && { meta }
  };
  return res.status(statusCode).json(response);
}
function sendCreated(res, data) {
  return sendSuccess(res, data, 201);
}
function sendNoContent(res) {
  return res.status(204).send();
}
function sendError(res, statusCode, code, message, details) {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...details && { details }
    }
  };
  return res.status(statusCode).json(response);
}
function createPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}
function parsePaginationParams(query) {
  let parsedPage = parseInt(query.page || "1", 10);
  let parsedLimit = parseInt(query.limit || "20", 10);
  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  }
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    parsedLimit = 20;
  }
  const MAX_PAGE = 1e6;
  const MAX_LIMIT = 100;
  const page = Math.min(MAX_PAGE, Math.max(1, parsedPage));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parsedLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// src/utils/logger.ts
var Logger = class {
  formatMessage(level, message, context) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp2}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }
  debug(message, context) {
    if (config.isDev) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
  info(message, context) {
    console.info(this.formatMessage("info", message, context));
  }
  warn(message, context) {
    console.warn(this.formatMessage("warn", message, context));
  }
  error(message, error, context) {
    const errorContext = { ...context };
    if (error instanceof Error) {
      errorContext["errorName"] = error.name;
      errorContext["errorMessage"] = error.message;
      if (config.isDev) {
        errorContext["stack"] = error.stack;
      }
    } else if (error) {
      errorContext["error"] = error;
    }
    console.error(this.formatMessage("error", message, errorContext));
  }
  /**
   * Log HTTP request (for morgan custom format)
   */
  http(message) {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] [HTTP] ${message}`);
  }
};
var logger = new Logger();

// src/middleware/errorHandler.ts
function errorHandler(err, req, res, _next) {
  logger.error("Request error", err, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }
  if (err instanceof import_zod.ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));
    return sendError(res, 422, "VALIDATION_ERROR", "Validation failed", details);
  }
  const message = config.isDev ? err.message : "Internal server error";
  return sendError(res, 500, "INTERNAL_SERVER_ERROR", message);
}
function notFoundHandler(req, res) {
  return sendError(res, 404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`);
}

// src/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_uuid2 = require("uuid");

// ../../packages/database/src/client.ts
var import_serverless2 = require("@neondatabase/serverless");

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/neon-http/driver.js
var import_serverless = require("@neondatabase/serverless");

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config2) {
    this.writer = config2?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/version.js
var version = "0.36.4";

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
    this.name = config2.name;
    this.keyAsName = config2.keyAsName;
    this.notNull = config2.notNull;
    this.default = config2.default;
    this.defaultFn = config2.defaultFn;
    this.onUpdateFn = config2.onUpdateFn;
    this.hasDefault = config2.hasDefault;
    this.primary = config2.primaryKey;
    this.isUnique = config2.isUnique;
    this.uniqueName = config2.uniqueName;
    this.uniqueType = config2.uniqueType;
    this.dataType = config2.dataType;
    this.columnType = config2.columnType;
    this.generated = config2.generated;
    this.generatedIdentity = config2.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config2, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config2();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char2 = arrayString[i];
    if (char2 === "\\") {
      i++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char2 = arrayString[i];
    if (char2 === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config2) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config2?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config2) {
    if (!config2.uniqueName) {
      config2.uniqueName = uniqueKeyName(table, [config2.name]);
    }
    super(table, config2);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config2, baseColumn, range) {
    super(table, config2);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config2.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config2) {
    super(table, config2);
    this.enum = config2.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
function pgEnum(enumName, values) {
  return pgEnumWithSchema(enumName, values, void 0);
}
function pgEnumWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign(
    (name) => new PgEnumColumnBuilder(name ?? "", enumInstance),
    {
      enumName,
      enumValues: values,
      schema,
      [isPgEnumSym]: true
    }
  );
  return enumInstance;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql3, selection, alias, isWith = false) {
    this._ = {
      brand: "Subquery",
      sql: sql3,
      selectedFields: selection,
      alias,
      isWith
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config2) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config2);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config2 = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config2;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config2);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config2,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config2);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config2), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config2);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config2);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config2);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config2), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql22) => {
  function empty() {
    return new SQL([]);
  }
  sql22.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql22.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql22.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql22.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql22.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql22.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql22.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql22, fieldAlias) {
      this.sql = sql22;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null)
    return false;
  if (data.constructor.name !== "Object")
    return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined")
      return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["logger"];
    if (type !== "object" && type !== "undefined")
      return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["logger"];
    if (type !== "string" && type !== "undefined")
      return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0)
      return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined")
      return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined")
      return false;
    return true;
  }
  if (Object.keys(data).length === 0)
    return true;
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName)
      return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
};
var PgBigInt53 = class extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
};
var PgBigInt64 = class extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
};
var PgBigSerial53 = class extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
};
var PgBigSerial64 = class extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigserial(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
};
var PgBoolean = class extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
};
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name, config2) {
    super(name, "string", "PgChar");
    this.config.length = config2.length;
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(table, this.config);
  }
};
var PgChar = class extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgCharBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
};
var PgCidr = class extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
};
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
};
var PgCustomColumn = class extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config2) {
    super(table, config2);
    this.sqlName = config2.customTypeParams.dataType(config2.fieldConfig);
    this.mapTo = config2.customTypeParams.toDriver;
    this.mapFrom = config2.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config: config2 } = getColumnNameAndConfig(a, b);
    return new PgCustomColumnBuilder(name, config2, customTypeParams);
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    return new Date(value);
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
};
function date(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
};
var PgDoublePrecision = class extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
};
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
};
var PgInet = class extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
};
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
};
var PgInteger = class extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
};
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
};
var PgInterval = class extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
};
function interval(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgIntervalBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
};
var PgLineTuple = class extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
};
var PgLineABCBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
};
var PgLineABC = class extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
};
function line(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
};
var PgMacaddr = class extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
};
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
};
var PgMacaddr8 = class extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
};
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config2) {
    super(table, config2);
    this.precision = config2.precision;
    this.scale = config2.scale;
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
function numeric(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgNumericBuilder(name, config2?.precision, config2?.scale);
}
var decimal = numeric;

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
};
var PgPointTuple = class extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
};
var PgPointObject = class extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
};
function point(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
};
var PgGeometry = class extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
};
var PgGeometryObject = class extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
};
function geometry(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
};
var PgReal = class extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
};
function real(name) {
  return new PgRealBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
};
var PgSerial = class extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
};
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
};
var PgSmallInt = class extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
};
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
};
var PgSmallSerial = class extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
};
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config2) {
    super(name, "string", "PgText");
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
};
var PgText = class extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
};
function text(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgTextBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function time(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgTimeBuilder(name, config2.withTimezone ?? false, config2.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue = (value) => {
    return new Date(this.withTimezone ? value : value + "+0000");
  };
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function timestamp(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  if (config2?.mode === "string") {
    return new PgTimestampStringBuilder(name, config2.withTimezone ?? false, config2.precision);
  }
  return new PgTimestampBuilder(name, config2?.withTimezone ?? false, config2?.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name, config2) {
    super(name, "string", "PgVarchar");
    this.config.length = config2.length;
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(table, this.config);
  }
};
var PgVarchar = class extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b = {}) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgVarcharBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name, config2) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
};
var PgBinaryVector = class extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
};
function bit(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgBinaryVectorBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name, config2) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
};
var PgHalfVector = class extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function halfvec(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgHalfVectorBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name, config2) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
};
var PgSparseVector = class extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
};
function sparsevec(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgSparseVectorBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name, config2) {
    super(name, "array", "PgVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(table, this.config);
  }
};
var PgVector = class extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function vector(a, b) {
  const { name, config: config2 } = getColumnNameAndConfig(a, b);
  return new PgVectorBuilder(name, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min2, max2) {
  return sql`${column} between ${bindIfParam(min2, column)} and ${bindIfParam(
    max2,
    column
  )}`;
}
function notBetween(column, min2, max2) {
  return sql`${column} not between ${bindIfParam(
    min2,
    column
  )} and ${bindIfParam(max2, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config2, isNullable) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config2) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
function createOne(sourceTable) {
  return function one(table, config2) {
    return new One(
      sourceTable,
      table,
      config2,
      config2?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config2) {
    return new Many(sourceTable, referencedTable, config2);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
  static [entityKind] = "PgViewBase";
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
  static [entityKind] = "PgDialect";
  /** @internal */
  casing;
  constructor(config2) {
    this.casing = new CasingCache(config2?.casing);
  }
  async migrate(migrations, session, config2) {
    const migrationsTable = typeof config2 === "string" ? "__drizzle_migrations" : config2.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config2 === "string" ? "drizzle" : config2.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length)
      return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[PgTable.Symbol.Name];
    const tableSchema = table[PgTable.Symbol.Schema];
    const origTableName = table[PgTable.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = sql`${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index2, joinMeta] of joins.entries()) {
      if (index2 === 0) {
        joinsArray.push(sql` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
      if (is(table, PgTable)) {
        const tableName = table[PgTable.Symbol.Name];
        const tableSchema = table[PgTable.Symbol.Schema];
        const origTableName = table[PgTable.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
        );
      } else if (is(table, View)) {
        const viewName = table[ViewBaseConfig].name;
        const viewSchema = table[ViewBaseConfig].schema;
        const origViewName = table[ViewBaseConfig].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
        );
      } else {
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table} on ${joinMeta.on}`
        );
      }
      if (index2 < joins.length - 1) {
        joinsArray.push(sql` `);
      }
    }
    return sql.join(joinsArray);
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.OriginalName] !== table[Table.Symbol.Name]) {
      let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
      if (table[Table.Symbol.Schema]) {
        fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
      }
      return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` no wait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql.identifier(this.casing.getColumnCasing(column))
    );
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? sql`overriding system value ` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp) || is(encoder, PgTimestampString)) {
      return "timestamp";
    } else if (is(encoder, PgDate) || is(encoder, PgDateString)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql22, invokeSource) {
    return sql22.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config2,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config2 === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config2.where) {
        const whereSql = typeof config2.where === "function" ? config2.where(aliasedColumns, getOperators()) : config2.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config2.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config2.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config2.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config2.with) {
        selectedRelations = Object.entries(config2.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig2]) => ({ tsKey, queryConfig: queryConfig2, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config2.extras) {
        extras = typeof config2.extras === "function" ? config2.extras(aliasedColumns, { sql }) : config2.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config2.orderBy === "function" ? config2.orderBy(aliasedColumns, getOrderByOperators()) : config2.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config2.limit;
      offset = config2.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_agg(${field}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config2) {
    this.config = { ...config2 };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config2) {
    this.fields = config2.fields;
    this.session = config2.session;
    this.dialect = config2.dialect;
    if (config2.withList) {
      this.withList = config2.withList;
    }
    this.distinct = config2.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, PgViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return this.authToken === void 0 ? new PgSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }) : new PgSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config2 = {}) {
    this.config.lockingClause = { strength, config: config2 };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config: config2, dialect, joinsNotNullableMap, authToken } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(config2.fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return authToken === void 0 ? query : query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, PgDialect) ? void 0 : dialect;
  }
  $with(alias) {
    const queryBuilder = this;
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(queryBuilder);
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entityKind] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return this.authToken === void 0 ? new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ) : new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var PgInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select, overridingSystemValue_ };
  }
  static [entityKind] = "PgInsert";
  config;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config2 = {}) {
    if (config2.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config2.target) ? config2.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config2.target));
      const whereSql = config2.where ? sql` where ${config2.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config2) {
    if (config2.where && (config2.targetWhere || config2.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config2.where ? sql` where ${config2.where}` : void 0;
    const targetWhereSql = config2.targetWhere ? sql` where ${config2.targetWhere}` : void 0;
    const setWhereSql = config2.setWhere ? sql` where ${config2.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config2.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config2.target) ? config2.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config2.target));
    this.config.onConflict = sql`(${sql.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values) {
    return this.authToken === void 0 ? new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ) : new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
};
var PgUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entityKind] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  from(source) {
    const tableName = getTableLikeName(source);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = source;
    return this;
  }
  getTableLikeFields(table) {
    if (is(table, PgTable)) {
      return table[Table.Symbol.Columns];
    } else if (is(table, Subquery)) {
      return table._.selectedFields;
    }
    return table[ViewBaseConfig].selectedFields;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from && !is(this.config.from, SQL) ? this.getTableLikeFields(this.config.from) : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
      if (this.config.from) {
        const tableName = getTableLikeName(this.config.from);
        if (typeof tableName === "string" && this.config.from && !is(this.config.from, SQL)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = getTableLikeName(join.table);
          if (typeof tableName2 === "string" && !is(join.table, SQL)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class _PgCountBuilder extends SQL {
  constructor(params) {
    super(_PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = _PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entityKind] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) as count from ${source}${sql.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config2) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? config2 : {},
      "many"
    );
  }
  findFirst(config2) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? { ...config2, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var PgRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config2, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config2;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
  constructor(execute, sql3, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql3;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with(alias) {
    const self = this;
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(new QueryBuilder(self.dialect));
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config2) {
    return this.session.transaction(transaction, config2);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/indexes.js
var IndexBuilderOn = class {
  constructor(unique, name) {
    this.unique = unique;
    this.name = name;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      false,
      this.name
    );
  }
  onOnly(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = it.defaultConfig;
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name
    );
  }
  /**
   * Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
   *
   * If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
   *
   * **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
   *
   * @param method The name of the index method to be used
   * @param columns
   * @returns
   */
  using(method, ...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name,
      method
    );
  }
};
var IndexBuilder = class {
  static [entityKind] = "PgIndexBuilder";
  /** @internal */
  config;
  constructor(columns, unique, only, name, method = "btree") {
    this.config = {
      name,
      columns,
      unique,
      only,
      method
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  with(obj) {
    this.config.with = obj;
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static [entityKind] = "PgIndex";
  config;
  constructor(config2, table) {
    this.config = { ...config2, table };
  }
};
function index(name) {
  return new IndexBuilderOn(false, name);
}
function uniqueIndex(name) {
  return new IndexBuilderOn(true, name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
  constructor(query) {
    this.query = query;
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
};
var PgSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql22, token) {
    const res = await this.execute(sql22, token);
    return Number(
      res[0]["count"]
    );
  }
};
var PgTransaction = class extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config2) {
    const chunks = [];
    if (config2.isolationLevel) {
      chunks.push(`isolation level ${config2.isolationLevel}`);
    }
    if (config2.accessMode) {
      chunks.push(config2.accessMode);
    }
    if (typeof config2.deferrable === "boolean") {
      chunks.push(config2.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config2) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config2)}`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/neon-http/session.js
var rawQueryConfig = {
  arrayMode: false,
  fullResults: true
};
var queryConfig = {
  arrayMode: true,
  fullResults: true
};
var NeonHttpPreparedQuery = class extends PgPreparedQuery {
  constructor(client, query, logger2, fields, _isResponseInArrayMode, customResultMapper) {
    super(query);
    this.client = client;
    this.logger = logger2;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "NeonHttpPreparedQuery";
  /** @internal */
  async execute(placeholderValues = {}, token = this.authToken) {
    const params = fillPlaceholders(this.query.params, placeholderValues);
    this.logger.logQuery(this.query.sql, params);
    const { fields, client, query, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      return client(
        query.sql,
        params,
        token === void 0 ? rawQueryConfig : {
          ...rawQueryConfig,
          authToken: token
        }
      );
    }
    const result = await client(
      query.sql,
      params,
      token === void 0 ? queryConfig : {
        ...queryConfig,
        authToken: token
      }
    );
    return this.mapResult(result);
  }
  mapResult(result) {
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    const rows = result.rows;
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  all(placeholderValues = {}) {
    const params = fillPlaceholders(this.query.params, placeholderValues);
    this.logger.logQuery(this.query.sql, params);
    return this.client(
      this.query.sql,
      params,
      this.authToken === void 0 ? rawQueryConfig : {
        ...rawQueryConfig,
        authToken: this.authToken
      }
    ).then((result) => result.rows);
  }
  /** @internal */
  values(placeholderValues = {}, token) {
    const params = fillPlaceholders(this.query.params, placeholderValues);
    this.logger.logQuery(this.query.sql, params);
    return this.client(this.query.sql, params, { arrayMode: true, fullResults: true, authToken: token }).then((result) => result.rows);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var NeonHttpSession = class extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
  }
  static [entityKind] = "NeonHttpSession";
  logger;
  prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper) {
    return new NeonHttpPreparedQuery(
      this.client,
      query,
      this.logger,
      fields,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push(
        this.client(builtQuery.sql, builtQuery.params, {
          fullResults: true,
          arrayMode: preparedQuery.isResponseInArrayMode()
        })
      );
    }
    const batchResults = await this.client.transaction(builtQueries, queryConfig);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  // change return type to QueryRows<true>
  async query(query, params) {
    this.logger.logQuery(query, params);
    const result = await this.client(query, params, { arrayMode: true, fullResults: true });
    return result;
  }
  // change return type to QueryRows<false>
  async queryObjects(query, params) {
    return this.client(query, params, { arrayMode: false, fullResults: true });
  }
  /** @internal */
  async count(sql3, token) {
    const res = await this.execute(sql3, token);
    return Number(
      res["rows"][0]["count"]
    );
  }
  async transaction(_transaction, _config = {}) {
    throw new Error("No transactions support in neon-http driver");
  }
};
var NeonTransaction = class extends PgTransaction {
  static [entityKind] = "NeonHttpTransaction";
  async transaction(_transaction) {
    throw new Error("No transactions support in neon-http driver");
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.36.4_@neondatabase+serverless@0.9.5_@types+pg@8.11.6_@types+react@19.2.7_react@19.2.3/node_modules/drizzle-orm/neon-http/driver.js
var NeonHttpDriver = class {
  constructor(client, dialect, options = {}) {
    this.client = client;
    this.dialect = dialect;
    this.options = options;
    this.initMappers();
  }
  static [entityKind] = "NeonHttpDriver";
  createSession(schema) {
    return new NeonHttpSession(this.client, this.dialect, schema, { logger: this.options.logger });
  }
  initMappers() {
    import_serverless.types.setTypeParser(import_serverless.types.builtins.TIMESTAMPTZ, (val) => val);
    import_serverless.types.setTypeParser(import_serverless.types.builtins.TIMESTAMP, (val) => val);
    import_serverless.types.setTypeParser(import_serverless.types.builtins.DATE, (val) => val);
    import_serverless.types.setTypeParser(import_serverless.types.builtins.INTERVAL, (val) => val);
  }
};
function wrap(target, token, cb, deep) {
  return new Proxy(target, {
    get(target2, p) {
      const element = target2[p];
      if (typeof element !== "function" && (typeof element !== "object" || element === null))
        return element;
      if (deep)
        return wrap(element, token, cb);
      if (p === "query")
        return wrap(element, token, cb, true);
      return new Proxy(element, {
        apply(target3, thisArg, argArray) {
          const res = target3.call(thisArg, ...argArray);
          if ("setToken" in res && typeof res.setToken === "function") {
            res.setToken(token);
          }
          return cb(target3, p, res);
        }
      });
    }
  });
}
var NeonHttpDatabase = class extends PgDatabase {
  static [entityKind] = "NeonHttpDatabase";
  $withAuth(token) {
    this.authToken = token;
    return wrap(this, token, (target, p, res) => {
      if (p === "with") {
        return wrap(res, token, (_, __, res2) => res2);
      }
      return res;
    });
  }
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function construct(client, config2 = {}) {
  const dialect = new PgDialect({ casing: config2.casing });
  let logger2;
  if (config2.logger === true) {
    logger2 = new DefaultLogger();
  } else if (config2.logger !== false) {
    logger2 = config2.logger;
  }
  let schema;
  if (config2.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config2.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config2.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const driver = new NeonHttpDriver(client, dialect, { logger: logger2 });
  const session = driver.createSession(schema);
  const db2 = new NeonHttpDatabase(
    dialect,
    session,
    schema
  );
  db2.$client = client;
  return db2;
}
function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = (0, import_serverless.neon)(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client)
      return construct(client, drizzleConfig);
    if (typeof connection === "object") {
      const { connectionString, ...options } = connection;
      const instance2 = (0, import_serverless.neon)(connectionString, options);
      return construct(instance2, drizzleConfig);
    }
    const instance = (0, import_serverless.neon)(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config2) {
    return construct({}, config2);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// ../../packages/database/src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  addresses: () => addresses,
  addressesRelations: () => addressesRelations,
  adminActivityLogs: () => adminActivityLogs,
  blogStatusEnum: () => blogStatusEnum,
  blogs: () => blogs,
  breachChecks: () => breachChecks,
  cartItems: () => cartItems,
  cartItemsRelations: () => cartItemsRelations,
  cartPromoCodes: () => cartPromoCodes,
  cartPromoCodesRelations: () => cartPromoCodesRelations,
  carts: () => carts,
  cartsRelations: () => cartsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  customers: () => customers,
  customersRelations: () => customersRelations,
  discountTypeEnum: () => discountTypeEnum,
  importSourceEnum: () => importSourceEnum,
  importStatusEnum: () => importStatusEnum,
  ipReputation: () => ipReputation,
  loginAttempts: () => loginAttempts,
  newsletterCampaigns: () => newsletterCampaigns,
  newsletterCampaignsRelations: () => newsletterCampaignsRelations,
  newsletterSends: () => newsletterSends,
  newsletterSendsRelations: () => newsletterSendsRelations,
  newsletterSubscribers: () => newsletterSubscribers,
  newsletterSubscribersRelations: () => newsletterSubscribersRelations,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orderStatusEnum: () => orderStatusEnum,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  passwordHistory: () => passwordHistory,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentStatusEnum: () => paymentStatusEnum,
  pdfTemplates: () => pdfTemplates,
  productImportJobs: () => productImportJobs,
  productImportJobsRelations: () => productImportJobsRelations,
  productStatusEnum: () => productStatusEnum,
  productVariants: () => productVariants,
  productVariantsRelations: () => productVariantsRelations,
  products: () => products,
  productsRelations: () => productsRelations,
  promoCodes: () => promoCodes,
  quotationActivities: () => quotationActivities,
  quotationActivitiesRelations: () => quotationActivitiesRelations,
  quotationActivityTypeEnum: () => quotationActivityTypeEnum,
  quotationActorTypeEnum: () => quotationActorTypeEnum,
  quotationItems: () => quotationItems,
  quotationItemsRelations: () => quotationItemsRelations,
  quotationRevisions: () => quotationRevisions,
  quotationRevisionsRelations: () => quotationRevisionsRelations,
  quotationStatusEnum: () => quotationStatusEnum,
  quotationTemplates: () => quotationTemplates,
  quotations: () => quotations,
  quotationsRelations: () => quotationsRelations,
  securityAuditLogs: () => securityAuditLogs,
  sessions: () => sessions,
  settings: () => settings,
  verificationCodeTypeEnum: () => verificationCodeTypeEnum,
  verificationCodes: () => verificationCodes
});

// ../../packages/database/src/schema/categories.ts
var categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  parentId: uuid("parent_id").references(() => categories.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild"
  }),
  children: many(categories, { relationName: "parentChild" })
}));

// ../../packages/database/src/schema/products.ts
var productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);
var products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  brand: varchar("brand", { length: 255 }),
  // Pricing - base price only, calculations done in backend
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  // Physical attributes
  weight: decimal("weight", { precision: 10, scale: 2 }),
  // in grams
  dimensions: jsonb("dimensions").$type(),
  // Inventory
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  trackInventory: boolean("track_inventory").default(true).notNull(),
  allowBackorder: boolean("allow_backorder").default(false).notNull(),
  // Media - stored as JSON arrays
  images: jsonb("images").default([]).$type(),
  videos: jsonb("videos").default([]).$type(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  // Organization & categorization
  tags: jsonb("tags").default([]).$type(),
  specifications: jsonb("specifications").default({}).$type(),
  features: jsonb("features").default([]).$type(),
  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  // Status & flags
  status: productStatusEnum("status").default("draft").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isDigital: boolean("is_digital").default(false).notNull(),
  requiresShipping: boolean("requires_shipping").default(true).notNull(),
  // Supplier information
  supplierId: varchar("supplier_id", { length: 255 }),
  supplierSku: varchar("supplier_sku", { length: 255 }),
  // Import tracking
  importedFrom: varchar("imported_from", { length: 255 }),
  externalUrl: varchar("external_url", { length: 500 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  options: jsonb("options").notNull().$type(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  variants: many(productVariants)
}));
var productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id]
  })
}));

// ../../packages/database/src/schema/customers.ts
var customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: varchar("auth_user_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  // Authentication
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 20 }).default("customer").notNull(),
  // 'customer' | 'admin'
  // Email verification
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  // Default addresses stored as JSON
  defaultShippingAddress: jsonb("default_shipping_address").$type(),
  defaultBillingAddress: jsonb("default_billing_address").$type(),
  // Account security
  accountLocked: boolean("account_locked").default(false).notNull(),
  accountLockedAt: timestamp("account_locked_at"),
  accountLockedReason: text("account_locked_reason"),
  // Customer data
  isGuest: boolean("is_guest").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  acceptsMarketing: boolean("accepts_marketing").default(false).notNull(),
  notes: text("notes"),
  tags: varchar("tags", { length: 255 }).array(),
  // Stats (count only, totals calculated)
  orderCount: integer("order_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'shipping' | 'billing'
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses)
}));
var addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id]
  })
}));

// ../../packages/database/src/schema/promoCodes.ts
var discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed_amount"]);
var promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  // Discount type
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  // Constraints
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal("maximum_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  usageLimitPerCustomer: integer("usage_limit_per_customer").default(1).notNull(),
  // Validity
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  // Restrictions (stored as UUID arrays)
  appliesToProducts: uuid("applies_to_products").array(),
  appliesToCategories: uuid("applies_to_categories").array(),
  customerIds: uuid("customer_ids").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ../../packages/database/src/schema/orders.ts
var orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]);
var paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);
var paymentMethodEnum = pgEnum("payment_method", ["cod", "stripe", "paypal", "bank_transfer", "cash"]);
var orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  // Status tracking
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  // Addresses (snapshot at time of order)
  shippingAddress: jsonb("shipping_address").notNull().$type(),
  billingAddress: jsonb("billing_address").notNull().$type(),
  // Pricing stored as snapshot (calculated at checkout time)
  // CRITICAL: These are snapshots, not live calculated values
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotalSnapshot: decimal("subtotal_snapshot", { precision: 10, scale: 2 }).notNull(),
  taxRateSnapshot: decimal("tax_rate_snapshot", { precision: 5, scale: 4 }).notNull(),
  taxAmountSnapshot: decimal("tax_amount_snapshot", { precision: 10, scale: 2 }).notNull(),
  shippingAmountSnapshot: decimal("shipping_amount_snapshot", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmountSnapshot: decimal("discount_amount_snapshot", { precision: 10, scale: 2 }).default("0").notNull(),
  totalSnapshot: decimal("total_snapshot", { precision: 10, scale: 2 }).notNull(),
  // Promo code used
  promoCodeId: uuid("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
  promoCodeSnapshot: varchar("promo_code_snapshot", { length: 50 }),
  // Payment
  paymentMethod: paymentMethodEnum("payment_method").default("cod").notNull(),
  // Shipping
  shippingMethod: varchar("shipping_method", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  confirmedAt: timestamp("confirmed_at"),
  processingAt: timestamp("processing_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  // Notes
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  // Snapshot data (in case product changes later)
  productNameSnapshot: varchar("product_name_snapshot", { length: 255 }).notNull(),
  skuSnapshot: varchar("sku_snapshot", { length: 100 }).notNull(),
  variantOptionsSnapshot: jsonb("variant_options_snapshot").$type(),
  quantity: integer("quantity").notNull(),
  unitPriceSnapshot: decimal("unit_price_snapshot", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id]
  }),
  items: many(orderItems)
}));
var orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id]
  })
}));

// ../../packages/database/src/schema/pdfTemplates.ts
var pdfTemplates = pgTable("pdf_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  // Branding
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#1a1a2e").notNull(),
  accentColor: varchar("accent_color", { length: 7 }).default("#0066cc").notNull(),
  // Display options
  showCompanyLogo: boolean("show_company_logo").default(true).notNull(),
  showLineItemImages: boolean("show_line_item_images").default(false).notNull(),
  showLineItemDescription: boolean("show_line_item_description").default(false).notNull(),
  showSku: boolean("show_sku").default(true).notNull(),
  // Custom text
  headerText: text("header_text"),
  footerText: text("footer_text"),
  thankYouMessage: text("thank_you_message"),
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ../../packages/database/src/schema/quotations.ts
var quotationStatusEnum = pgEnum("quotation_status", ["draft", "sent", "accepted", "rejected", "expired"]);
var quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  // Customer info (for non-registered customers)
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerCompany: varchar("customer_company", { length: 255 }),
  customerAddress: jsonb("customer_address").$type(),
  // Status
  status: quotationStatusEnum("status").default("draft").notNull(),
  // Validity
  validUntil: timestamp("valid_until"),
  validDays: integer("valid_days").default(30),
  // Pricing (calculated at generation time)
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  discountType: varchar("discount_type", { length: 20 }),
  // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  // Notes
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  // PDF
  pdfUrl: varchar("pdf_url", { length: 500 }),
  pdfTemplateId: uuid("pdf_template_id").references(() => pdfTemplates.id, { onDelete: "set null" }),
  // Converted to order
  convertedToOrderId: uuid("converted_to_order_id").references(() => orders.id, { onDelete: "set null" }),
  // Customer acceptance link
  acceptanceToken: varchar("acceptance_token", { length: 64 }).unique(),
  tokenExpiresAt: timestamp("token_expires_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var quotationItems = pgTable("quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  // Item details (can be custom items not in catalog)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id]
  }),
  convertedToOrder: one(orders, {
    fields: [quotations.convertedToOrderId],
    references: [orders.id]
  }),
  pdfTemplate: one(pdfTemplates, {
    fields: [quotations.pdfTemplateId],
    references: [pdfTemplates.id]
  }),
  items: many(quotationItems)
}));
var quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id]
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [quotationItems.variantId],
    references: [productVariants.id]
  })
}));
var quotationActivityTypeEnum = pgEnum("quotation_activity_type", [
  "created",
  "updated",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
  "duplicated",
  "pdf_generated",
  "note_added",
  "status_changed"
]);
var quotationActorTypeEnum = pgEnum("quotation_actor_type", [
  "system",
  "admin",
  "customer"
]);
var quotationActivities = pgTable("quotation_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  // Activity type
  activityType: quotationActivityTypeEnum("activity_type").notNull(),
  description: text("description").notNull(),
  // Who performed the action
  actorType: quotationActorTypeEnum("actor_type").default("system").notNull(),
  actorId: uuid("actor_id"),
  // admin user id or customer id (optional)
  actorName: varchar("actor_name", { length: 255 }),
  // Display name
  // Additional metadata (JSON for flexibility)
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var quotationActivitiesRelations = relations(quotationActivities, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationActivities.quotationId],
    references: [quotations.id]
  })
}));
var quotationTemplates = pgTable("quotation_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Template items (stored as JSON)
  items: jsonb("items").$type().notNull().default([]),
  // Default pricing settings
  defaultDiscount: decimal("default_discount", { precision: 10, scale: 2 }),
  defaultDiscountType: varchar("default_discount_type", { length: 20 }),
  defaultTaxRate: decimal("default_tax_rate", { precision: 5, scale: 4 }),
  defaultValidDays: integer("default_valid_days").default(30),
  // Default terms
  defaultTerms: text("default_terms"),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var quotationRevisions = pgTable("quotation_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  versionNumber: integer("version_number").notNull(),
  snapshot: jsonb("snapshot").$type().notNull(),
  changeDescription: text("change_description"),
  createdBy: uuid("created_by"),
  // Admin user ID
  createdByName: varchar("created_by_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var quotationRevisionsRelations = relations(quotationRevisions, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationRevisions.quotationId],
    references: [quotations.id]
  })
}));

// ../../packages/database/src/schema/blogs.ts
var blogStatusEnum = pgEnum("blog_status", ["draft", "published", "archived"]);
var blogs = pgTable("blogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  featuredImageUrl: varchar("featured_image_url", { length: 500 }),
  authorId: uuid("author_id"),
  authorName: varchar("author_name", { length: 255 }),
  status: blogStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  tags: varchar("tags", { length: 100 }).array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ../../packages/database/src/schema/settings.ts
var settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var adminActivityLogs = pgTable("admin_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: varchar("admin_user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ../../packages/database/src/schema/carts.ts
var carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var cartPromoCodes = pgTable("cart_promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull().unique(),
  promoCodeId: uuid("promo_code_id").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id]
  }),
  items: many(cartItems),
  promoCode: one(cartPromoCodes)
}));
var cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id]
  })
}));
var cartPromoCodesRelations = relations(cartPromoCodes, ({ one }) => ({
  cart: one(carts, {
    fields: [cartPromoCodes.cartId],
    references: [carts.id]
  })
}));

// ../../packages/database/src/schema/imports.ts
var importSourceEnum = pgEnum("import_source", ["amazon", "aliexpress", "ebay"]);
var importStatusEnum = pgEnum("import_status", ["pending", "processing", "completed", "failed"]);
var productImportJobs = pgTable("product_import_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: importSourceEnum("source").notNull(),
  sourceUrl: varchar("source_url", { length: 500 }).notNull(),
  status: importStatusEnum("status").default("pending").notNull(),
  importedProductId: uuid("imported_product_id").references(() => products.id, { onDelete: "set null" }),
  errorMessage: text("error_message"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
var productImportJobsRelations = relations(productImportJobs, ({ one }) => ({
  importedProduct: one(products, {
    fields: [productImportJobs.importedProductId],
    references: [products.id]
  })
}));

// ../../packages/database/src/schema/verificationCodes.ts
var verificationCodeTypeEnum = pgEnum("verification_code_type", [
  "password_reset",
  "email_verification",
  "account_unlock"
]);
var verificationCodes = pgTable("verification_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Code details
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  type: verificationCodeTypeEnum("type").notNull(),
  // Security & tracking
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  // Expiration
  expiresAt: timestamp("expires_at").notNull(),
  // Status tracking
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  // IP tracking
  ipAddress: varchar("ip_address", { length: 45 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  emailIdx: index("verification_codes_email_idx").on(table.email),
  expiresAtIdx: index("verification_codes_expires_at_idx").on(table.expiresAt)
}));

// ../../packages/database/src/schema/sessions.ts
var sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    // Token tracking
    tokenHash: varchar("token_hash", { length: 255 }).unique().notNull(),
    // Device information
    deviceName: varchar("device_name", { length: 100 }),
    deviceType: varchar("device_type", { length: 50 }),
    // desktop | mobile | tablet
    deviceBrowser: varchar("device_browser", { length: 50 }),
    browserVersion: varchar("browser_version", { length: 50 }),
    osName: varchar("os_name", { length: 50 }),
    osVersion: varchar("os_version", { length: 50 }),
    // Network information
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
    ipCountry: varchar("ip_country", { length: 100 }),
    ipCity: varchar("ip_city", { length: 100 }),
    ipLatitude: decimal("ip_latitude", { precision: 10, scale: 8 }),
    ipLongitude: decimal("ip_longitude", { precision: 11, scale: 8 }),
    // Full user agent
    userAgent: text("user_agent").notNull(),
    // Activity tracking
    loginAt: timestamp("login_at").notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
    // Session status
    isActive: boolean("is_active").default(true).notNull(),
    revokedAt: timestamp("revoked_at"),
    revokeReason: varchar("revoke_reason", { length: 100 }),
    // user_action | security | admin_action
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    customerIdx: index("sessions_customer_idx").on(table.customerId),
    activeIdx: index("sessions_active_idx").on(table.isActive),
    activityIdx: index("sessions_activity_idx").on(table.lastActivityAt),
    tokenHashIdx: index("sessions_token_hash_idx").on(table.tokenHash)
  })
);

// ../../packages/database/src/schema/passwordHistory.ts
var passwordHistory = pgTable(
  "password_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    // Password hash (stored to prevent reuse)
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    // Metadata
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    // Source of change
    changeReason: varchar("change_reason", { length: 50 })
    // user_action | admin_reset | password_reset | forced_change
  },
  (table) => ({
    customerIdx: index("password_history_customer_idx").on(table.customerId),
    changedAtIdx: index("password_history_changed_at_idx").on(table.changedAt)
  })
);

// ../../packages/database/src/schema/loginAttempts.ts
var loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    // Attempt details
    email: varchar("email", { length: 255 }).notNull(),
    success: boolean("success").notNull(),
    failureReason: varchar("failure_reason", { length: 100 }),
    // invalid_credentials | account_locked | email_unverified | account_disabled
    // Device and network information
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
    userAgent: varchar("user_agent", { length: 500 }),
    deviceType: varchar("device_type", { length: 50 }),
    // desktop | mobile | tablet
    deviceBrowser: varchar("device_browser", { length: 50 }),
    // Geographic information (optional)
    ipCountry: varchar("ip_country", { length: 100 }),
    ipCity: varchar("ip_city", { length: 100 }),
    // Lockout tracking
    triggeredLockout: boolean("triggered_lockout").default(false).notNull(),
    consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
    // Timestamp
    attemptedAt: timestamp("attempted_at").notNull().defaultNow()
  },
  (table) => ({
    customerIdx: index("login_attempts_customer_idx").on(table.customerId),
    emailIdx: index("login_attempts_email_idx").on(table.email),
    attemptedAtIdx: index("login_attempts_attempted_at_idx").on(table.attemptedAt),
    successIdx: index("login_attempts_success_idx").on(table.success)
  })
);

// ../../packages/database/src/schema/breachChecks.ts
var breachChecks = pgTable(
  "breach_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    // Password hash prefix (k-anonymity - first 5 chars of SHA-1)
    passwordHashPrefix: varchar("password_hash_prefix", { length: 5 }).notNull(),
    // Breach status
    isBreached: boolean("is_breached").notNull(),
    breachCount: integer("breach_count").default(0).notNull(),
    // Number of times seen in breaches
    // Check metadata
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    // Cache for 30 days
    // Context
    checkReason: varchar("check_reason", { length: 50 }),
    // registration | password_change | password_reset | periodic_check
    ipAddress: varchar("ip_address", { length: 45 })
  },
  (table) => ({
    customerIdx: index("breach_checks_customer_idx").on(table.customerId),
    prefixIdx: index("breach_checks_prefix_idx").on(table.passwordHashPrefix),
    expiresAtIdx: index("breach_checks_expires_at_idx").on(table.expiresAt)
  })
);

// ../../packages/database/src/schema/securityAuditLogs.ts
var securityAuditLogs = pgTable(
  "security_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    // Actor (who performed the action)
    actorType: varchar("actor_type", { length: 20 }).notNull(),
    // customer | admin | system
    actorId: uuid("actor_id"),
    actorEmail: varchar("actor_email", { length: 255 }),
    // Target (what was acted upon)
    targetType: varchar("target_type", { length: 50 }),
    targetId: uuid("target_id"),
    // Action
    action: varchar("action", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    // success | failure | denied
    // Context
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    sessionId: uuid("session_id"),
    requestId: uuid("request_id"),
    // Event-specific metadata
    metadata: jsonb("metadata"),
    // Timestamp
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    // Performance indexes for common queries
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
    eventTypeIdx: index("audit_logs_event_type_idx").on(table.eventType),
    actorIdx: index("audit_logs_actor_idx").on(table.actorId),
    ipAddressIdx: index("audit_logs_ip_address_idx").on(table.ipAddress),
    sessionIdx: index("audit_logs_session_idx").on(table.sessionId)
  })
);

// ../../packages/database/src/schema/ipReputation.ts
var ipReputation = pgTable(
  "ip_reputation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),
    // Reputation scoring
    reputationScore: integer("reputation_score").notNull().default(100),
    // 0-100, lower = worse
    // Counters
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    successfulLogins: integer("successful_logins").notNull().default(0),
    rateLimitViolations: integer("rate_limit_violations").notNull().default(0),
    abuseReports: integer("abuse_reports").notNull().default(0),
    // Status
    isBlocked: boolean("is_blocked").default(false).notNull(),
    blockReason: varchar("block_reason", { length: 255 }),
    blockedAt: timestamp("blocked_at"),
    blockedUntil: timestamp("blocked_until"),
    // Null = permanent block
    // Metadata
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    userAgent: text("user_agent"),
    country: varchar("country", { length: 100 }),
    notes: text("notes"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    ipAddressIdx: index("ip_reputation_ip_address_idx").on(table.ipAddress),
    isBlockedIdx: index("ip_reputation_is_blocked_idx").on(table.isBlocked),
    reputationScoreIdx: index("ip_reputation_score_idx").on(table.reputationScore)
  })
);

// ../../packages/database/src/schema/newsletter.ts
var newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  // Link to customer if they have an account
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(),
  // 'active' | 'unsubscribed' | 'bounced'
  // Source of subscription
  source: varchar("source", { length: 50 }).default("footer").notNull(),
  // 'footer' | 'checkout' | 'popup' | 'import' | 'admin'
  // Unsubscribe token for secure unsubscribe links
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
  // Timestamps
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  uniqueIndex("newsletter_subscribers_email_idx").on(table.email)
]);
var newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Campaign details
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  previewText: varchar("preview_text", { length: 255 }),
  // Email preview text
  content: text("content").notNull(),
  // HTML content
  // Status: draft | scheduled | sending | paused | completed | cancelled
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  // Sending configuration
  dailyLimit: integer("daily_limit").default(100).notNull(),
  // Max emails per day
  sendTime: varchar("send_time", { length: 5 }),
  // Preferred send time HH:MM (24h format)
  // Statistics
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  openCount: integer("open_count").default(0).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  // Timestamps
  scheduledAt: timestamp("scheduled_at"),
  // When to start sending
  startedAt: timestamp("started_at"),
  // When sending actually started
  completedAt: timestamp("completed_at"),
  // When all emails were sent
  lastSentAt: timestamp("last_sent_at"),
  // Last email sent timestamp
  // Created by admin
  createdBy: uuid("created_by").references(() => customers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var newsletterSends = pgTable("newsletter_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => newsletterCampaigns.id, { onDelete: "cascade" }).notNull(),
  subscriberId: uuid("subscriber_id").references(() => newsletterSubscribers.id, { onDelete: "cascade" }).notNull(),
  // Email address at time of send (in case subscriber changes email)
  email: varchar("email", { length: 255 }).notNull(),
  // Status: pending | sent | failed | bounced
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // Error tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  // Engagement tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  // Timestamps
  scheduledFor: timestamp("scheduled_for"),
  // When this email should be sent
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var newsletterSubscribersRelations = relations(newsletterSubscribers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [newsletterSubscribers.customerId],
    references: [customers.id]
  }),
  sends: many(newsletterSends)
}));
var newsletterCampaignsRelations = relations(newsletterCampaigns, ({ one, many }) => ({
  createdByCustomer: one(customers, {
    fields: [newsletterCampaigns.createdBy],
    references: [customers.id]
  }),
  sends: many(newsletterSends)
}));
var newsletterSendsRelations = relations(newsletterSends, ({ one }) => ({
  campaign: one(newsletterCampaigns, {
    fields: [newsletterSends.campaignId],
    references: [newsletterCampaigns.id]
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [newsletterSends.subscriberId],
    references: [newsletterSubscribers.id]
  })
}));

// ../../packages/database/src/client.ts
function createDb(connectionString) {
  const sql3 = (0, import_serverless2.neon)(connectionString);
  return drizzle(sql3, { schema: schema_exports });
}
var dbInstance = null;
function getDb() {
  if (!dbInstance) {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    dbInstance = createDb(connectionString);
  }
  return dbInstance;
}
var db = getDb();

// src/services/session.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_ua_parser_js = require("ua-parser-js");
var SessionService = class {
  /**
   * Parse User-Agent string to extract device information
   */
  parseUserAgent(userAgent) {
    const parser = new import_ua_parser_js.UAParser(userAgent);
    const result = parser.getResult();
    const browser = result.browser.name || "Unknown Browser";
    const browserVersion = result.browser.version || "";
    const os = result.os.name || "Unknown OS";
    const osVersion = result.os.version || "";
    const deviceType = result.device.type || "desktop";
    const deviceName = `${browser} on ${os}${osVersion ? ` ${osVersion}` : ""}`;
    return {
      deviceName,
      deviceType,
      deviceBrowser: browser,
      browserVersion,
      osName: os,
      osVersion
    };
  }
  /**
   * Create new session on login
   * Returns sessionId for JWT embedding
   */
  async createSession(options) {
    const { customerId, userAgent, ipAddress } = options;
    const deviceInfo = this.parseUserAgent(userAgent);
    const [session] = await db.insert(sessions).values({
      customerId,
      userAgent,
      ipAddress,
      ...deviceInfo,
      tokenHash: "pending",
      // Placeholder, will be updated after token generation
      loginAt: /* @__PURE__ */ new Date(),
      lastActivityAt: /* @__PURE__ */ new Date()
    }).returning();
    if (!session) {
      throw new Error("Failed to create session");
    }
    logger.info("Session created", {
      sessionId: session.id,
      customerId,
      deviceName: deviceInfo.deviceName,
      ipAddress
    });
    return session.id;
  }
  /**
   * Update session with token hash after JWT generation
   */
  async setTokenHash(sessionId, token) {
    const tokenHash = await import_bcryptjs.default.hash(token, 10);
    await db.update(sessions).set({ tokenHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sessions.id, sessionId));
    logger.debug("Token hash set for session", { sessionId });
  }
  /**
   * Validate session is active
   */
  async validateSession(sessionId) {
    const [session] = await db.select().from(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.isActive, true))).limit(1);
    if (!session) {
      return null;
    }
    return {
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || "Unknown Device",
      deviceType: session.deviceType || "desktop",
      deviceBrowser: session.deviceBrowser || "",
      browserVersion: session.browserVersion || "",
      osName: session.osName || "",
      osVersion: session.osVersion || "",
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive
    };
  }
  /**
   * Update last activity timestamp (async, non-blocking)
   */
  async updateActivity(sessionId) {
    await db.update(sessions).set({ lastActivityAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(sessions.id, sessionId));
  }
  /**
   * Get all active sessions for customer
   */
  async getActiveSessions(customerId) {
    const sessionList = await db.select().from(sessions).where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true))).orderBy(desc(sessions.lastActivityAt));
    return sessionList.map((session) => ({
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || "Unknown Device",
      deviceType: session.deviceType || "desktop",
      deviceBrowser: session.deviceBrowser || "",
      browserVersion: session.browserVersion || "",
      osName: session.osName || "",
      osVersion: session.osVersion || "",
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive
    }));
  }
  /**
   * Revoke specific session
   */
  async revokeSession(sessionId, reason) {
    await db.update(sessions).set({
      isActive: false,
      revokedAt: /* @__PURE__ */ new Date(),
      revokeReason: reason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(sessions.id, sessionId));
    logger.info("Session revoked", { sessionId, reason });
  }
  /**
   * Revoke all sessions except current
   */
  async revokeOtherSessions(customerId, currentSessionId) {
    const result = await db.update(sessions).set({
      isActive: false,
      revokedAt: /* @__PURE__ */ new Date(),
      revokeReason: "user_action",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and(
        eq(sessions.customerId, customerId),
        eq(sessions.isActive, true),
        ne(sessions.id, currentSessionId)
      )
    );
    const count2 = result.rowCount || 0;
    logger.info("Other sessions revoked", { customerId, count: count2 });
    return count2;
  }
  /**
   * Revoke all sessions for customer
   */
  async revokeAllSessions(customerId) {
    const result = await db.update(sessions).set({
      isActive: false,
      revokedAt: /* @__PURE__ */ new Date(),
      revokeReason: "user_action",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true)));
    const count2 = result.rowCount || 0;
    logger.info("All sessions revoked", { customerId, count: count2 });
    return count2;
  }
  /**
   * Cleanup old/revoked sessions (for cron job)
   */
  async cleanupSessions() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3);
    const result = await db.delete(sessions).where(
      or(
        // Revoked sessions older than 30 days
        and(eq(sessions.isActive, false), lt(sessions.revokedAt, thirtyDaysAgo)),
        // Inactive sessions older than 7 days
        and(eq(sessions.isActive, false), lt(sessions.lastActivityAt, sevenDaysAgo)),
        // Very old sessions (90+ days)
        lt(sessions.createdAt, ninetyDaysAgo)
      )
    );
    const count2 = result.rowCount || 0;
    logger.info("Sessions cleaned up", { count: count2 });
    return count2;
  }
};
var sessionService = new SessionService();

// src/middleware/auth.ts
function extractToken(req) {
  const cookieToken = req.cookies?.["auth_token"];
  if (cookieToken) {
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1] || null;
}
function verifyToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, config.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        customerId: payload.customerId,
        sessionId: payload.sessionId
      };
    }
    const sessionId = req.headers["x-session-id"];
    if (sessionId && (0, import_uuid2.validate)(sessionId)) {
      req.sessionId = sessionId;
    }
    next();
  } catch {
    next();
  }
}
async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }
    const payload = verifyToken(token);
    if (payload.sessionId) {
      const session = await sessionService.validateSession(payload.sessionId);
      if (!session) {
        throw new UnauthorizedError("Session not found or expired");
      }
      if (!session.isActive) {
        throw new UnauthorizedError("Session has been revoked");
      }
      sessionService.updateActivity(session.id).catch(
        (err) => logger.error("Failed to update session activity", { sessionId: session.id, error: err })
      );
    }
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      customerId: payload.customerId,
      sessionId: payload.sessionId
    };
    next();
  } catch (error) {
    next(error);
  }
}
function requireAdmin(req, _res, next) {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (req.user.role !== "admin") {
      throw new ForbiddenError("Admin access required");
    }
    next();
  } catch (error) {
    next(error);
  }
}
function generateToken(payload) {
  return import_jsonwebtoken.default.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256"
  });
}
function getTokenExpiration() {
  const expiresIn = config.jwtExpiresIn;
  const ms = parseDuration(expiresIn);
  return new Date(Date.now() + ms);
}
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1e3;
  }
  const value = parseInt(match[1] || "0", 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1e3;
    case "m":
      return value * 60 * 1e3;
    case "h":
      return value * 60 * 60 * 1e3;
    case "d":
      return value * 24 * 60 * 60 * 1e3;
    default:
      return 7 * 24 * 60 * 60 * 1e3;
  }
}

// src/middleware/validator.ts
var import_zod2 = require("zod");
function validate(schema, source = "body") {
  return (req, _res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof import_zod2.ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
          code: e.code
        }));
        logger.error("Validation failed", {
          path: req.path,
          method: req.method,
          errors: details,
          receivedData: source === "body" ? JSON.stringify(req.body).substring(0, 1e3) : void 0
        });
        next(new ValidationError("Validation failed", details));
      } else {
        next(error);
      }
    }
  };
}
function validateBody(schema) {
  return validate(schema, "body");
}
function validateQuery(schema) {
  return validate(schema, "query");
}

// src/middleware/rateLimiter.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var defaultLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
  }
});
var authLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env["NODE_ENV"] === "development" ? 20 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many authentication attempts, please try again later");
  }
});
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
  }
});
var strictLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
  }
});
var cronLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many cron requests, please try again later");
  }
});
var verificationLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // 3 requests per hour
  // Rate limit by email address from request body, fallback to IP
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? email.toLowerCase() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      "TOO_MANY_REQUESTS",
      "Too many verification code requests. Please try again in 1 hour."
    );
  }
});

// src/middleware/csrf.ts
var import_csrf_csrf = require("csrf-csrf");
var {
  generateCsrfToken,
  doubleCsrfProtection
} = (0, import_csrf_csrf.doubleCsrf)({
  getSecret: () => process.env["CSRF_SECRET"] || process.env["JWT_SECRET"] || "",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/"
  },
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
  getSessionIdentifier: (req) => {
    return req.sessionId || `${req.headers["user-agent"]}-${req.ip}`;
  }
});

// src/middleware/xss.ts
var import_xss = __toESM(require("xss"));
var strictOptions = {
  whiteList: {},
  // No tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"]
};
var richContentOptions = {
  whiteList: {
    // Text formatting
    p: ["style", "class"],
    br: [],
    b: [],
    i: [],
    u: [],
    strong: [],
    em: [],
    span: ["style", "class"],
    // Links
    a: ["href", "title", "target", "style", "class"],
    // Lists
    ul: ["style", "class"],
    ol: ["style", "class"],
    li: ["style", "class"],
    // Headings
    h1: ["style", "class"],
    h2: ["style", "class"],
    h3: ["style", "class"],
    h4: ["style", "class"],
    h5: ["style", "class"],
    h6: ["style", "class"],
    // Block elements
    blockquote: ["style", "class"],
    code: ["class"],
    pre: ["style", "class"],
    div: ["style", "class", "id"],
    // Media
    img: ["src", "alt", "title", "width", "height", "style", "class"],
    // Layout
    hr: ["style"],
    // Tables
    table: ["style", "class", "border", "cellpadding", "cellspacing", "width", "align"],
    thead: ["style"],
    tbody: ["style"],
    tfoot: ["style"],
    tr: ["style", "class"],
    th: ["style", "class", "colspan", "rowspan", "align", "valign"],
    td: ["style", "class", "colspan", "rowspan", "align", "valign", "width", "height"],
    caption: ["style"]
  },
  stripIgnoreTag: false,
  stripIgnoreTagBody: ["script"],
  onIgnoreTagAttr: function(tag, name, value, isWhiteAttr) {
    if (name.startsWith("data-")) {
      return `${name}="${(0, import_xss.escapeAttrValue)(value)}"`;
    }
  }
};
var rawHtmlFields = ["content"];
var sanitize = (obj, options = strictOptions, fieldName) => {
  if (typeof obj === "string") {
    if (fieldName && rawHtmlFields.includes(fieldName)) {
      return obj;
    }
    return (0, import_xss.default)(obj, options);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, options, fieldName));
  }
  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitize(obj[key], options, key);
    }
    return sanitized;
  }
  return obj;
};
var xssSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    for (const key in sanitizedQuery) {
      req.query[key] = sanitizedQuery[key];
    }
  }
  if (req.params) {
    const sanitizedParams = sanitize(req.params);
    for (const key in sanitizedParams) {
      req.params[key] = sanitizedParams[key];
    }
  }
  next();
};
var sanitizeRichContent = (html) => {
  return (0, import_xss.default)(html, richContentOptions);
};

// src/middleware/request-id.ts
var import_uuid3 = require("uuid");
function requestIdMiddleware(req, res, next) {
  const existingId = req.get("X-Request-ID");
  const requestId = existingId || (0, import_uuid3.v4)();
  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

// src/routes/index.ts
var import_express26 = require("express");

// src/routes/auth.routes.ts
var import_express = require("express");
var import_zod4 = require("zod");
var import_bcryptjs3 = __toESM(require("bcryptjs"));

// src/utils/helpers.ts
var import_slugify = __toESM(require("slugify"));
var import_uuid4 = require("uuid");
function generateSlug(text2) {
  return (0, import_slugify.default)(text2, {
    lower: true,
    strict: true,
    trim: true
  });
}
function generateOrderNumber(sequence) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const paddedSequence = String(sequence).padStart(4, "0");
  return `LAB-${year}-${paddedSequence}`;
}
function generateSku() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let sku = "LAB-";
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sku;
}
function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// src/services/pricing.service.ts
var PricingService = class {
  db = getDb();
  /**
   * Calculate cart totals
   * This is the main method for cart calculation
   *
   * @param items - Cart items with product/variant IDs and quantities
   * @param promoCode - Optional promo code to apply
   * @returns Complete cart calculation with all totals
   */
  async calculateCart(items, promoCode) {
    if (items.length === 0) {
      return this.emptyCartCalculation();
    }
    const productIds = items.map((item) => item.productId);
    const productData = await this.db.select().from(products).where(inArray(products.id, productIds));
    const variantIds = items.filter((item) => item.variantId).map((item) => item.variantId);
    let variantData = [];
    if (variantIds.length > 0) {
      variantData = await this.db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
    }
    const calculatedItems = items.map((item) => {
      const product = productData.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestError(`Product not found: ${item.productId}`);
      }
      if (product.status !== "active") {
        throw new BadRequestError(`Product is not available: ${product.name}`);
      }
      let unitPrice = Number(product.basePrice);
      let variant;
      if (item.variantId) {
        variant = variantData.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestError(`Variant not found: ${item.variantId}`);
        }
        if (!variant.isActive) {
          throw new BadRequestError(`Variant is not available: ${variant.name}`);
        }
        unitPrice = Number(variant.basePrice);
      }
      const stockQuantity = variant?.stockQuantity ?? product.stockQuantity;
      const inStock = stockQuantity > 0 || product.allowBackorder;
      if (!inStock) {
        throw new BadRequestError(`Product is out of stock: ${product.name}`);
      }
      if (item.quantity > stockQuantity && !product.allowBackorder) {
        throw new BadRequestError(
          `Not enough stock for ${product.name}. Available: ${stockQuantity}`
        );
      }
      const lineTotal = round(unitPrice * item.quantity, 2);
      return {
        id: item.id || item.variantId || item.productId,
        productId: item.productId,
        variantId: item.variantId,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          thumbnailUrl: this.getProductImage(product),
          basePrice: unitPrice,
          stockQuantity,
          inStock
        },
        variant: variant ? {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          options: variant.options,
          basePrice: Number(variant.basePrice)
        } : void 0,
        quantity: item.quantity,
        unitPrice,
        lineTotal
      };
    });
    const subtotal = round(
      calculatedItems.reduce((sum2, item) => sum2 + item.lineTotal, 0),
      2
    );
    const itemsWithCategory = calculatedItems.map((item) => {
      const product = productData.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        categoryId: product?.categoryId || null,
        lineTotal: item.lineTotal
      };
    });
    let discountAmount = 0;
    let eligibleItemIds = [];
    let promoCodeResult;
    if (promoCode) {
      promoCodeResult = await this.validatePromoCode(promoCode, subtotal);
      if (promoCodeResult) {
        const discountResult = this.calculateDiscount(promoCodeResult, itemsWithCategory);
        discountAmount = discountResult.discountAmount;
        eligibleItemIds = discountResult.eligibleItemIds;
      }
    }
    const taxRate = await this.getTaxRate();
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = round(taxableAmount * taxRate, 2);
    const shippingAmount = 0;
    const total = round(taxableAmount + taxAmount + shippingAmount, 2);
    const itemCount = calculatedItems.reduce((sum2, item) => sum2 + item.quantity, 0);
    return {
      items: calculatedItems,
      itemCount,
      subtotal,
      taxRate,
      taxAmount,
      shippingAmount,
      discountAmount,
      promoCode: promoCodeResult?.code,
      promoCodeId: promoCodeResult?.id,
      eligibleItemIds: eligibleItemIds.length > 0 ? eligibleItemIds : void 0,
      total,
      currency: "USD"
    };
  }
  /**
   * Calculate order totals for checkout
   * Similar to calculateCart but creates snapshots for order creation
   */
  async calculateOrderTotals(items, promoCode) {
    const cartCalc = await this.calculateCart(items, promoCode);
    return {
      subtotal: cartCalc.subtotal,
      taxRate: cartCalc.taxRate,
      taxAmount: cartCalc.taxAmount,
      shippingAmount: cartCalc.shippingAmount,
      discountAmount: cartCalc.discountAmount,
      total: cartCalc.total,
      promoCodeId: cartCalc.promoCodeId,
      promoCodeSnapshot: cartCalc.promoCode
    };
  }
  /**
   * Validate a promo code
   */
  async validatePromoCode(code, subtotal) {
    const [promoCodeData] = await this.db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    if (!promoCodeData) {
      return void 0;
    }
    if (!promoCodeData.isActive) {
      return void 0;
    }
    const now = /* @__PURE__ */ new Date();
    if (promoCodeData.startsAt && new Date(promoCodeData.startsAt) > now) {
      return void 0;
    }
    if (promoCodeData.expiresAt && new Date(promoCodeData.expiresAt) < now) {
      return void 0;
    }
    if (promoCodeData.usageLimit !== null && promoCodeData.usageCount >= promoCodeData.usageLimit) {
      return void 0;
    }
    if (promoCodeData.minimumOrderAmount !== null && subtotal < Number(promoCodeData.minimumOrderAmount)) {
      return void 0;
    }
    return {
      id: promoCodeData.id,
      code: promoCodeData.code,
      discountType: promoCodeData.discountType,
      discountValue: Number(promoCodeData.discountValue),
      minimumOrderAmount: promoCodeData.minimumOrderAmount ? Number(promoCodeData.minimumOrderAmount) : void 0,
      maximumDiscountAmount: promoCodeData.maximumDiscountAmount ? Number(promoCodeData.maximumDiscountAmount) : void 0,
      appliesToProducts: promoCodeData.appliesToProducts || null,
      appliesToCategories: promoCodeData.appliesToCategories || null
    };
  }
  /**
   * Check if an item is eligible for a promo code based on product/category restrictions
   */
  isItemEligibleForPromo(productId, categoryId, promoCode) {
    const hasProductRestrictions = promoCode.appliesToProducts && promoCode.appliesToProducts.length > 0;
    const hasCategoryRestrictions = promoCode.appliesToCategories && promoCode.appliesToCategories.length > 0;
    if (!hasProductRestrictions && !hasCategoryRestrictions) {
      return true;
    }
    if (hasProductRestrictions && promoCode.appliesToProducts.includes(productId)) {
      return true;
    }
    if (hasCategoryRestrictions && categoryId && promoCode.appliesToCategories.includes(categoryId)) {
      return true;
    }
    return false;
  }
  /**
   * Calculate discount amount from promo code
   * Only applies to eligible items based on product/category restrictions
   */
  calculateDiscount(promoCode, items) {
    const eligibleItems = items.filter(
      (item) => this.isItemEligibleForPromo(item.productId, item.categoryId, promoCode)
    );
    if (eligibleItems.length === 0) {
      return { discountAmount: 0, eligibleItemIds: [] };
    }
    const eligibleSubtotal = round(
      eligibleItems.reduce((sum2, item) => sum2 + item.lineTotal, 0),
      2
    );
    let discount = 0;
    if (promoCode.discountType === "percentage") {
      discount = eligibleSubtotal * (promoCode.discountValue / 100);
    } else {
      discount = Math.min(promoCode.discountValue, eligibleSubtotal);
    }
    if (promoCode.maximumDiscountAmount) {
      discount = Math.min(discount, promoCode.maximumDiscountAmount);
    }
    discount = Math.min(discount, eligibleSubtotal);
    return {
      discountAmount: round(discount, 2),
      eligibleItemIds: eligibleItems.map((item) => item.productId)
    };
  }
  /**
   * Get current tax rate from settings
   *
   * Tax settings are stored in the database with key 'tax':
   * {
   *   tax_enabled: boolean,
   *   tax_rate: number,     // Percentage (0-100)
   *   tax_label: string     // Display label (e.g., "VAT", "Sales Tax")
   * }
   *
   * Configure tax via:
   * - Admin Dashboard → Settings → Tax
   * - API: PUT /api/settings with tax object
   *
   * Fallback behavior: If no tax setting exists in database, returns 0 (no tax applied).
   * This is a safe default that prevents unexpected charges. Admins must explicitly
   * enable and configure tax rates.
   */
  async getTaxRate() {
    const [taxSetting] = await this.db.select().from(settings).where(eq(settings.key, "tax"));
    if (taxSetting && taxSetting.value && typeof taxSetting.value === "object") {
      const taxValue = taxSetting.value;
      if (taxValue.tax_enabled && typeof taxValue.tax_rate === "number") {
        return taxValue.tax_rate / 100;
      }
      if (taxValue.tax_enabled === false) {
        return 0;
      }
    }
    logger.warn("Tax setting not found in database, applying 0% tax rate");
    return 0;
  }
  /**
   * Return empty cart calculation
   */
  emptyCartCalculation() {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      taxRate: 0,
      // Tax rate will be applied when items are added
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 0,
      currency: "USD"
    };
  }
  /**
   * Get product image with fallback priority:
   * 1. thumbnailUrl
   * 2. First image from images array
   * 3. undefined (no image)
   */
  getProductImage(product) {
    if (product.thumbnailUrl) {
      return product.thumbnailUrl;
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage && typeof firstImage === "object" && "url" in firstImage) {
        return firstImage.url;
      }
    }
    return void 0;
  }
};
var pricingService = new PricingService();

// src/services/pdf.service.ts
var import_pdfkit = __toESM(require("pdfkit"));
var PDFService = class {
  // Default colors (can be overridden by template)
  primaryColor = "#1a1a2e";
  accentColor = "#0066cc";
  textColor = "#333333";
  lightGray = "#f5f5f5";
  // Template config (set per generation)
  template = {};
  /**
   * Parse HTML content to plain text for PDF rendering
   * Converts HTML tags to readable plain text format
   */
  parseHtmlToText(html) {
    if (!html) {
      return "";
    }
    let text2 = html;
    text2 = text2.replace(/<br\s*\/?>/gi, "\n");
    text2 = text2.replace(/<\/p>/gi, "\n\n");
    text2 = text2.replace(/<p[^>]*>/gi, "");
    text2 = text2.replace(/<\/?strong>/gi, "");
    text2 = text2.replace(/<\/?b>/gi, "");
    text2 = text2.replace(/<\/?em>/gi, "");
    text2 = text2.replace(/<\/?i>/gi, "");
    text2 = text2.replace(/<\/?u>/gi, "");
    text2 = text2.replace(/<li[^>]*>/gi, "\u2022 ");
    text2 = text2.replace(/<\/li>/gi, "\n");
    text2 = text2.replace(/<\/?[ou]l[^>]*>/gi, "\n");
    text2 = text2.replace(/<h[1-6][^>]*>/gi, "\n");
    text2 = text2.replace(/<\/h[1-6]>/gi, "\n");
    text2 = text2.replace(/<\/?div[^>]*>/gi, "\n");
    text2 = text2.replace(/<\/?span[^>]*>/gi, "");
    text2 = text2.replace(/<[^>]+>/g, "");
    text2 = text2.replace(/&nbsp;/gi, " ");
    text2 = text2.replace(/&amp;/gi, "&");
    text2 = text2.replace(/&lt;/gi, "<");
    text2 = text2.replace(/&gt;/gi, ">");
    text2 = text2.replace(/&quot;/gi, '"');
    text2 = text2.replace(/&#39;/gi, "'");
    text2 = text2.replace(/&apos;/gi, "'");
    text2 = text2.replace(/\n{3,}/g, "\n\n");
    text2 = text2.split("\n").map((line2) => line2.trim()).join("\n").trim();
    return text2;
  }
  /**
   * Apply template configuration
   */
  applyTemplate(template) {
    this.template = template || {};
    if (template?.primaryColor) {
      this.primaryColor = template.primaryColor;
    } else {
      this.primaryColor = "#1a1a2e";
    }
    if (template?.accentColor) {
      this.accentColor = template.accentColor;
    } else {
      this.accentColor = "#0066cc";
    }
  }
  /**
   * Generate a quotation PDF
   */
  async generateQuotationPDF(data, template) {
    return new Promise((resolve, reject) => {
      try {
        this.applyTemplate(template);
        const doc = new import_pdfkit.default({
          size: "A4",
          margin: 50,
          bufferPages: true
        });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        if (this.template.headerText) {
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(this.template.headerText, 50, 30, { align: "center", width: 495 });
          doc.y = 50;
        }
        this.addHeader(doc, data, "QUOTATION");
        this.addCustomerInfo(doc, data);
        this.addItemsTable(doc, data.items);
        this.addTotals(doc, data);
        if (this.template.thankYouMessage) {
          doc.moveDown();
          doc.fontSize(11).fillColor(this.accentColor);
          doc.text(this.template.thankYouMessage, 50, doc.y, { align: "center", width: 495 });
        }
        this.addNotesAndTerms(doc, data);
        this.addFooter(doc, data);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * Generate an invoice PDF
   */
  async generateInvoicePDF(data, template) {
    return new Promise((resolve, reject) => {
      try {
        this.applyTemplate(template);
        const doc = new import_pdfkit.default({
          size: "A4",
          margin: 50,
          bufferPages: true
        });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        if (this.template.headerText) {
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(this.template.headerText, 50, 30, { align: "center", width: 495 });
          doc.y = 50;
        }
        this.addHeader(doc, data, "INVOICE");
        doc.fontSize(10).fillColor(this.textColor);
        doc.text(`Invoice #: ${data.invoiceNumber}`, 50, doc.y);
        doc.text(`Order #: ${data.orderNumber}`);
        doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`);
        if (data.paidAt) {
          doc.text(`Paid On: ${data.paidAt.toLocaleDateString()}`);
        }
        doc.moveDown();
        this.addCustomerInfo(doc, data);
        this.addItemsTable(doc, data.items);
        this.addTotals(doc, data);
        if (data.paymentMethod) {
          doc.moveDown();
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`);
        }
        if (this.template.thankYouMessage) {
          doc.moveDown();
          doc.fontSize(11).fillColor(this.accentColor);
          doc.text(this.template.thankYouMessage, 50, doc.y, { align: "center", width: 495 });
        }
        this.addFooter(doc, data);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  addHeader(doc, data, title) {
    doc.fontSize(24).fillColor(this.primaryColor);
    doc.text(data.companyName, 50, 50);
    doc.fontSize(20).fillColor(this.accentColor);
    doc.text(title, 400, 50, { align: "right" });
    doc.fontSize(10).fillColor(this.textColor);
    doc.text(`#: ${data.quotationNumber}`, 400, 80, { align: "right" });
    doc.text(`Date: ${data.createdAt.toLocaleDateString()}`, { align: "right" });
    if (data.validUntil) {
      doc.text(`Valid Until: ${data.validUntil.toLocaleDateString()}`, { align: "right" });
    }
    doc.fontSize(9).fillColor("#666666");
    if (data.companyAddress) {
      doc.text(data.companyAddress, 50, 80);
    }
    if (data.companyPhone) {
      doc.text(`Phone: ${data.companyPhone}`);
    }
    if (data.companyEmail) {
      doc.text(`Email: ${data.companyEmail}`);
    }
    if (data.companyWebsite) {
      doc.text(`Web: ${data.companyWebsite}`);
    }
    doc.moveTo(50, 150).lineTo(545, 150).stroke(this.lightGray);
    doc.y = 160;
  }
  addCustomerInfo(doc, data) {
    doc.fontSize(12).fillColor(this.primaryColor);
    doc.text("Bill To:", 50, doc.y);
    doc.fontSize(10).fillColor(this.textColor);
    doc.text(data.customerName);
    if (data.customerCompany) {
      doc.text(data.customerCompany);
    }
    doc.text(data.customerEmail);
    if (data.customerPhone) {
      doc.text(data.customerPhone);
    }
    doc.moveDown(2);
  }
  addItemsTable(doc, items) {
    const tableTop = doc.y;
    const tableLeft = 50;
    const showSku = this.template.showSku !== false;
    const showDescription = this.template.showLineItemDescription === true;
    doc.rect(tableLeft, tableTop, 495, 25).fill(this.primaryColor);
    doc.fontSize(10).fillColor("#ffffff");
    if (showSku) {
      doc.text("Product", tableLeft + 10, tableTop + 8);
      doc.text("SKU", tableLeft + 210, tableTop + 8);
      doc.text("Qty", tableLeft + 290, tableTop + 8);
      doc.text("Price", tableLeft + 350, tableTop + 8);
      doc.text("Total", tableLeft + 420, tableTop + 8);
    } else {
      doc.text("Product", tableLeft + 10, tableTop + 8);
      doc.text("Qty", tableLeft + 290, tableTop + 8);
      doc.text("Price", tableLeft + 350, tableTop + 8);
      doc.text("Total", tableLeft + 420, tableTop + 8);
    }
    let y = tableTop + 30;
    doc.fillColor(this.textColor);
    items.forEach((item, index2) => {
      const rowHeight = showDescription && item.description ? 40 : 25;
      if (index2 % 2 === 0) {
        doc.rect(tableLeft, y - 5, 495, rowHeight).fill(this.lightGray);
        doc.fillColor(this.textColor);
      }
      doc.fontSize(9);
      let productName = item.productName;
      if (item.variantOptions) {
        const options = Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(", ");
        productName += ` (${options})`;
      }
      const maxNameLength = showSku ? 40 : 60;
      if (productName.length > maxNameLength) {
        productName = productName.substring(0, maxNameLength - 3) + "...";
      }
      if (item.productUrl) {
        doc.fillColor(this.accentColor);
        doc.text(productName, tableLeft + 10, y, {
          width: showSku ? 190 : 270,
          link: item.productUrl,
          underline: true
        });
        doc.fillColor(this.textColor);
      } else {
        doc.text(productName, tableLeft + 10, y, { width: showSku ? 190 : 270 });
      }
      if (showSku) {
        doc.text(item.sku || "-", tableLeft + 210, y, { width: 70 });
      }
      doc.text(item.quantity.toString(), tableLeft + 290, y, { width: 50 });
      doc.text(`$${item.unitPrice.toFixed(2)}`, tableLeft + 350, y, { width: 60 });
      doc.text(`$${item.lineTotal.toFixed(2)}`, tableLeft + 420, y, { width: 70 });
      if (showDescription && item.description) {
        doc.fontSize(8).fillColor("#666666");
        const desc2 = item.description.length > 80 ? item.description.substring(0, 77) + "..." : item.description;
        doc.text(desc2, tableLeft + 10, y + 12, { width: 270 });
        doc.fillColor(this.textColor);
      }
      y += rowHeight;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    doc.rect(tableLeft, tableTop, 495, y - tableTop).stroke("#cccccc");
    doc.y = y + 10;
  }
  addTotals(doc, data) {
    const totalsX = 350;
    let y = doc.y + 10;
    doc.fontSize(10).fillColor(this.textColor);
    doc.text("Subtotal:", totalsX, y);
    doc.text(`$${data.subtotal.toFixed(2)}`, totalsX + 100, y, { align: "right", width: 95 });
    y += 20;
    if (data.discountAmount > 0) {
      doc.text("Discount:", totalsX, y);
      doc.fillColor("#cc0000");
      doc.text(`-$${data.discountAmount.toFixed(2)}`, totalsX + 100, y, { align: "right", width: 95 });
      doc.fillColor(this.textColor);
      y += 20;
    }
    doc.text(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, totalsX, y);
    doc.text(`$${data.taxAmount.toFixed(2)}`, totalsX + 100, y, { align: "right", width: 95 });
    y += 20;
    if (data.shippingAmount > 0) {
      doc.text("Shipping:", totalsX, y);
      doc.text(`$${data.shippingAmount.toFixed(2)}`, totalsX + 100, y, { align: "right", width: 95 });
      y += 20;
    }
    doc.moveTo(totalsX, y).lineTo(545, y).stroke("#cccccc");
    y += 10;
    doc.fontSize(14).fillColor(this.primaryColor);
    doc.text("Total:", totalsX, y);
    doc.text(`${data.currency} $${data.total.toFixed(2)}`, totalsX + 100, y, { align: "right", width: 95 });
    doc.y = y + 30;
  }
  addNotesAndTerms(doc, data) {
    if (data.notes || data.terms) {
      doc.moveDown();
      if (data.notes) {
        doc.fontSize(11).fillColor(this.primaryColor);
        doc.text("Notes:", 50, doc.y);
        doc.fontSize(9).fillColor(this.textColor);
        doc.text(data.notes, { width: 495 });
        doc.moveDown();
      }
      if (data.terms) {
        doc.fontSize(11).fillColor(this.primaryColor);
        doc.text("Terms & Conditions:", 50, doc.y);
        doc.fontSize(9).fillColor(this.textColor);
        const parsedTerms = this.parseHtmlToText(data.terms);
        doc.text(parsedTerms, { width: 495 });
      }
    }
  }
  addFooter(doc, data) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.moveTo(50, 780).lineTo(545, 780).stroke(this.lightGray);
      const footerText = this.template.footerText || `Generated by ${data.companyName} | Page ${i + 1} of ${pageCount}`;
      doc.fontSize(8).fillColor("#666666");
      doc.text(
        footerText,
        50,
        785,
        { align: "center", width: 495 }
      );
    }
  }
  /**
   * Generate PDF stream for direct response
   */
  generatePDFStream(data, type = "quotation") {
    const doc = new import_pdfkit.default({
      size: "A4",
      margin: 50,
      bufferPages: true
    });
    if (type === "quotation") {
      this.addHeader(doc, data, "QUOTATION");
    } else {
      this.addHeader(doc, data, "INVOICE");
    }
    this.addCustomerInfo(doc, data);
    this.addItemsTable(doc, data.items);
    this.addTotals(doc, data);
    this.addNotesAndTerms(doc, data);
    this.addFooter(doc, data);
    doc.end();
    return doc;
  }
};
var pdfService = new PDFService();

// src/services/export.service.ts
var ExportService = class {
  /**
   * Export data to CSV format
   */
  toCSV(data, columns) {
    if (data.length === 0) {
      return columns.map((c) => c.header).join(",");
    }
    const headers = columns.map((c) => this.escapeCSV(c.header));
    const rows = data.map((row) => {
      return columns.map((col) => {
        const value = this.getNestedValue(row, col.key);
        const formatted = col.formatter ? col.formatter(value, row) : value;
        return this.escapeCSV(String(formatted ?? ""));
      });
    });
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
  /**
   * Export data to JSON format
   */
  toJSON(data, pretty = true) {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }
  /**
   * Export data to JSONL format (JSON Lines - one object per line)
   */
  toJSONL(data) {
    return data.map((row) => JSON.stringify(row)).join("\n");
  }
  /**
   * Get export content type and file extension
   */
  getContentType(format) {
    switch (format) {
      case "csv":
        return { contentType: "text/csv", extension: "csv" };
      case "json":
        return { contentType: "application/json", extension: "json" };
      case "jsonl":
        return { contentType: "application/x-ndjson", extension: "jsonl" };
      case "xlsx":
        return { contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
      default:
        return { contentType: "application/octet-stream", extension: "bin" };
    }
  }
  /**
   * Get export filename
   */
  getFilename(prefix, format) {
    const date2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return `${prefix}-export-${date2}.${format}`;
  }
  // ===========================================
  // Predefined Export Configurations
  // ===========================================
  /**
   * Product export columns - ALL fields
   */
  getProductColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "sku", header: "SKU" },
      { key: "barcode", header: "Barcode" },
      { key: "name", header: "Name" },
      { key: "slug", header: "Slug" },
      { key: "description", header: "Description" },
      { key: "shortDescription", header: "Short Description" },
      { key: "categoryId", header: "Category ID" },
      { key: "categoryName", header: "Category" },
      { key: "brand", header: "Brand" },
      { key: "basePrice", header: "Base Price", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "costPrice", header: "Cost Price", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "compareAtPrice", header: "Compare At Price", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "weight", header: "Weight (g)", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "dimensions", header: "Dimensions", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "stockQuantity", header: "Stock Quantity" },
      { key: "lowStockThreshold", header: "Low Stock Threshold" },
      { key: "trackInventory", header: "Track Inventory", formatter: (v) => v ? "Yes" : "No" },
      { key: "allowBackorder", header: "Allow Backorder", formatter: (v) => v ? "Yes" : "No" },
      { key: "images", header: "Images", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "videos", header: "Videos", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "thumbnailUrl", header: "Thumbnail URL" },
      { key: "tags", header: "Tags", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "specifications", header: "Specifications", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "features", header: "Features", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "metaTitle", header: "Meta Title" },
      { key: "metaDescription", header: "Meta Description" },
      { key: "status", header: "Status" },
      { key: "isFeatured", header: "Featured", formatter: (v) => v ? "Yes" : "No" },
      { key: "isDigital", header: "Digital Product", formatter: (v) => v ? "Yes" : "No" },
      { key: "requiresShipping", header: "Requires Shipping", formatter: (v) => v ? "Yes" : "No" },
      { key: "supplierId", header: "Supplier ID" },
      { key: "supplierSku", header: "Supplier SKU" },
      { key: "importedFrom", header: "Imported From" },
      { key: "externalUrl", header: "External URL" },
      { key: "createdAt", header: "Created At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "updatedAt", header: "Updated At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Order export columns - ALL fields
   */
  getOrderColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "orderNumber", header: "Order Number" },
      { key: "customerId", header: "Customer ID" },
      { key: "customerEmail", header: "Customer Email" },
      { key: "customerName", header: "Customer Name" },
      { key: "status", header: "Status" },
      { key: "paymentStatus", header: "Payment Status" },
      { key: "paymentMethod", header: "Payment Method" },
      { key: "shippingAddress", header: "Shipping Address", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "billingAddress", header: "Billing Address", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "currency", header: "Currency" },
      { key: "subtotalSnapshot", header: "Subtotal", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "taxRateSnapshot", header: "Tax Rate", formatter: (v) => v ? (Number(v) * 100).toFixed(2) + "%" : "" },
      { key: "taxAmountSnapshot", header: "Tax Amount", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "shippingAmountSnapshot", header: "Shipping", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "discountAmountSnapshot", header: "Discount", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "totalSnapshot", header: "Total", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "promoCodeId", header: "Promo Code ID" },
      { key: "promoCodeSnapshot", header: "Promo Code Used" },
      { key: "shippingMethod", header: "Shipping Method" },
      { key: "trackingNumber", header: "Tracking Number" },
      { key: "confirmedAt", header: "Confirmed At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "processingAt", header: "Processing At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "shippedAt", header: "Shipped At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "deliveredAt", header: "Delivered At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "customerNotes", header: "Customer Notes" },
      { key: "adminNotes", header: "Admin Notes" },
      { key: "createdAt", header: "Order Date", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "updatedAt", header: "Updated At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Customer export columns - ALL fields
   */
  getCustomerColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "authUserId", header: "Auth User ID" },
      { key: "email", header: "Email" },
      { key: "firstName", header: "First Name" },
      { key: "lastName", header: "Last Name" },
      { key: "phone", header: "Phone" },
      { key: "defaultShippingAddress", header: "Default Shipping Address", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "defaultBillingAddress", header: "Default Billing Address", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "isGuest", header: "Guest", formatter: (v) => v ? "Yes" : "No" },
      { key: "isActive", header: "Active", formatter: (v) => v ? "Yes" : "No" },
      { key: "acceptsMarketing", header: "Accepts Marketing", formatter: (v) => v ? "Yes" : "No" },
      { key: "notes", header: "Notes" },
      { key: "tags", header: "Tags", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "orderCount", header: "Order Count" },
      { key: "createdAt", header: "Registered At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "updatedAt", header: "Updated At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Promo code export columns - ALL fields
   */
  getPromoCodeColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "code", header: "Code" },
      { key: "description", header: "Description" },
      { key: "discountType", header: "Discount Type" },
      { key: "discountValue", header: "Discount Value", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "minimumOrderAmount", header: "Min Order Amount", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "maximumDiscountAmount", header: "Max Discount Amount", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "usageLimit", header: "Usage Limit" },
      { key: "usageCount", header: "Times Used" },
      { key: "usageLimitPerCustomer", header: "Usage Limit Per Customer" },
      { key: "isActive", header: "Active", formatter: (v) => v ? "Yes" : "No" },
      { key: "startsAt", header: "Start Date", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "expiresAt", header: "Expiry Date", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "appliesToProducts", header: "Applies To Products", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "appliesToCategories", header: "Applies To Categories", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "customerIds", header: "Restricted Customer IDs", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
      { key: "createdAt", header: "Created At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "updatedAt", header: "Updated At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Quotation export columns - ALL fields
   */
  getQuotationColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "quotationNumber", header: "Quotation Number" },
      { key: "customerId", header: "Customer ID" },
      { key: "customerName", header: "Customer Name" },
      { key: "customerEmail", header: "Customer Email" },
      { key: "customerPhone", header: "Customer Phone" },
      { key: "customerCompany", header: "Customer Company" },
      { key: "customerAddress", header: "Customer Address", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "status", header: "Status" },
      { key: "validUntil", header: "Valid Until", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "validDays", header: "Valid Days" },
      { key: "currency", header: "Currency" },
      { key: "subtotal", header: "Subtotal", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "taxRate", header: "Tax Rate", formatter: (v) => v ? (Number(v) * 100).toFixed(2) + "%" : "" },
      { key: "taxAmount", header: "Tax Amount", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "discountType", header: "Discount Type" },
      { key: "discountValue", header: "Discount Value", formatter: (v) => v ? Number(v).toFixed(2) : "" },
      { key: "discountAmount", header: "Discount Amount", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "total", header: "Total", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "notes", header: "Notes" },
      { key: "termsAndConditions", header: "Terms & Conditions" },
      { key: "pdfUrl", header: "PDF URL" },
      { key: "pdfTemplateId", header: "PDF Template ID" },
      { key: "convertedToOrderId", header: "Converted To Order ID" },
      { key: "acceptanceToken", header: "Acceptance Token" },
      { key: "tokenExpiresAt", header: "Token Expires At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "viewedAt", header: "Viewed At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "createdAt", header: "Created At", formatter: (v) => v ? new Date(v).toISOString() : "" },
      { key: "updatedAt", header: "Updated At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Order Items export columns
   */
  getOrderItemColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "orderId", header: "Order ID" },
      { key: "orderNumber", header: "Order Number" },
      { key: "productId", header: "Product ID" },
      { key: "variantId", header: "Variant ID" },
      { key: "productNameSnapshot", header: "Product Name" },
      { key: "skuSnapshot", header: "SKU" },
      { key: "variantOptionsSnapshot", header: "Variant Options", formatter: (v) => v ? JSON.stringify(v) : "" },
      { key: "quantity", header: "Quantity" },
      { key: "unitPriceSnapshot", header: "Unit Price", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "lineTotal", header: "Line Total", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "createdAt", header: "Created At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  /**
   * Quotation Items export columns
   */
  getQuotationItemColumns() {
    return [
      { key: "id", header: "ID" },
      { key: "quotationId", header: "Quotation ID" },
      { key: "quotationNumber", header: "Quotation Number" },
      { key: "productId", header: "Product ID" },
      { key: "variantId", header: "Variant ID" },
      { key: "name", header: "Item Name" },
      { key: "description", header: "Description" },
      { key: "sku", header: "SKU" },
      { key: "quantity", header: "Quantity" },
      { key: "unitPrice", header: "Unit Price", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "lineTotal", header: "Line Total", formatter: (v) => v ? Number(v).toFixed(2) : "0.00" },
      { key: "createdAt", header: "Created At", formatter: (v) => v ? new Date(v).toISOString() : "" }
    ];
  }
  // ===========================================
  // Helper Methods
  // ===========================================
  escapeCSV(value) {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  getNestedValue(obj, path2) {
    return path2.split(".").reduce((o, p) => o?.[p], obj);
  }
};
var exportService = new ExportService();

// src/services/import.service.ts
var import_zod3 = require("zod");
var ImportService = class {
  /**
   * Parse CSV string into array of objects
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      return [];
    }
    const headerLine = lines[0];
    if (!headerLine) {
      return [];
    }
    const headers = this.parseCSVLine(headerLine);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line2 = lines[i];
      if (!line2) {
        continue;
      }
      const values = this.parseCSVLine(line2);
      const row = {};
      headers.forEach((header, index2) => {
        row[header.trim()] = values[index2]?.trim() || "";
      });
      data.push(row);
    }
    return data;
  }
  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line2) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line2.length; i++) {
      const char2 = line2[i];
      if (char2 === '"') {
        if (inQuotes && line2[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char2 === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char2;
      }
    }
    result.push(current);
    return result;
  }
  /**
   * Map CSV data to objects with validation
   */
  mapAndValidate(data, mappings, schema) {
    const result = {
      success: true,
      totalRows: data.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: []
    };
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) {
        continue;
      }
      const rowNumber = i + 2;
      try {
        const mapped = {};
        for (const mapping of mappings) {
          const value = row[mapping.csvColumn];
          if (mapping.required && (!value || value.trim() === "")) {
            throw new Error(`Missing required field: ${mapping.csvColumn}`);
          }
          if (value && value.trim() !== "") {
            mapped[mapping.field] = mapping.transform ? mapping.transform(value) : value;
          }
        }
        const validated = schema.parse(mapped);
        result.data.push(validated);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.success = false;
        if (error instanceof import_zod3.z.ZodError) {
          error.errors.forEach((e) => {
            result.errors.push({
              row: rowNumber,
              field: e.path.join("."),
              message: e.message
            });
          });
        } else if (error instanceof Error) {
          result.errors.push({
            row: rowNumber,
            message: error.message
          });
        }
      }
    }
    return result;
  }
  // ===========================================
  // Predefined Import Configurations
  // ===========================================
  /**
   * Product import mapping - ALL fields
   */
  getProductMappings() {
    return [
      // Required fields
      { csvColumn: "name", field: "name", required: true },
      { csvColumn: "sku", field: "sku", required: true },
      {
        csvColumn: "price",
        field: "basePrice",
        required: true,
        transform: (v) => parseFloat(v.replace(/[^0-9.]/g, ""))
      },
      // Basic info
      { csvColumn: "barcode", field: "barcode" },
      { csvColumn: "description", field: "description" },
      { csvColumn: "short_description", field: "shortDescription" },
      { csvColumn: "category", field: "categoryName" },
      { csvColumn: "brand", field: "brand" },
      // Pricing
      {
        csvColumn: "cost_price",
        field: "costPrice",
        transform: (v) => v ? parseFloat(v.replace(/[^0-9.]/g, "")) : void 0
      },
      {
        csvColumn: "compare_at_price",
        field: "compareAtPrice",
        transform: (v) => v ? parseFloat(v.replace(/[^0-9.]/g, "")) : void 0
      },
      // Inventory
      {
        csvColumn: "quantity",
        field: "stockQuantity",
        transform: (v) => parseInt(v) || 0
      },
      {
        csvColumn: "low_stock_threshold",
        field: "lowStockThreshold",
        transform: (v) => parseInt(v) || 5
      },
      {
        csvColumn: "track_inventory",
        field: "trackInventory",
        transform: (v) => !["no", "false", "0"].includes(v.toLowerCase().trim())
      },
      {
        csvColumn: "allow_backorder",
        field: "allowBackorder",
        transform: (v) => ["yes", "true", "1"].includes(v.toLowerCase().trim())
      },
      // Shipping
      {
        csvColumn: "weight",
        field: "weight",
        transform: (v) => v ? parseFloat(v) : void 0
      },
      {
        csvColumn: "dimensions",
        field: "dimensions",
        transform: (v) => {
          if (!v) {
            return void 0;
          }
          try {
            if (v.startsWith("{")) {
              return JSON.parse(v);
            }
            const parts = v.split("x").map((p) => parseFloat(p.trim()));
            if (parts.length === 3) {
              return { width: parts[0], height: parts[1], depth: parts[2] };
            }
            return void 0;
          } catch {
            return void 0;
          }
        }
      },
      {
        csvColumn: "is_digital",
        field: "isDigital",
        transform: (v) => ["yes", "true", "1"].includes(v.toLowerCase().trim())
      },
      {
        csvColumn: "requires_shipping",
        field: "requiresShipping",
        transform: (v) => !["no", "false", "0"].includes(v.toLowerCase().trim())
      },
      // Media
      { csvColumn: "image_url", field: "thumbnailUrl" },
      {
        csvColumn: "images",
        field: "images",
        transform: (v) => {
          if (!v) {
            return [];
          }
          try {
            if (v.startsWith("[")) {
              return JSON.parse(v);
            }
            return v.split(",").map((url) => ({ url: url.trim() })).filter((img) => img.url);
          } catch {
            return [];
          }
        }
      },
      // Status
      {
        csvColumn: "status",
        field: "status",
        transform: (v) => {
          const normalized = v.toLowerCase().trim();
          if (["active", "draft", "archived"].includes(normalized)) {
            return normalized;
          }
          return "draft";
        }
      },
      {
        csvColumn: "featured",
        field: "isFeatured",
        transform: (v) => ["yes", "true", "1"].includes(v.toLowerCase().trim())
      },
      // SEO
      { csvColumn: "meta_title", field: "metaTitle" },
      { csvColumn: "meta_description", field: "metaDescription" },
      // Tags and features
      {
        csvColumn: "tags",
        field: "tags",
        transform: (v) => v.split(",").map((t) => t.trim()).filter(Boolean)
      },
      {
        csvColumn: "features",
        field: "features",
        transform: (v) => v.split(",").map((t) => t.trim()).filter(Boolean)
      },
      {
        csvColumn: "specifications",
        field: "specifications",
        transform: (v) => {
          if (!v) {
            return {};
          }
          try {
            if (v.startsWith("{")) {
              return JSON.parse(v);
            }
            const specs = {};
            v.split(",").forEach((pair) => {
              const [key, value] = pair.split(":").map((s) => s.trim());
              if (key && value) {
                specs[key] = value;
              }
            });
            return specs;
          } catch {
            return {};
          }
        }
      },
      // Supplier
      { csvColumn: "supplier_id", field: "supplierId" },
      { csvColumn: "supplier_sku", field: "supplierSku" }
    ];
  }
  /**
   * Product import schema - ALL fields
   */
  getProductSchema() {
    return import_zod3.z.object({
      // Required
      name: import_zod3.z.string().min(1).max(255),
      sku: import_zod3.z.string().min(1).max(100),
      basePrice: import_zod3.z.number().positive(),
      // Basic
      barcode: import_zod3.z.string().max(100).optional(),
      description: import_zod3.z.string().optional(),
      shortDescription: import_zod3.z.string().max(500).optional(),
      categoryName: import_zod3.z.string().optional(),
      brand: import_zod3.z.string().max(255).optional(),
      // Pricing
      costPrice: import_zod3.z.number().positive().optional(),
      compareAtPrice: import_zod3.z.number().positive().optional(),
      // Inventory
      stockQuantity: import_zod3.z.number().int().min(0).optional().default(0),
      lowStockThreshold: import_zod3.z.number().int().min(0).optional().default(5),
      trackInventory: import_zod3.z.boolean().optional().default(true),
      allowBackorder: import_zod3.z.boolean().optional().default(false),
      // Shipping
      weight: import_zod3.z.number().optional(),
      dimensions: import_zod3.z.object({
        width: import_zod3.z.number().optional(),
        height: import_zod3.z.number().optional(),
        depth: import_zod3.z.number().optional()
      }).optional(),
      isDigital: import_zod3.z.boolean().optional().default(false),
      requiresShipping: import_zod3.z.boolean().optional().default(true),
      // Media
      thumbnailUrl: import_zod3.z.string().url().optional(),
      images: import_zod3.z.array(import_zod3.z.object({
        url: import_zod3.z.string().url(),
        alt: import_zod3.z.string().optional()
      })).optional(),
      // Status
      status: import_zod3.z.enum(["active", "draft", "archived"]).optional().default("draft"),
      isFeatured: import_zod3.z.boolean().optional().default(false),
      // SEO
      metaTitle: import_zod3.z.string().max(255).optional(),
      metaDescription: import_zod3.z.string().max(500).optional(),
      // Tags and features
      tags: import_zod3.z.array(import_zod3.z.string()).optional(),
      features: import_zod3.z.array(import_zod3.z.string()).optional(),
      specifications: import_zod3.z.record(import_zod3.z.string()).optional(),
      // Supplier
      supplierId: import_zod3.z.string().optional(),
      supplierSku: import_zod3.z.string().optional()
    });
  }
  /**
   * Customer import mapping - ALL fields including addresses
   */
  getCustomerMappings() {
    return [
      // Required
      { csvColumn: "email", field: "email", required: true },
      // Basic info
      { csvColumn: "first_name", field: "firstName" },
      { csvColumn: "last_name", field: "lastName" },
      { csvColumn: "phone", field: "phone" },
      // Status
      {
        csvColumn: "is_active",
        field: "isActive",
        transform: (v) => !["no", "false", "0"].includes(v.toLowerCase().trim())
      },
      {
        csvColumn: "accepts_marketing",
        field: "acceptsMarketing",
        transform: (v) => ["yes", "true", "1"].includes(v.toLowerCase().trim())
      },
      // Notes and tags
      { csvColumn: "notes", field: "notes" },
      {
        csvColumn: "tags",
        field: "tags",
        transform: (v) => v.split(",").map((t) => t.trim()).filter(Boolean)
      },
      // Shipping address fields
      { csvColumn: "shipping_first_name", field: "shippingFirstName" },
      { csvColumn: "shipping_last_name", field: "shippingLastName" },
      { csvColumn: "shipping_company", field: "shippingCompany" },
      { csvColumn: "shipping_address_line1", field: "shippingAddressLine1" },
      { csvColumn: "shipping_address_line2", field: "shippingAddressLine2" },
      { csvColumn: "shipping_city", field: "shippingCity" },
      { csvColumn: "shipping_state", field: "shippingState" },
      { csvColumn: "shipping_postal_code", field: "shippingPostalCode" },
      { csvColumn: "shipping_country", field: "shippingCountry" },
      { csvColumn: "shipping_phone", field: "shippingPhone" },
      // Billing address fields
      { csvColumn: "billing_first_name", field: "billingFirstName" },
      { csvColumn: "billing_last_name", field: "billingLastName" },
      { csvColumn: "billing_company", field: "billingCompany" },
      { csvColumn: "billing_address_line1", field: "billingAddressLine1" },
      { csvColumn: "billing_address_line2", field: "billingAddressLine2" },
      { csvColumn: "billing_city", field: "billingCity" },
      { csvColumn: "billing_state", field: "billingState" },
      { csvColumn: "billing_postal_code", field: "billingPostalCode" },
      { csvColumn: "billing_country", field: "billingCountry" },
      { csvColumn: "billing_phone", field: "billingPhone" }
    ];
  }
  /**
   * Customer import schema - ALL fields
   */
  getCustomerSchema() {
    return import_zod3.z.object({
      // Required
      email: import_zod3.z.string().email(),
      // Basic
      firstName: import_zod3.z.string().max(100).optional(),
      lastName: import_zod3.z.string().max(100).optional(),
      phone: import_zod3.z.string().max(50).optional(),
      // Status
      isActive: import_zod3.z.boolean().optional().default(true),
      acceptsMarketing: import_zod3.z.boolean().optional().default(false),
      // Notes and tags
      notes: import_zod3.z.string().optional(),
      tags: import_zod3.z.array(import_zod3.z.string()).optional(),
      // Shipping address fields (will be combined into JSON)
      shippingFirstName: import_zod3.z.string().optional(),
      shippingLastName: import_zod3.z.string().optional(),
      shippingCompany: import_zod3.z.string().optional(),
      shippingAddressLine1: import_zod3.z.string().optional(),
      shippingAddressLine2: import_zod3.z.string().optional(),
      shippingCity: import_zod3.z.string().optional(),
      shippingState: import_zod3.z.string().optional(),
      shippingPostalCode: import_zod3.z.string().optional(),
      shippingCountry: import_zod3.z.string().optional(),
      shippingPhone: import_zod3.z.string().optional(),
      // Billing address fields (will be combined into JSON)
      billingFirstName: import_zod3.z.string().optional(),
      billingLastName: import_zod3.z.string().optional(),
      billingCompany: import_zod3.z.string().optional(),
      billingAddressLine1: import_zod3.z.string().optional(),
      billingAddressLine2: import_zod3.z.string().optional(),
      billingCity: import_zod3.z.string().optional(),
      billingState: import_zod3.z.string().optional(),
      billingPostalCode: import_zod3.z.string().optional(),
      billingCountry: import_zod3.z.string().optional(),
      billingPhone: import_zod3.z.string().optional()
    });
  }
  /**
   * Generate CSV template for products - ALL fields
   */
  getProductTemplate() {
    const headers = [
      "name",
      "sku",
      "price",
      "barcode",
      "description",
      "short_description",
      "category",
      "brand",
      "cost_price",
      "compare_at_price",
      "quantity",
      "low_stock_threshold",
      "track_inventory",
      "allow_backorder",
      "weight",
      "dimensions",
      "is_digital",
      "requires_shipping",
      "image_url",
      "images",
      "status",
      "featured",
      "meta_title",
      "meta_description",
      "tags",
      "features",
      "specifications",
      "supplier_id",
      "supplier_sku"
    ];
    const exampleRow = [
      "Arduino Uno R3",
      "ARD-UNO-R3",
      "29.99",
      "123456789",
      "The Arduino Uno R3 is a microcontroller board based on the ATmega328P.",
      "Popular microcontroller board for beginners",
      "Microcontrollers",
      "Arduino",
      "15.00",
      "39.99",
      "100",
      "10",
      "Yes",
      "No",
      "25",
      "10x5x2",
      "No",
      "Yes",
      "https://example.com/arduino.jpg",
      "",
      "active",
      "Yes",
      "Arduino Uno R3 - Buy Online",
      "Shop the Arduino Uno R3 microcontroller board",
      "arduino,microcontroller,electronics",
      "Easy to program,USB powered,14 digital pins",
      "Processor:ATmega328P,Voltage:5V,Clock:16MHz",
      "SUP001",
      "ARD-001"
    ];
    return `${headers.join(",")}
"${exampleRow.join('","')}"`;
  }
  /**
   * Generate CSV template for customers - ALL fields
   */
  getCustomerTemplate() {
    const headers = [
      "email",
      "first_name",
      "last_name",
      "phone",
      "is_active",
      "accepts_marketing",
      "notes",
      "tags",
      "shipping_first_name",
      "shipping_last_name",
      "shipping_company",
      "shipping_address_line1",
      "shipping_address_line2",
      "shipping_city",
      "shipping_state",
      "shipping_postal_code",
      "shipping_country",
      "shipping_phone",
      "billing_first_name",
      "billing_last_name",
      "billing_company",
      "billing_address_line1",
      "billing_address_line2",
      "billing_city",
      "billing_state",
      "billing_postal_code",
      "billing_country",
      "billing_phone"
    ];
    const exampleRow = [
      "john@example.com",
      "John",
      "Doe",
      "+1-555-123-4567",
      "Yes",
      "Yes",
      "VIP customer",
      "wholesale,priority",
      "John",
      "Doe",
      "Acme Inc",
      "123 Main Street",
      "Suite 100",
      "New York",
      "NY",
      "10001",
      "USA",
      "+1-555-123-4567",
      "John",
      "Doe",
      "Acme Inc",
      "123 Main Street",
      "Suite 100",
      "New York",
      "NY",
      "10001",
      "USA",
      "+1-555-123-4567"
    ];
    return `${headers.join(",")}
"${exampleRow.join('","')}"`;
  }
  /**
   * Build address JSON from flat fields
   */
  buildAddressFromFlatFields(data, prefix) {
    const addressLine1 = data[`${prefix}AddressLine1`];
    if (!addressLine1) {
      return null;
    }
    return {
      firstName: data[`${prefix}FirstName`] || "",
      lastName: data[`${prefix}LastName`] || "",
      company: data[`${prefix}Company`] || void 0,
      addressLine1,
      addressLine2: data[`${prefix}AddressLine2`] || void 0,
      city: data[`${prefix}City`] || "",
      state: data[`${prefix}State`] || void 0,
      postalCode: data[`${prefix}PostalCode`] || void 0,
      country: data[`${prefix}Country`] || "",
      phone: data[`${prefix}Phone`] || void 0
    };
  }
};
var importService = new ImportService();

// src/services/search.service.ts
var import_meilisearch = require("meilisearch");
var MEILISEARCH_HOST = process.env["MEILISEARCH_HOST"] || "http://localhost:7700";
var MEILISEARCH_API_KEY = process.env["MEILISEARCH_API_KEY"] || "";
var PRODUCTS_INDEX = "products";
var SearchService = class {
  client = null;
  initialized = false;
  /**
   * Get or create Meilisearch client
   */
  getClient() {
    if (!this.client) {
      this.client = new import_meilisearch.MeiliSearch({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_API_KEY
      });
    }
    return this.client;
  }
  /**
   * Check if Meilisearch is available
   */
  async isAvailable() {
    try {
      const client = this.getClient();
      await client.health();
      return true;
    } catch (error) {
      console.warn("Meilisearch is not available:", error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  }
  /**
   * Initialize the search index with proper settings
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    try {
      const client = this.getClient();
      try {
        await client.getIndex(PRODUCTS_INDEX);
      } catch {
        await client.createIndex(PRODUCTS_INDEX, { primaryKey: "id" });
      }
      const index2 = client.index(PRODUCTS_INDEX);
      await index2.updateSearchableAttributes([
        "name",
        "description",
        "shortDescription",
        "sku",
        "brand",
        "categoryName",
        "tags"
      ]);
      await index2.updateFilterableAttributes([
        "categoryId",
        "categorySlug",
        "inStock",
        "isFeatured",
        "basePrice",
        "brand",
        "tags"
      ]);
      await index2.updateSortableAttributes([
        "name",
        "basePrice",
        "createdAt",
        "stockQuantity"
      ]);
      await index2.updateRankingRules([
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness"
      ]);
      await index2.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8
        }
      });
      this.initialized = true;
      console.log("Meilisearch initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Meilisearch:", error);
      throw error;
    }
  }
  /**
   * Get the products index
   */
  getProductsIndex() {
    return this.getClient().index(PRODUCTS_INDEX);
  }
  /**
   * Index a single product
   */
  async indexProduct(product) {
    try {
      const index2 = this.getProductsIndex();
      await index2.addDocuments([product]);
    } catch (error) {
      console.error("Failed to index product:", error);
    }
  }
  /**
   * Index multiple products
   */
  async indexProducts(productDocs) {
    try {
      const index2 = this.getProductsIndex();
      await index2.addDocuments(productDocs);
    } catch (error) {
      console.error("Failed to index products:", error);
    }
  }
  /**
   * Update a product in the index
   */
  async updateProduct(product) {
    try {
      const index2 = this.getProductsIndex();
      await index2.updateDocuments([product]);
    } catch (error) {
      console.error("Failed to update product in index:", error);
    }
  }
  /**
   * Remove a product from the index
   */
  async removeProduct(productId) {
    try {
      const index2 = this.getProductsIndex();
      await index2.deleteDocument(productId);
    } catch (error) {
      console.error("Failed to remove product from index:", error);
    }
  }
  /**
   * Search products
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, offset = 0, filters = [], sort = [], facets = [] } = options;
    const searchParams = {
      limit,
      offset,
      attributesToRetrieve: [
        "id",
        "sku",
        "name",
        "slug",
        "shortDescription",
        "brand",
        "categoryId",
        "categoryName",
        "categorySlug",
        "basePrice",
        "compareAtPrice",
        "stockQuantity",
        "inStock",
        "isFeatured",
        "tags",
        "thumbnailUrl",
        "images"
      ]
    };
    if (filters.length > 0) {
      searchParams.filter = filters;
    }
    if (sort.length > 0) {
      searchParams.sort = sort;
    }
    if (facets.length > 0) {
      searchParams.facets = facets;
    }
    try {
      const index2 = this.getProductsIndex();
      const response = await index2.search(query, searchParams);
      return {
        hits: response.hits,
        query: response.query,
        processingTimeMs: response.processingTimeMs,
        estimatedTotalHits: response.estimatedTotalHits || 0,
        limit,
        offset,
        facetDistribution: response.facetDistribution
      };
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }
  /**
   * Sync all products from database to Meilisearch
   */
  async syncAllProducts() {
    const db2 = getDb();
    let indexed = 0;
    let errors = 0;
    try {
      const productList = await db2.select().from(products).where(eq(products.status, "active"));
      const categoryList = await db2.select().from(categories);
      const categoryMap = new Map(categoryList.map((c) => [c.id, c]));
      const documents = productList.map((product) => {
        const category = product.categoryId ? categoryMap.get(product.categoryId) : null;
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          categoryId: product.categoryId,
          categoryName: category?.name || null,
          categorySlug: category?.slug || null,
          basePrice: Number(product.basePrice),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          stockQuantity: product.stockQuantity,
          inStock: product.stockQuantity > 0 || product.allowBackorder,
          isFeatured: product.isFeatured,
          tags: product.tags || [],
          thumbnailUrl: product.thumbnailUrl,
          images: product.images || [],
          createdAt: new Date(product.createdAt).getTime(),
          updatedAt: new Date(product.updatedAt).getTime()
        };
      });
      if (documents.length > 0) {
        const index2 = this.getProductsIndex();
        await index2.deleteAllDocuments();
        await index2.addDocuments(documents);
        indexed = documents.length;
      }
      console.log(`Synced ${indexed} products to Meilisearch`);
    } catch (error) {
      console.error("Failed to sync products:", error);
      errors++;
    }
    return { indexed, errors };
  }
  /**
   * Get index stats
   */
  async getIndexStats() {
    try {
      const index2 = this.getProductsIndex();
      const stats = await index2.getStats();
      return {
        numberOfDocuments: stats.numberOfDocuments,
        isIndexing: stats.isIndexing
      };
    } catch (error) {
      console.error("Failed to get index stats:", error);
      return { numberOfDocuments: 0, isIndexing: false };
    }
  }
};
var searchService = new SearchService();

// src/utils/crypto.ts
var import_crypto = __toESM(require("crypto"));
function generateSecureToken(length = 32) {
  return import_crypto.default.randomBytes(length).toString("hex");
}
function generateVerificationCode() {
  const code = import_crypto.default.randomInt(0, 1e6);
  return code.toString().padStart(6, "0");
}

// src/services/verification-code.service.ts
var VerificationCodeService = class {
  DEFAULT_EXPIRY_MINUTES = 15;
  MAX_ATTEMPTS = 10;
  /**
   * Generate and store a new verification code
   * Invalidates any existing unused codes for the same email/type
   */
  async createCode(options) {
    const { email, type, ipAddress, expiryMinutes = this.DEFAULT_EXPIRY_MINUTES } = options;
    const db2 = getDb();
    await this.invalidateCodes(email, type);
    const code = generateVerificationCode();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    await db2.insert(verificationCodes).values({
      email: email.toLowerCase(),
      code,
      type,
      expiresAt,
      ipAddress,
      maxAttempts: this.MAX_ATTEMPTS
    });
    logger.info("Verification code created", { email, type, expiresAt });
    return code;
  }
  /**
   * Validate a verification code
   * Tracks attempts and enforces expiration
   */
  async validateCode(options) {
    const { email, code, type } = options;
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const [record] = await db2.select().from(verificationCodes).where(
      and(
        eq(verificationCodes.email, email.toLowerCase()),
        eq(verificationCodes.type, type),
        eq(verificationCodes.isUsed, false),
        gte(verificationCodes.expiresAt, now)
      )
    ).orderBy(desc(verificationCodes.createdAt)).limit(1);
    if (!record) {
      logger.warn("Verification code not found or expired", { email, type });
      throw new BadRequestError("Invalid or expired verification code");
    }
    if (record.attempts >= record.maxAttempts) {
      logger.warn("Max verification attempts exceeded", { email, type, attempts: record.attempts });
      throw new TooManyRequestsError("Maximum verification attempts exceeded. Please request a new code.");
    }
    await db2.update(verificationCodes).set({ attempts: record.attempts + 1 }).where(eq(verificationCodes.id, record.id));
    if (record.code !== code) {
      logger.warn("Invalid verification code attempt", { email, type, attempts: record.attempts + 1 });
      throw new BadRequestError("Invalid verification code");
    }
    await db2.update(verificationCodes).set({
      isUsed: true,
      usedAt: now
    }).where(eq(verificationCodes.id, record.id));
    logger.info("Verification code validated successfully", { email, type });
    return true;
  }
  /**
   * Validate a verification code without marking it as used
   * Use this when you need to perform additional operations before marking as used
   * Tracks attempts and enforces expiration
   */
  async validateCodeWithoutMarking(options) {
    const { email, code, type } = options;
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const [record] = await db2.select().from(verificationCodes).where(
      and(
        eq(verificationCodes.email, email.toLowerCase()),
        eq(verificationCodes.type, type),
        eq(verificationCodes.isUsed, false),
        gte(verificationCodes.expiresAt, now)
      )
    ).orderBy(desc(verificationCodes.createdAt)).limit(1);
    if (!record) {
      logger.warn("Verification code not found or expired", { email, type });
      throw new BadRequestError("Invalid or expired verification code");
    }
    if (record.attempts >= record.maxAttempts) {
      logger.warn("Max verification attempts exceeded", { email, type, attempts: record.attempts });
      throw new TooManyRequestsError("Maximum verification attempts exceeded. Please request a new code.");
    }
    await db2.update(verificationCodes).set({ attempts: record.attempts + 1 }).where(eq(verificationCodes.id, record.id));
    if (record.code !== code) {
      logger.warn("Invalid verification code attempt", { email, type, attempts: record.attempts + 1 });
      throw new BadRequestError("Invalid verification code");
    }
    logger.info("Verification code validated (not marked as used yet)", { email, type });
    return true;
  }
  /**
   * Mark a validated verification code as used
   * Call this after validateCodeWithoutMarking() once the operation succeeds
   */
  async markCodeAsUsed(email, type) {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const [record] = await db2.select().from(verificationCodes).where(
      and(
        eq(verificationCodes.email, email.toLowerCase()),
        eq(verificationCodes.type, type),
        eq(verificationCodes.isUsed, false),
        gte(verificationCodes.expiresAt, now)
      )
    ).orderBy(desc(verificationCodes.createdAt)).limit(1);
    if (record) {
      await db2.update(verificationCodes).set({
        isUsed: true,
        usedAt: now
      }).where(eq(verificationCodes.id, record.id));
      logger.info("Verification code marked as used", { email, type });
    }
  }
  /**
   * Invalidate all unused codes for a specific email/type
   */
  async invalidateCodes(email, type) {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const result = await db2.update(verificationCodes).set({ isUsed: true, usedAt: now }).where(
      and(
        eq(verificationCodes.email, email.toLowerCase()),
        eq(verificationCodes.type, type),
        eq(verificationCodes.isUsed, false)
      )
    ).returning({ id: verificationCodes.id });
    if (result.length > 0) {
      logger.info("Invalidated existing verification codes", {
        email,
        type,
        count: result.length
      });
    }
  }
  /**
   * Cleanup expired and used verification codes
   * Called by cron job
   */
  async cleanupExpiredCodes() {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const deleted = await db2.delete(verificationCodes).where(
      or(
        lte(verificationCodes.expiresAt, cutoffDate),
        and(
          eq(verificationCodes.isUsed, true),
          lte(verificationCodes.usedAt, cutoffDate)
        )
      )
    ).returning({ id: verificationCodes.id });
    logger.info("Verification codes cleanup completed", {
      deletedCount: deleted.length
    });
    return deleted.length;
  }
};
var verificationCodeService = new VerificationCodeService();

// src/services/ip-reputation.service.ts
var IpReputationService = class {
  /**
   * Track an IP action and update reputation
   *
   * @param ip - IP address
   * @param action - Action type
   * @param success - Whether the action was successful
   * @param metadata - Additional metadata
   */
  async trackIP(ip, action, success, metadata) {
    try {
      const ipRecord = await this.getOrCreateIP(ip, metadata);
      const updates = {
        lastSeenAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (action === "login") {
        if (success) {
          updates.successfulLogins = (ipRecord.successfulLogins || 0) + 1;
        } else {
          updates.failedLoginAttempts = (ipRecord.failedLoginAttempts || 0) + 1;
        }
      } else if (action === "rate_limit") {
        updates.rateLimitViolations = (ipRecord.rateLimitViolations || 0) + 1;
      } else if (action === "abuse_report") {
        updates.abuseReports = (ipRecord.abuseReports || 0) + 1;
      }
      if (metadata?.userAgent) {
        updates.userAgent = metadata.userAgent;
      }
      if (metadata?.country) {
        updates.country = metadata.country;
      }
      const newScore = await this.calculateScore(ip);
      updates.reputationScore = newScore;
      if (newScore < 20 && !ipRecord.isBlocked) {
        updates.isBlocked = true;
        updates.blockedAt = /* @__PURE__ */ new Date();
        updates.blockReason = "Automatic block due to low reputation score";
        updates.blockedUntil = null;
        logger.warn("IP automatically blocked due to low reputation", {
          ip,
          reputationScore: newScore,
          failedLogins: updates.failedLoginAttempts,
          rateLimitViolations: updates.rateLimitViolations,
          abuseReports: updates.abuseReports
        });
      }
      await db.update(ipReputation).set(updates).where(eq(ipReputation.ipAddress, ip));
    } catch (error) {
      logger.error("Failed to track IP", {
        ip,
        action,
        success,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Get IP reputation record
   *
   * @param ip - IP address
   * @returns IP reputation or null
   */
  async getReputation(ip) {
    try {
      const results = await db.select().from(ipReputation).where(eq(ipReputation.ipAddress, ip)).limit(1);
      return results[0] || null;
    } catch (error) {
      logger.error("Failed to get IP reputation", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Check if an IP is blocked
   *
   * @param ip - IP address
   * @returns True if blocked, false otherwise
   */
  async isBlocked(ip) {
    try {
      const record = await this.getReputation(ip);
      if (!record || !record.isBlocked) {
        return false;
      }
      if (record.blockedUntil && record.blockedUntil < /* @__PURE__ */ new Date()) {
        await this.unblockIP(ip);
        return false;
      }
      return true;
    } catch (error) {
      logger.error("Failed to check if IP is blocked", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
  /**
   * Block an IP address
   *
   * @param ip - IP address
   * @param reason - Block reason
   * @param duration - Optional duration in hours (null = permanent)
   */
  async blockIP(ip, reason, duration) {
    try {
      await this.getOrCreateIP(ip);
      const blockedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1e3) : null;
      await db.update(ipReputation).set({
        isBlocked: true,
        blockReason: reason,
        blockedAt: /* @__PURE__ */ new Date(),
        blockedUntil,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(ipReputation.ipAddress, ip));
      logger.info("IP blocked", {
        ip,
        reason,
        duration: duration ? `${duration} hours` : "permanent",
        blockedUntil: blockedUntil?.toISOString()
      });
    } catch (error) {
      logger.error("Failed to block IP", {
        ip,
        reason,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Unblock an IP address
   *
   * @param ip - IP address
   */
  async unblockIP(ip) {
    try {
      await db.update(ipReputation).set({
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedUntil: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(ipReputation.ipAddress, ip));
      logger.info("IP unblocked", { ip });
    } catch (error) {
      logger.error("Failed to unblock IP", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Calculate reputation score for an IP
   *
   * Score calculation:
   * - Start: 100
   * - Failed login: -5
   * - Rate limit violation: -10
   * - Abuse report: -20
   * - Successful login: +2
   *
   * @param ip - IP address
   * @returns Reputation score (0-100)
   */
  async calculateScore(ip) {
    try {
      const record = await this.getReputation(ip);
      if (!record) {
        return 100;
      }
      let score = 100;
      score -= (record.failedLoginAttempts || 0) * 5;
      score -= (record.rateLimitViolations || 0) * 10;
      score -= (record.abuseReports || 0) * 20;
      score += (record.successfulLogins || 0) * 2;
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      logger.error("Failed to calculate IP score", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return 100;
    }
  }
  /**
   * Cleanup expired temporary blocks and improve reputation scores
   *
   * This should be run periodically (e.g., daily cron job)
   * - Removes expired temporary blocks
   * - Gradually improves reputation scores for IPs with score < 100
   *
   * @returns Object with cleanup statistics
   */
  async cleanupExpiredBlocks() {
    try {
      const now = /* @__PURE__ */ new Date();
      const expiredBlocks = await db.select().from(ipReputation).where(
        and(
          eq(ipReputation.isBlocked, true),
          lt(ipReputation.blockedUntil, now)
        )
      );
      let unblockedCount = 0;
      for (const record of expiredBlocks) {
        if (record.blockedUntil !== null) {
          await this.unblockIP(record.ipAddress);
          unblockedCount++;
        }
      }
      const ipsToImprove = await db.select().from(ipReputation).where(lt(ipReputation.reputationScore, 100));
      let improvedCount = 0;
      for (const record of ipsToImprove) {
        const newScore = Math.min(100, (record.reputationScore || 0) + 10);
        await db.update(ipReputation).set({
          reputationScore: newScore,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(ipReputation.ipAddress, record.ipAddress));
        improvedCount++;
      }
      logger.info("IP reputation cleanup completed", {
        unblockedCount,
        improvedCount,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return { unblockedCount, improvedCount };
    } catch (error) {
      logger.error("Failed to cleanup IP reputation", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get statistics about IP reputation
   *
   * @returns Statistics object
   */
  async getStatistics() {
    try {
      const allIPs = await db.select().from(ipReputation);
      const stats = {
        totalIPs: allIPs.length,
        blockedIPs: allIPs.filter((ip) => ip.isBlocked).length,
        suspiciousIPs: allIPs.filter(
          (ip) => !ip.isBlocked && (ip.reputationScore || 0) < 50
        ).length,
        goodIPs: allIPs.filter((ip) => (ip.reputationScore || 0) >= 50).length,
        averageScore: allIPs.length > 0 ? allIPs.reduce((sum2, ip) => sum2 + (ip.reputationScore || 0), 0) / allIPs.length : 100
      };
      return stats;
    } catch (error) {
      logger.error("Failed to get IP reputation statistics", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Query IP reputations with filters and pagination
   *
   * @param filters - Query filters
   * @returns Array of IP reputations
   */
  async query(filters) {
    try {
      const conditions = [];
      if (filters.isBlocked !== void 0) {
        conditions.push(eq(ipReputation.isBlocked, filters.isBlocked));
      }
      if (filters.minScore !== void 0) {
        conditions.push(gte(ipReputation.reputationScore, filters.minScore));
      }
      if (filters.maxScore !== void 0) {
        conditions.push(lte(ipReputation.reputationScore, filters.maxScore));
      }
      const baseQuery = db.select().from(ipReputation);
      const results = conditions.length > 0 ? await baseQuery.where(and(...conditions)).limit(filters.limit || 50).offset(filters.offset || 0) : await baseQuery.limit(filters.limit || 50).offset(filters.offset || 0);
      return results;
    } catch (error) {
      logger.error("Failed to query IP reputations", {
        filters,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get or create an IP reputation record
   *
   * @param ip - IP address
   * @param metadata - Optional metadata
   * @returns IP reputation record
   */
  async getOrCreateIP(ip, metadata) {
    try {
      const existing = await this.getReputation(ip);
      if (existing) {
        return existing;
      }
      const newRecord = {
        ipAddress: ip,
        reputationScore: 100,
        failedLoginAttempts: 0,
        successfulLogins: 0,
        rateLimitViolations: 0,
        abuseReports: 0,
        isBlocked: false,
        lastSeenAt: /* @__PURE__ */ new Date(),
        firstSeenAt: /* @__PURE__ */ new Date(),
        userAgent: metadata?.userAgent || null,
        country: metadata?.country || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      const [created] = await db.insert(ipReputation).values(newRecord).returning();
      if (!created) {
        throw new Error("Failed to create IP reputation record");
      }
      return created;
    } catch (error) {
      logger.error("Failed to get or create IP", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get client IP address from request
   *
   * Handles X-Forwarded-For header for proxies
   *
   * @param req - Express request
   * @returns IP address
   */
  getClientIp(req) {
    const forwardedFor = req.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0];
      return firstIp?.trim() || "unknown";
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }
};
var ipReputationService = new IpReputationService();

// src/services/cart.service.ts
var CartService = class {
  /**
   * Merge session cart into customer cart on login
   * Combines quantities for duplicate items (same product + variant)
   *
   * @param sessionId - Session ID from x-session-id header
   * @param customerId - Customer ID from authenticated user
   * @returns Number of items merged
   */
  async mergeSessionCart(sessionId, customerId) {
    const db2 = getDb();
    try {
      const [sessionCart] = await db2.select().from(carts).where(eq(carts.sessionId, sessionId));
      if (!sessionCart) {
        logger.debug("No session cart to merge", { sessionId, customerId });
        return 0;
      }
      let [customerCart] = await db2.select().from(carts).where(eq(carts.customerId, customerId));
      if (!customerCart) {
        [customerCart] = await db2.insert(carts).values({ customerId }).returning();
        if (!customerCart) {
          throw new Error("Failed to create customer cart");
        }
      }
      const sessionItems = await db2.select().from(cartItems).where(eq(cartItems.cartId, sessionCart.id));
      if (sessionItems.length === 0) {
        await db2.delete(carts).where(eq(carts.id, sessionCart.id));
        return 0;
      }
      let mergedCount = 0;
      for (const item of sessionItems) {
        const [existingItem] = await db2.select().from(cartItems).where(
          and(
            eq(cartItems.cartId, customerCart.id),
            eq(cartItems.productId, item.productId),
            item.variantId ? eq(cartItems.variantId, item.variantId) : isNull(cartItems.variantId)
          )
        );
        if (existingItem) {
          await db2.update(cartItems).set({
            quantity: existingItem.quantity + item.quantity,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(cartItems.id, existingItem.id));
          logger.debug("Merged cart item quantities", {
            productId: item.productId,
            variantId: item.variantId,
            oldQuantity: existingItem.quantity,
            addedQuantity: item.quantity,
            newQuantity: existingItem.quantity + item.quantity
          });
        } else {
          await db2.update(cartItems).set({
            cartId: customerCart.id,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(cartItems.id, item.id));
          logger.debug("Transferred cart item to customer", {
            cartItemId: item.id,
            productId: item.productId
          });
        }
        mergedCount++;
      }
      await db2.delete(carts).where(eq(carts.id, sessionCart.id));
      logger.info("Cart merge completed", {
        sessionId,
        customerId,
        itemsMerged: mergedCount
      });
      return mergedCount;
    } catch (error) {
      logger.error("Cart merge failed", error, {
        sessionId,
        customerId
      });
      return 0;
    }
  }
};
var cartService = new CartService();

// src/services/mailer.service.ts
var import_nodemailer = __toESM(require("nodemailer"));
var MailerService = class {
  transporter = null;
  fromEmail;
  fromName;
  isConfigured = false;
  constructor() {
    this.fromEmail = process.env["SMTP_FROM_EMAIL"] || process.env["SMTP_USER"] || "noreply@lab404electronics.com";
    this.fromName = process.env["SMTP_FROM_NAME"] || "Lab404 Electronics";
    this.initialize();
  }
  initialize() {
    const host = process.env["SMTP_HOST"];
    const port = parseInt(process.env["SMTP_PORT"] || "587", 10);
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];
    if (!host || !user || !pass) {
      logger.warn("SMTP not configured. Email notifications will be disabled.");
      this.isConfigured = false;
      return;
    }
    const config2 = {
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    };
    this.transporter = import_nodemailer.default.createTransport(config2);
    this.isConfigured = true;
    logger.info("SMTP mailer initialized", { host, port });
  }
  async sendEmail(options) {
    if (!this.isConfigured || !this.transporter) {
      logger.warn("Email not sent - SMTP not configured", { to: options.to, subject: options.subject });
      return false;
    }
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || "application/pdf"
        }));
      }
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent successfully", { messageId: info.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to, subject: options.subject });
      return false;
    }
  }
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
  // Verify SMTP connection
  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified");
      return true;
    } catch (error) {
      logger.error("SMTP connection verification failed", { error });
      return false;
    }
  }
  isReady() {
    return this.isConfigured;
  }
};
var mailerService = new MailerService();

// src/services/notification.service.ts
var defaultSettings = {
  enabled: true,
  adminEmails: [process.env["ADMIN_EMAIL"] || "admin@lab404electronics.com"],
  notifications: {
    new_order: true,
    order_status_change: true,
    low_stock_alert: true,
    new_customer: true,
    new_contact_message: true,
    quotation_request: true,
    payment_received: true,
    refund_processed: true
  }
};
function getData(data, key) {
  const value = data[key];
  return value !== void 0 ? String(value) : "";
}
var NotificationService = class {
  settings = defaultSettings;
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    logger.info("Notification settings updated", { settings: this.settings });
  }
  getSettings() {
    return this.settings;
  }
  async notify(type, data) {
    if (!this.settings.enabled || !this.settings.notifications[type]) {
      logger.debug("Notification skipped - disabled", { type });
      return false;
    }
    const template = this.getTemplate(type, data);
    if (!template) {
      logger.warn("No template found for notification type", { type });
      return false;
    }
    return mailerService.sendEmail({
      to: this.settings.adminEmails,
      subject: template.subject,
      html: template.html
    });
  }
  getAdminUrl() {
    return process.env["ADMIN_URL"] || "http://localhost:3001";
  }
  getTemplate(type, data) {
    const adminUrl = this.getAdminUrl();
    const templates = {
      new_order: () => ({
        subject: `New Order #${getData(data, "orderId")} - Lab404 Electronics`,
        html: this.wrapTemplate(`
          <h2>New Order Received</h2>
          <p>A new order has been placed on your store.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, "orderId")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerName")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerEmail")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">$${getData(data, "total")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "itemCount")} item(s)</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, "orderId")}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `)
      }),
      order_status_change: () => ({
        subject: `Order #${getData(data, "orderId")} Status Changed to ${getData(data, "newStatus")}`,
        html: this.wrapTemplate(`
          <h2>Order Status Updated</h2>
          <p>Order #${getData(data, "orderId")} status has been changed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, "orderId")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Previous Status:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "previousStatus")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Status:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong style="color: #2563eb;">${getData(data, "newStatus")}</strong></td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, "orderId")}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `)
      }),
      low_stock_alert: () => ({
        subject: `Low Stock Alert: ${getData(data, "productName")}`,
        html: this.wrapTemplate(`
          <h2 style="color: #dc2626;">Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Product:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "productName")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>SKU:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "sku")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Stock:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626;"><strong>${getData(data, "currentStock")}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Threshold:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "threshold")}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/products/${getData(data, "productId")}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Stock</a></p>
        `)
      }),
      new_customer: () => ({
        subject: `New Customer Registration - ${getData(data, "customerName")}`,
        html: this.wrapTemplate(`
          <h2>New Customer Registered</h2>
          <p>A new customer has registered on your store.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerName")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerEmail")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Registered:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${(/* @__PURE__ */ new Date()).toLocaleString()}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/customers/${getData(data, "customerId")}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Customer</a></p>
        `)
      }),
      new_contact_message: () => ({
        subject: `New Contact Message from ${getData(data, "name")}`,
        html: this.wrapTemplate(`
          <h2>New Contact Message</h2>
          <p>You have received a new message through the contact form.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "name")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "email")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subject:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "subject")}</td>
            </tr>
          </table>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>Message:</strong>
            <p style="margin-top: 10px;">${getData(data, "message")}</p>
          </div>
        `)
      }),
      quotation_request: () => ({
        subject: `New Quotation Request #${getData(data, "quotationId")}`,
        html: this.wrapTemplate(`
          <h2>New Quotation Request</h2>
          <p>A new quotation request has been submitted.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quotation ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, "quotationId")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerName")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "customerEmail")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "itemCount")} item(s)</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/quotations/${getData(data, "quotationId")}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quotation</a></p>
        `)
      }),
      payment_received: () => ({
        subject: `Payment Received for Order #${getData(data, "orderId")}`,
        html: this.wrapTemplate(`
          <h2 style="color: #16a34a;">Payment Received</h2>
          <p>Payment has been successfully received for an order.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, "orderId")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #16a34a;"><strong>$${getData(data, "amount")}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Method:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "paymentMethod")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "transactionId")}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, "orderId")}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `)
      }),
      refund_processed: () => ({
        subject: `Refund Processed for Order #${getData(data, "orderId")}`,
        html: this.wrapTemplate(`
          <h2 style="color: #f59e0b;">Refund Processed</h2>
          <p>A refund has been processed for an order.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, "orderId")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Refund Amount:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #f59e0b;"><strong>$${getData(data, "amount")}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Reason:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, "reason")}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, "orderId")}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `)
      })
    };
    const templateFn = templates[type];
    return templateFn ? templateFn() : null;
  }
  wrapTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Lab404 Electronics</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Admin Notification</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${content}
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated notification from Lab404 Electronics Admin.</p>
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Lab404 Electronics. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }
  /**
   * Send quotation email to customer with PDF attachment
   */
  async sendQuotationToCustomer(data, pdfBuffer) {
    const formatCurrency = (amount, currency) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD"
      }).format(amount);
    };
    const formatDate = (date2) => {
      if (!date2) {
        return "No expiration";
      }
      return new Date(date2).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const html = this.wrapCustomerTemplate(`
      <h2>Quotation ${data.quotationNumber}</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for your interest. Please find attached your quotation from ${data.companyName}.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quotation Number:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.quotationNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.itemCount} item(s)</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong style="color: #2563eb;">${formatCurrency(data.total, data.currency)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Valid Until:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(data.validUntil)}</td>
        </tr>
      </table>

      <p>The detailed quotation is attached as a PDF document.</p>

      <p>If you have any questions or would like to proceed with this quotation, please don't hesitate to contact us:</p>
      <ul style="list-style: none; padding: 0;">
        ${data.companyEmail ? `<li style="padding: 5px 0;">Email: <a href="mailto:${data.companyEmail}">${data.companyEmail}</a></li>` : ""}
        ${data.companyPhone ? `<li style="padding: 5px 0;">Phone: ${data.companyPhone}</li>` : ""}
      </ul>

      <p>We look forward to doing business with you!</p>
      <p>Best regards,<br/>${data.companyName}</p>
    `, data.companyName);
    return mailerService.sendEmail({
      to: data.customerEmail,
      subject: `Quotation ${data.quotationNumber} from ${data.companyName}`,
      html,
      attachments: [
        {
          filename: `${data.quotationNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });
  }
  wrapCustomerTemplate(content, companyName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${content}
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }
  /**
   * Send verification code email
   */
  async sendVerificationCode(data) {
    const { email, code, type, expiryMinutes } = data;
    const companyName = process.env["COMPANY_NAME"] || "Lab404 Electronics";
    const subjects = {
      password_reset: "Password Reset Verification Code",
      email_verification: "Email Verification Code",
      account_unlock: "Account Unlock Verification Code"
    };
    const subject = subjects[type];
    const titles = {
      password_reset: "Reset Your Password",
      email_verification: "Verify Your Email",
      account_unlock: "Unlock Your Account"
    };
    const title = titles[type];
    const html = this.wrapCustomerTemplate(`
      <h2 style="color: #1f2937; margin-bottom: 24px;">${title}</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Your verification code is:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #f3f4f6; padding: 20px 40px; border-radius: 8px; border: 2px dashed #d1d5db;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
            ${code}
          </span>
        </div>
      </div>

      <p style="color: #dc2626; font-weight: bold; font-size: 14px; margin: 20px 0;">
        \u26A0\uFE0F This code will expire in ${expiryMinutes} minutes.
      </p>

      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
        If you didn't request this code, please ignore this email or contact our support team if you have concerns.
      </p>
    `, companyName);
    logger.info("Sending verification code email", { email, type });
    return mailerService.sendEmail({
      to: email,
      subject,
      html
    });
  }
  /**
   * Send password changed confirmation email
   * Notifies user of successful password change with timestamp and IP
   */
  async sendPasswordChangedConfirmation(data) {
    const { email, firstName, timestamp: timestamp2, ipAddress } = data;
    const companyName = process.env["COMPANY_NAME"] || "Lab404 Electronics";
    const formattedTimestamp = timestamp2.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
    const greeting = firstName ? `Hello ${firstName},` : "Hello,";
    const html = this.wrapCustomerTemplate(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #16a34a; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">
          \u2713
        </div>
      </div>

      <h2 style="color: #1f2937; margin-bottom: 24px; text-align: center;">
        Password Changed Successfully
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        ${greeting}
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Your password was successfully changed on <strong>${formattedTimestamp}</strong>.
      </p>

      ${ipAddress ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Security Details:</strong><br>
            From IP address: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace;">${ipAddress}</code>
          </p>
        </div>
      ` : ""}

      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #dc2626; font-weight: bold; font-size: 16px; margin: 0 0 12px 0;">
          \u26A0\uFE0F Did you make this change?
        </p>
        <p style="color: #991b1b; font-size: 14px; line-height: 20px; margin: 0;">
          If you did not change your password, please contact our support team immediately to secure your account.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="mailto:contact@lab404electronics.com?subject=Unauthorized%20Password%20Change"
           style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Contact Support
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
        For security reasons, we recommend using a strong, unique password and enabling two-factor authentication when available.
      </p>
    `, companyName);
    logger.info("Sending password changed confirmation email", { email });
    return mailerService.sendEmail({
      to: email,
      subject: `Your Password Was Changed - ${companyName}`,
      html
    });
  }
  /**
   * Send email verification code for new account registration
   * Welcomes user and provides 6-digit verification code
   */
  async sendEmailVerification(data) {
    const { email, firstName, code, expiryMinutes } = data;
    const companyName = process.env["COMPANY_NAME"] || "Lab404 Electronics";
    const greeting = firstName ? `Hello ${firstName},` : "Hello,";
    const html = this.wrapCustomerTemplate(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">
          \u2709\uFE0F
        </div>
      </div>

      <h2 style="color: #1f2937; margin-bottom: 24px; text-align: center;">
        Welcome to ${companyName}!
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        ${greeting}
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
        Thank you for creating an account with us. To complete your registration and activate your account, please verify your email address using the code below.
      </p>

      <div style="background: #eff6ff; border: 2px solid #2563eb; padding: 24px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="color: #1e40af; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
          Your Verification Code
        </p>
        <p style="color: #1e3a8a; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
          ${code}
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-bottom: 20px; text-align: center;">
        This code will expire in <strong>${expiryMinutes} minutes</strong>.
      </p>

      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px;">
          <strong>Didn't create an account?</strong><br>
          If you didn't request this verification code, you can safely ignore this email. Your email address will not be used without verification.
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
        Need help? Contact our support team at <a href="mailto:contact@lab404electronics.com" style="color: #2563eb; text-decoration: none;">contact@lab404electronics.com</a>
      </p>
    `, companyName);
    logger.info("Sending email verification code", { email });
    return mailerService.sendEmail({
      to: email,
      subject: `Verify Your Email Address - ${companyName}`,
      html
    });
  }
  /**
   * Send quotation expiry reminder to customer
   */
  async sendQuotationExpiryReminder(customerEmail, customerName, quotationNumber, daysUntilExpiry, expiryDate, acceptanceToken) {
    const companyName = process.env["COMPANY_NAME"] || "Lab404 Electronics";
    const websiteUrl = process.env["WEBSITE_URL"] || "https://lab404electronics.com";
    const formatDate = (date2) => {
      return new Date(date2).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const urgencyColor = daysUntilExpiry <= 1 ? "#dc2626" : daysUntilExpiry <= 3 ? "#f59e0b" : "#3b82f6";
    const urgencyText = daysUntilExpiry <= 1 ? "Expires Tomorrow!" : `Expires in ${daysUntilExpiry} Days`;
    const viewLink = acceptanceToken ? `${websiteUrl}/quotations/view/${acceptanceToken}` : null;
    const html = this.wrapCustomerTemplate(`
      <div style="text-align: center; padding: 20px 0;">
        <span style="background: ${urgencyColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
          ${urgencyText}
        </span>
      </div>

      <h2>Quotation Expiry Reminder</h2>
      <p>Dear ${customerName},</p>
      <p>This is a friendly reminder that your quotation <strong>${quotationNumber}</strong> will expire on <strong style="color: ${urgencyColor};">${formatDate(expiryDate)}</strong>.</p>

      <div style="background: #f8fafc; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Don't miss out!</strong> Review and accept your quotation before it expires to secure your pricing.</p>
      </div>

      ${viewLink ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View & Accept Quotation
          </a>
        </p>
      ` : ""}

      <p>If you have any questions or need to discuss the quotation, please don't hesitate to contact us.</p>

      <p>Best regards,<br/>${companyName}</p>
    `, companyName);
    return mailerService.sendEmail({
      to: customerEmail,
      subject: `${urgencyText}: Quotation ${quotationNumber} - ${companyName}`,
      html
    });
  }
};
var notificationService = new NotificationService();

// src/services/password-security.service.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"));
var import_zxcvbn = __toESM(require("zxcvbn"));

// src/services/hibp.service.ts
var import_crypto3 = __toESM(require("crypto"));
var HIBPService = class {
  static HIBP_API_URL = "https://api.pwnedpasswords.com/range";
  static CACHE_DURATION_DAYS = 30;
  /**
   * Check if a password has been found in data breaches
   * Uses k-anonymity to protect password privacy
   *
   * @param password - Plain text password to check
   * @param customerId - Optional customer ID for caching
   * @returns Breach status and count
   */
  static async checkPassword(password, customerId) {
    const hash = import_crypto3.default.createHash("sha1").update(password).digest("hex").toUpperCase();
    const hashPrefix = hash.substring(0, 5);
    const hashSuffix = hash.substring(5);
    if (customerId) {
      const cachedResult = await this.getCachedResult(customerId, hashPrefix);
      if (cachedResult) {
        return cachedResult;
      }
    }
    try {
      const response = await fetch(`${this.HIBP_API_URL}/${hashPrefix}`, {
        headers: {
          "User-Agent": "Lab404-Electronics-Auth-System"
        }
      });
      if (!response.ok) {
        console.warn(`HIBP API returned ${response.status}, allowing password by default`);
        return { isBreached: false, breachCount: 0, cached: false };
      }
      const body = await response.text();
      const lines = body.split("\n");
      let breachCount = 0;
      for (const line2 of lines) {
        const parts = line2.split(":");
        const suffix = parts[0];
        const count2 = parts[1];
        if (suffix && suffix.trim() === hashSuffix) {
          breachCount = parseInt(count2?.trim() || "0", 10);
          break;
        }
      }
      const result = {
        isBreached: breachCount > 0,
        breachCount,
        cached: false
      };
      if (customerId) {
        await this.setCachedResult(customerId, hashPrefix, result);
      }
      return result;
    } catch (error) {
      console.error("HIBP API check failed:", error);
      return { isBreached: false, breachCount: 0, cached: false };
    }
  }
  /**
   * Get cached breach check result
   *
   * @param customerId - Customer ID
   * @param hashPrefix - First 5 characters of SHA-1 hash
   * @returns Cached result if valid, null otherwise
   */
  static async getCachedResult(customerId, hashPrefix) {
    try {
      const db2 = getDb();
      const cached = await db2.select().from(breachChecks).where(
        and(
          eq(breachChecks.customerId, customerId),
          eq(breachChecks.passwordHashPrefix, hashPrefix)
        )
      ).limit(1);
      const check = cached[0];
      if (!check) {
        return null;
      }
      if (/* @__PURE__ */ new Date() > check.expiresAt) {
        return null;
      }
      return {
        isBreached: check.isBreached,
        breachCount: check.breachCount,
        cached: true
      };
    } catch (error) {
      console.warn("Failed to get cached breach check result:", error);
      return null;
    }
  }
  /**
   * Cache breach check result
   *
   * @param customerId - Customer ID
   * @param hashPrefix - First 5 characters of SHA-1 hash
   * @param result - Breach check result to cache
   */
  static async setCachedResult(customerId, hashPrefix, result) {
    try {
      const db2 = getDb();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CACHE_DURATION_DAYS);
      await db2.insert(breachChecks).values({
        customerId,
        passwordHashPrefix: hashPrefix,
        isBreached: result.isBreached,
        breachCount: result.breachCount,
        expiresAt,
        checkReason: "password_change"
      });
    } catch (error) {
      console.warn("Failed to cache HIBP result:", error);
    }
  }
  /**
   * Clean up expired cache entries
   * Should be called periodically via cron job
   */
  static async cleanupExpiredCache() {
    const db2 = getDb();
    try {
      const result = await db2.delete(breachChecks).where(eq(breachChecks.expiresAt, /* @__PURE__ */ new Date()));
      return result.rowCount || 0;
    } catch (error) {
      console.error("Failed to cleanup expired breach checks:", error);
      return 0;
    }
  }
};

// src/services/password-security.service.ts
var PasswordSecurityService = class {
  static HISTORY_LIMIT = 10;
  // Store last 10 passwords
  static MIN_STRENGTH_SCORE = 2;
  // Require at least score 2 (fair)
  /**
   * Calculate password strength using zxcvbn
   *
   * @param password - Plain text password
   * @param userInputs - Optional array of user-specific strings (email, name, etc.)
   * @returns Strength analysis
   */
  static async calculateStrength(password, userInputs) {
    const result = (0, import_zxcvbn.default)(password, userInputs);
    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || "",
        suggestions: result.feedback.suggestions || []
      },
      crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second)
    };
  }
  /**
   * Check if password has been used before by this customer
   *
   * @param customerId - Customer ID
   * @param password - Plain text password to check
   * @returns True if password was used before
   */
  static async checkPasswordHistory(customerId, password) {
    try {
      const db2 = getDb();
      const history = await db2.select().from(passwordHistory).where(eq(passwordHistory.customerId, customerId)).orderBy(desc(passwordHistory.changedAt)).limit(this.HISTORY_LIMIT);
      for (const entry of history) {
        const matches = await import_bcryptjs2.default.compare(password, entry.passwordHash);
        if (matches) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn("Failed to check password history (table may not exist):", error);
      return false;
    }
  }
  /**
   * Record password change in history
   *
   * @param data - Password history entry data
   */
  static async recordPasswordChange(data) {
    try {
      const db2 = getDb();
      await db2.insert(passwordHistory).values(data);
      const allHistory = await db2.select().from(passwordHistory).where(eq(passwordHistory.customerId, data.customerId)).orderBy(desc(passwordHistory.changedAt));
      if (allHistory.length > this.HISTORY_LIMIT) {
        const idsToDelete = allHistory.slice(this.HISTORY_LIMIT).map((entry) => entry.id);
        if (idsToDelete.length > 0 && idsToDelete[0]) {
          await db2.delete(passwordHistory).where(eq(passwordHistory.id, idsToDelete[0]));
        }
      }
    } catch (error) {
      console.warn("Failed to record password change (table may not exist):", error);
    }
  }
  /**
   * Validate password with comprehensive checks
   *
   * @param password - Plain text password
   * @param customerId - Customer ID
   * @param userInputs - Optional array of user-specific strings
   * @returns Validation result with detailed feedback
   */
  static async validatePassword(password, customerId, userInputs) {
    const errors = [];
    if (password.length < 8) {
      errors.push("\u274C Password Length: Must be at least 8 characters long. Current length: " + password.length);
    }
    if (password.length > 100) {
      errors.push("\u274C Password Length: Must not exceed 100 characters. Current length: " + password.length);
    }
    const strength = await this.calculateStrength(password, userInputs);
    if (strength.score < this.MIN_STRENGTH_SCORE) {
      const warningText = strength.feedback.warning || "This password is too predictable.";
      errors.push(
        `\u{1F512} Password Strength: Your password is too weak (${strength.score}/4). ${warningText}`
      );
      if (strength.feedback.suggestions.length > 0) {
        errors.push(`\u{1F4A1} Suggestions: ${strength.feedback.suggestions.join(" ")}`);
      }
    }
    const breachResult = await HIBPService.checkPassword(password, customerId);
    if (breachResult.isBreached) {
      const breachText = breachResult.breachCount > 1e3 ? `${(breachResult.breachCount / 1e3).toFixed(1)}k+` : breachResult.breachCount.toString();
      errors.push(
        `\u26A0\uFE0F Security Alert: This password has been exposed in ${breachText} data breaches and is not safe to use. Please choose a unique password that you haven't used elsewhere.`
      );
    }
    const isReused = await this.checkPasswordHistory(customerId, password);
    if (isReused) {
      errors.push("\u{1F504} Password History: You've used this password before. For security, please choose a new password you haven't used on this account.");
    }
    const strengthResult = {
      ...strength,
      isBreached: breachResult.isBreached,
      breachCount: breachResult.breachCount,
      isReused
    };
    return {
      isValid: errors.length === 0,
      errors,
      strengthResult
    };
  }
  /**
   * Validate password without checking history (for new users)
   *
   * @param password - Plain text password
   * @param userInputs - Optional array of user-specific strings
   * @returns Validation result
   */
  static async validateNewPassword(password, userInputs) {
    const errors = [];
    if (password.length < 8) {
      errors.push("\u274C Password Length: Must be at least 8 characters long. Current length: " + password.length);
    }
    if (password.length > 100) {
      errors.push("\u274C Password Length: Must not exceed 100 characters. Current length: " + password.length);
    }
    const strength = await this.calculateStrength(password, userInputs);
    if (strength.score < this.MIN_STRENGTH_SCORE) {
      const warningText = strength.feedback.warning || "This password is too predictable.";
      errors.push(
        `\u{1F512} Password Strength: Your password is too weak (${strength.score}/4). ${warningText}`
      );
      if (strength.feedback.suggestions.length > 0) {
        errors.push(`\u{1F4A1} Suggestions: ${strength.feedback.suggestions.join(" ")}`);
      }
    }
    const breachResult = await HIBPService.checkPassword(password);
    if (breachResult.isBreached) {
      const breachText = breachResult.breachCount > 1e3 ? `${(breachResult.breachCount / 1e3).toFixed(1)}k+` : breachResult.breachCount.toString();
      errors.push(
        `\u26A0\uFE0F Security Alert: This password has been exposed in ${breachText} data breaches and is not safe to use. Please choose a unique password that you haven't used elsewhere.`
      );
    }
    const strengthResult = {
      ...strength,
      isBreached: breachResult.isBreached,
      breachCount: breachResult.breachCount,
      isReused: false
    };
    return {
      isValid: errors.length === 0,
      errors,
      strengthResult
    };
  }
};

// src/services/audit-log.service.ts
var AuditLogService = class {
  /**
   * Log a security event
   *
   * @param event - The security event to log
   * @returns Promise<void> - Fire-and-forget, errors are logged but don't throw
   */
  async log(event) {
    try {
      const db2 = getDb();
      const logEntry = {
        timestamp: /* @__PURE__ */ new Date(),
        eventType: event.eventType,
        actorType: event.actorType,
        actorId: event.actorId || null,
        actorEmail: event.actorEmail || null,
        targetType: event.targetType || null,
        targetId: event.targetId || null,
        action: event.action,
        status: event.status,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        sessionId: event.sessionId || null,
        requestId: event.requestId || null,
        metadata: event.metadata || null,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db2.insert(securityAuditLogs).values(logEntry);
    } catch (error) {
      logger.error("Failed to write audit log", {
        event,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Log a security event from an Express request
   *
   * Automatically extracts context (IP, User-Agent, session, etc.)
   *
   * @param req - Express request object
   * @param event - Partial event (context auto-filled)
   */
  async logFromRequest(req, event) {
    const fullEvent = {
      ...event,
      ipAddress: this.getClientIp(req),
      userAgent: req.get("user-agent") || void 0,
      sessionId: req.user?.sessionId || void 0,
      requestId: req.id || void 0
    };
    await this.log(fullEvent);
  }
  /**
   * Query audit logs with filters and pagination
   *
   * @param filters - Query filters
   * @returns Array of audit logs
   */
  async query(filters) {
    try {
      const db2 = getDb();
      const conditions = [];
      if (filters.actorId) {
        conditions.push(eq(securityAuditLogs.actorId, filters.actorId));
      }
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        conditions.push(inArray(securityAuditLogs.eventType, filters.eventTypes));
      }
      if (filters.status) {
        conditions.push(eq(securityAuditLogs.status, filters.status));
      }
      if (filters.ipAddress) {
        conditions.push(eq(securityAuditLogs.ipAddress, filters.ipAddress));
      }
      if (filters.sessionId) {
        conditions.push(eq(securityAuditLogs.sessionId, filters.sessionId));
      }
      if (filters.startDate) {
        conditions.push(gte(securityAuditLogs.timestamp, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(securityAuditLogs.timestamp, filters.endDate));
      }
      const baseQuery = db2.select().from(securityAuditLogs);
      const results = conditions.length > 0 ? await baseQuery.where(and(...conditions)).orderBy(desc(securityAuditLogs.timestamp)).limit(filters.limit || 50).offset(filters.offset || 0) : await baseQuery.orderBy(desc(securityAuditLogs.timestamp)).limit(filters.limit || 50).offset(filters.offset || 0);
      return results;
    } catch (error) {
      logger.error("Failed to query audit logs", {
        filters,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get a single audit log by ID
   *
   * @param id - Audit log ID
   * @returns Audit log or null
   */
  async getById(id) {
    try {
      const db2 = getDb();
      const results = await db2.select().from(securityAuditLogs).where(eq(securityAuditLogs.id, id)).limit(1);
      return results[0] || null;
    } catch (error) {
      logger.error("Failed to get audit log by ID", {
        id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Export audit logs to JSON
   *
   * @param filters - Query filters
   * @returns JSON string of audit logs
   */
  async exportToJSON(filters) {
    const logs = await this.query({ ...filters, limit: 1e4 });
    return JSON.stringify(logs, null, 2);
  }
  /**
   * Export audit logs to CSV
   *
   * @param filters - Query filters
   * @returns CSV string of audit logs
   */
  async exportToCSV(filters) {
    const logs = await this.query({ ...filters, limit: 1e4 });
    if (logs.length === 0) {
      return "No logs found";
    }
    const headers = [
      "ID",
      "Timestamp",
      "Event Type",
      "Actor Type",
      "Actor ID",
      "Actor Email",
      "Target Type",
      "Target ID",
      "Action",
      "Status",
      "IP Address",
      "User Agent",
      "Session ID",
      "Request ID",
      "Metadata"
    ].join(",");
    const rows = logs.map((log) => {
      return [
        log.id,
        log.timestamp.toISOString(),
        log.eventType,
        log.actorType,
        log.actorId || "",
        log.actorEmail || "",
        log.targetType || "",
        log.targetId || "",
        log.action,
        log.status,
        log.ipAddress || "",
        log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : "",
        log.sessionId || "",
        log.requestId || "",
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ""
      ].join(",");
    });
    return `${headers}
${rows.join("\n")}`;
  }
  /**
   * Delete audit logs older than retention period (90 days)
   *
   * @returns Number of deleted logs
   */
  async cleanup() {
    try {
      const db2 = getDb();
      const retentionDays = 90;
      const cutoffDate = /* @__PURE__ */ new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const deletedLogs = await db2.delete(securityAuditLogs).where(lte(securityAuditLogs.timestamp, cutoffDate)).returning({ id: securityAuditLogs.id });
      logger.info("Audit log cleanup completed", {
        deletedCount: deletedLogs.length,
        cutoffDate: cutoffDate.toISOString()
      });
      return deletedLogs.length;
    } catch (error) {
      logger.error("Failed to cleanup audit logs", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get statistics about audit logs
   *
   * @param filters - Optional filters
   * @returns Statistics object
   */
  async getStatistics(filters) {
    try {
      const db2 = getDb();
      const conditions = [];
      if (filters?.startDate) {
        conditions.push(gte(securityAuditLogs.timestamp, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(securityAuditLogs.timestamp, filters.endDate));
      }
      if (filters?.actorId) {
        conditions.push(eq(securityAuditLogs.actorId, filters.actorId));
      }
      const baseLogsQuery = db2.select().from(securityAuditLogs);
      const logs = conditions.length > 0 ? await baseLogsQuery.where(and(...conditions)) : await baseLogsQuery;
      const stats = {
        totalLogs: logs.length,
        successCount: logs.filter((log) => log.status === "success").length,
        failureCount: logs.filter((log) => log.status === "failure").length,
        deniedCount: logs.filter((log) => log.status === "denied").length,
        eventTypeCounts: logs.reduce(
          (acc, log) => {
            acc[log.eventType] = (acc[log.eventType] || 0) + 1;
            return acc;
          },
          {}
        )
      };
      return stats;
    } catch (error) {
      logger.error("Failed to get audit log statistics", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  /**
   * Get client IP address from request
   *
   * Handles X-Forwarded-For header for proxies
   *
   * @param req - Express request
   * @returns IP address
   */
  getClientIp(req) {
    const forwardedFor = req.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0];
      return firstIp?.trim() || "unknown";
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }
};
var auditLogService = new AuditLogService();

// src/types/audit-events.ts
var SecurityEventType = /* @__PURE__ */ ((SecurityEventType2) => {
  SecurityEventType2["AUTH_LOGIN_SUCCESS"] = "auth.login.success";
  SecurityEventType2["AUTH_LOGIN_FAILURE"] = "auth.login.failure";
  SecurityEventType2["AUTH_LOGIN_LOCKED"] = "auth.login.locked";
  SecurityEventType2["AUTH_LOGOUT"] = "auth.logout";
  SecurityEventType2["AUTH_SESSION_CREATED"] = "auth.session.created";
  SecurityEventType2["AUTH_SESSION_REVOKED"] = "auth.session.revoked";
  SecurityEventType2["PASSWORD_CHANGED"] = "password.changed";
  SecurityEventType2["PASSWORD_RESET_REQUESTED"] = "password.reset.requested";
  SecurityEventType2["PASSWORD_RESET_COMPLETED"] = "password.reset.completed";
  SecurityEventType2["PASSWORD_BREACH_DETECTED"] = "password.breach.detected";
  SecurityEventType2["PASSWORD_REUSE_BLOCKED"] = "password.reuse.blocked";
  SecurityEventType2["ACCOUNT_CREATED"] = "account.created";
  SecurityEventType2["ACCOUNT_VERIFIED"] = "account.verified";
  SecurityEventType2["ACCOUNT_LOCKED"] = "account.locked";
  SecurityEventType2["ACCOUNT_UNLOCKED"] = "account.unlocked";
  SecurityEventType2["ACCOUNT_DISABLED"] = "account.disabled";
  SecurityEventType2["EMAIL_CHANGED"] = "email.changed";
  SecurityEventType2["EMAIL_VERIFICATION_SENT"] = "email.verification.sent";
  SecurityEventType2["PERMISSION_DENIED"] = "permission.denied";
  SecurityEventType2["ADMIN_ACCESS_GRANTED"] = "admin.access.granted";
  SecurityEventType2["ADMIN_ACTION"] = "admin.action.performed";
  SecurityEventType2["RATE_LIMIT_EXCEEDED"] = "rate_limit.exceeded";
  SecurityEventType2["SUSPICIOUS_ACTIVITY"] = "suspicious_activity.detected";
  return SecurityEventType2;
})(SecurityEventType || {});
var EventStatus = /* @__PURE__ */ ((EventStatus2) => {
  EventStatus2["SUCCESS"] = "success";
  EventStatus2["FAILURE"] = "failure";
  EventStatus2["DENIED"] = "denied";
  return EventStatus2;
})(EventStatus || {});

// src/services/login-attempt.service.ts
var LoginAttemptService = class {
  static MAX_ATTEMPTS = 5;
  // Lock after 5 failures
  static LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
  // 15 minutes
  static ATTEMPT_WINDOW_MS = 30 * 60 * 1e3;
  // 30-minute window for counting attempts
  /**
   * Record a login attempt
   *
   * @param email - Email address attempted
   * @param success - Whether login was successful
   * @param customerId - Customer ID (if successful)
   * @param failureReason - Reason for failure (if unsuccessful)
   * @param deviceInfo - Device and network information
   */
  static async recordAttempt(email, success, customerId, failureReason, deviceInfo) {
    const db2 = getDb();
    const recentFailures = await this.getRecentFailures(email);
    const consecutiveFailures = success ? 0 : recentFailures + 1;
    const triggeredLockout = !success && consecutiveFailures >= this.MAX_ATTEMPTS;
    const attemptData = {
      customerId: customerId || void 0,
      email,
      success,
      failureReason: failureReason || void 0,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceType: deviceInfo.deviceType,
      deviceBrowser: deviceInfo.deviceBrowser,
      ipCountry: deviceInfo.ipCountry,
      ipCity: deviceInfo.ipCity,
      triggeredLockout,
      consecutiveFailures
    };
    await db2.insert(loginAttempts).values(attemptData);
    if (triggeredLockout && customerId) {
      await this.lockAccount(customerId);
    }
  }
  /**
   * Check if an account is currently locked
   *
   * @param email - Email address to check
   * @returns Lockout status
   */
  static async checkLockoutStatus(email) {
    const db2 = getDb();
    const recentAttempts = await db2.select().from(loginAttempts).where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.triggeredLockout, true)
      )
    ).orderBy(desc(loginAttempts.attemptedAt)).limit(1);
    const lastLockout = recentAttempts[0];
    if (!lastLockout) {
      return {
        isLocked: false,
        consecutiveFailures: await this.getRecentFailures(email)
      };
    }
    const lockoutEndTime = new Date(
      lastLockout.attemptedAt.getTime() + this.LOCKOUT_DURATION_MS
    );
    const now = /* @__PURE__ */ new Date();
    if (now >= lockoutEndTime) {
      return {
        isLocked: false,
        consecutiveFailures: 0
        // Reset after lockout expires
      };
    }
    return {
      isLocked: true,
      lockoutEndTime,
      consecutiveFailures: lastLockout.consecutiveFailures,
      remainingTime: lockoutEndTime.getTime() - now.getTime()
    };
  }
  /**
   * Get count of recent failed attempts in the attempt window
   *
   * @param email - Email address
   * @returns Number of consecutive failures
   */
  static async getRecentFailures(email) {
    const db2 = getDb();
    const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MS);
    const recentAttempts = await db2.select().from(loginAttempts).where(
      and(
        eq(loginAttempts.email, email),
        gte(loginAttempts.attemptedAt, windowStart)
      )
    ).orderBy(desc(loginAttempts.attemptedAt));
    let failures = 0;
    for (const attempt of recentAttempts) {
      if (attempt.success) {
        break;
      }
      failures++;
    }
    return failures;
  }
  /**
   * Clear failed attempts after successful login
   *
   * @param email - Email address
   */
  static async clearFailedAttempts(email) {
    const db2 = getDb();
    const customer = await db2.select().from(customers).where(eq(customers.email, email)).limit(1);
    const foundCustomer = customer[0];
    if (foundCustomer && foundCustomer.accountLocked) {
      await db2.update(customers).set({
        accountLocked: false,
        accountLockedAt: null,
        accountLockedReason: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, foundCustomer.id));
    }
  }
  /**
   * Lock a customer account
   *
   * @param customerId - Customer ID to lock
   */
  static async lockAccount(customerId) {
    const db2 = getDb();
    const [customer] = await db2.select({ email: customers.email }).from(customers).where(eq(customers.id, customerId)).limit(1);
    await db2.update(customers).set({
      accountLocked: true,
      accountLockedAt: /* @__PURE__ */ new Date(),
      accountLockedReason: "Too many failed login attempts",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(customers.id, customerId));
    if (customer) {
      await auditLogService.log({
        eventType: "account.locked" /* ACCOUNT_LOCKED */,
        actorType: "system" /* SYSTEM */,
        actorId: customerId,
        actorEmail: customer.email,
        action: "account_lockout",
        status: "success" /* SUCCESS */,
        metadata: {
          reason: "too_many_failed_attempts",
          lockoutDuration: "15_minutes"
        }
      });
    }
  }
  /**
   * Get login attempt history for a customer
   *
   * @param customerId - Customer ID
   * @param limit - Maximum number of attempts to return
   * @returns Array of login attempts
   */
  static async getAttemptHistory(customerId, limit = 50) {
    const db2 = getDb();
    return await db2.select().from(loginAttempts).where(eq(loginAttempts.customerId, customerId)).orderBy(desc(loginAttempts.attemptedAt)).limit(limit);
  }
  /**
   * Admin: Unlock a customer account
   *
   * @param customerId - Customer ID to unlock
   */
  static async unlockAccount(customerId) {
    const db2 = getDb();
    const [customer] = await db2.select({ email: customers.email }).from(customers).where(eq(customers.id, customerId)).limit(1);
    await db2.update(customers).set({
      accountLocked: false,
      accountLockedAt: null,
      accountLockedReason: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(customers.id, customerId));
    if (customer) {
      await auditLogService.log({
        eventType: "account.unlocked" /* ACCOUNT_UNLOCKED */,
        actorType: "admin" /* ADMIN */,
        targetType: "customer",
        targetId: customerId,
        action: "account_unlock",
        status: "success" /* SUCCESS */,
        metadata: {
          method: "admin_action"
        }
      });
    }
  }
  /**
   * Format remaining lockout time for display
   *
   * @param milliseconds - Remaining time in milliseconds
   * @returns Human-readable time string
   */
  static formatRemainingTime(milliseconds) {
    const minutes = Math.ceil(milliseconds / 6e4);
    if (minutes === 1) {
      return "1 minute";
    }
    return `${minutes} minutes`;
  }
};

// src/routes/auth.routes.ts
var authRoutes = (0, import_express.Router)();
var WEAK_PASSWORDS = [
  "123456",
  "123456789",
  "qwerty",
  "password",
  "12345678",
  "111111",
  "1234567890",
  "1234567",
  "password1",
  "123123",
  "abc123",
  "qwerty123",
  "1q2w3e4r",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login"
];
var sanitizeEmail = (email) => {
  return email.toLowerCase().replace(/['";\-\-\/\*\\]/g, "").trim();
};
var isStrongPassword = (password) => {
  if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};
var registerSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email format").max(255).transform(sanitizeEmail).refine(
    (email) => !email.includes("--") && !email.includes("/*") && !email.includes("*/"),
    { message: "Invalid email format" }
  ),
  password: import_zod4.z.string().min(8, "Password must be at least 8 characters").max(100).refine(
    (password) => !WEAK_PASSWORDS.includes(password.toLowerCase()),
    { message: "Password is too common. Please choose a stronger password." }
  ).refine(
    isStrongPassword,
    { message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }
  ),
  firstName: import_zod4.z.string().max(100).optional(),
  lastName: import_zod4.z.string().max(100).optional(),
  acceptsMarketing: import_zod4.z.boolean().optional().default(false)
});
var loginSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email format").transform(sanitizeEmail),
  password: import_zod4.z.string().min(1, "Password is required")
});
var forgotPasswordSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email format").max(255).transform(sanitizeEmail)
});
var verifyResetCodeSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email format").transform(sanitizeEmail),
  code: import_zod4.z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only digits")
});
var verifyEmailSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email address").max(255, "Email too long").transform(sanitizeEmail),
  code: import_zod4.z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only digits")
});
var resendVerificationSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email address").max(255, "Email too long").transform(sanitizeEmail)
});
var resetPasswordSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email format").transform(sanitizeEmail),
  code: import_zod4.z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only digits"),
  newPassword: import_zod4.z.string().min(8, "Password must be at least 8 characters").max(100).refine(isStrongPassword, {
    message: "Password must contain uppercase, lowercase, and number"
  }).refine(
    (p) => !WEAK_PASSWORDS.includes(p.toLowerCase()),
    { message: "Password is too common. Please choose a stronger password." }
  )
});
authRoutes.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, acceptsMarketing } = req.body;
      const db2 = getDb();
      const [existing] = await db2.select().from(customers).where(eq(customers.email, email.toLowerCase()));
      if (existing && !existing.isGuest) {
        throw new ConflictError("Email already registered");
      }
      const passwordHash = await import_bcryptjs3.default.hash(password, 12);
      let customer;
      if (existing && existing.isGuest) {
        const [updated] = await db2.update(customers).set({
          firstName,
          lastName,
          isGuest: false,
          acceptsMarketing,
          passwordHash,
          authUserId: `local_${existing.id}`,
          // Local auth
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(customers.id, existing.id)).returning();
        customer = updated;
      } else {
        const [created] = await db2.insert(customers).values({
          email: email.toLowerCase(),
          firstName,
          lastName,
          isGuest: false,
          acceptsMarketing,
          passwordHash,
          authUserId: `local_${Date.now()}`
          // Will be updated after insert
        }).returning();
        customer = created;
        if (customer) {
          await db2.update(customers).set({ authUserId: `local_${customer.id}` }).where(eq(customers.id, customer.id));
        }
      }
      if (!customer) {
        throw new Error("Failed to create or update customer");
      }
      const code = await verificationCodeService.createCode({
        email: customer.email,
        type: "email_verification",
        ipAddress: req.ip,
        expiryMinutes: 15
      });
      const emailSent = await notificationService.sendEmailVerification({
        email: customer.email,
        firstName: customer.firstName,
        code,
        expiryMinutes: 15
      });
      if (!emailSent) {
        logger.error("Failed to send verification email", {
          email: customer.email,
          customerId: customer.id
        });
      }
      logger.info("Customer registered, verification email sent", {
        customerId: customer.id,
        email: customer.email
      });
      await auditLogService.logFromRequest(req, {
        eventType: "account.created" /* ACCOUNT_CREATED */,
        actorType: "customer" /* CUSTOMER */,
        actorId: customer.id,
        actorEmail: customer.email,
        action: "account_registration",
        status: "success" /* SUCCESS */,
        metadata: {
          registrationType: existing && existing.isGuest ? "guest_conversion" : "new",
          emailVerified: false
        }
      });
      await auditLogService.logFromRequest(req, {
        eventType: "email.verification.sent" /* EMAIL_VERIFICATION_SENT */,
        actorType: "system" /* SYSTEM */,
        targetType: "customer",
        targetId: customer.id,
        action: "send_verification_email",
        status: "success" /* SUCCESS */,
        metadata: {
          email: customer.email,
          expiryMinutes: 15
        }
      });
      sendSuccess(res, {
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: customer.authUserId,
          email: customer.email,
          emailVerified: false,
          firstName: customer.firstName,
          lastName: customer.lastName
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase();
      const db2 = getDb();
      const deviceInfo = {
        ipAddress: req.ip || req.socket.remoteAddress || "",
        userAgent: req.headers["user-agent"]
      };
      const lockoutStatus = await LoginAttemptService.checkLockoutStatus(normalizedEmail);
      if (lockoutStatus.isLocked) {
        const remainingTime = LoginAttemptService.formatRemainingTime(
          lockoutStatus.remainingTime || 0
        );
        logger.warn("Login blocked: Account locked", {
          email: normalizedEmail,
          remainingTime
        });
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.locked" /* AUTH_LOGIN_LOCKED */,
          actorType: "customer" /* CUSTOMER */,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "denied" /* DENIED */,
          metadata: {
            reason: "account_locked",
            remainingTime: lockoutStatus.remainingTime,
            lockoutEndTime: lockoutStatus.lockoutEndTime?.toISOString()
          }
        });
        return sendError(
          res,
          403,
          "ACCOUNT_LOCKED",
          `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingTime}.`
        );
      }
      const [customer] = await db2.select().from(customers).where(eq(customers.email, normalizedEmail));
      if (!customer || customer.isGuest) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          null,
          "invalid_credentials",
          deviceInfo
        );
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.failure" /* AUTH_LOGIN_FAILURE */,
          actorType: "customer" /* CUSTOMER */,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "failure" /* FAILURE */,
          metadata: { reason: "invalid_credentials" }
        });
        throw new UnauthorizedError("Invalid email or password");
      }
      if (!customer.passwordHash) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          "invalid_credentials",
          deviceInfo
        );
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.failure" /* AUTH_LOGIN_FAILURE */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "failure" /* FAILURE */,
          metadata: { reason: "no_password_hash" }
        });
        throw new UnauthorizedError("Invalid email or password");
      }
      const isPasswordValid = await import_bcryptjs3.default.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          "invalid_credentials",
          deviceInfo
        );
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.failure" /* AUTH_LOGIN_FAILURE */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "failure" /* FAILURE */,
          metadata: { reason: "invalid_password" }
        });
        throw new UnauthorizedError("Invalid email or password");
      }
      if (!customer.emailVerified) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          "email_unverified",
          deviceInfo
        );
        logger.info("Login blocked: Email not verified", {
          email: customer.email,
          customerId: customer.id
        });
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.failure" /* AUTH_LOGIN_FAILURE */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "denied" /* DENIED */,
          metadata: { reason: "email_unverified" }
        });
        return sendError(
          res,
          403,
          "EMAIL_NOT_VERIFIED",
          "Email not verified. Please check your inbox for the verification code."
        );
      }
      if (!customer.isActive) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          "account_disabled",
          deviceInfo
        );
        logger.warn("Login blocked: Account disabled", {
          email: customer.email,
          customerId: customer.id
        });
        await auditLogService.logFromRequest(req, {
          eventType: "auth.login.failure" /* AUTH_LOGIN_FAILURE */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: "login_attempt",
          status: "denied" /* DENIED */,
          metadata: { reason: "account_disabled" }
        });
        throw new UnauthorizedError("Account is disabled. Please contact support.");
      }
      await LoginAttemptService.recordAttempt(
        normalizedEmail,
        true,
        customer.id,
        null,
        deviceInfo
      );
      await LoginAttemptService.clearFailedAttempts(normalizedEmail);
      const guestSessionId = req.sessionId || req.headers["x-session-id"];
      if (guestSessionId) {
        const mergedItems = await cartService.mergeSessionCart(guestSessionId, customer.id);
        logger.info("Session cart merged on login", {
          customerId: customer.id,
          guestSessionId,
          itemsMerged: mergedItems
        });
      }
      const sessionId = await sessionService.createSession({
        customerId: customer.id,
        userAgent: req.headers["user-agent"] || "",
        ipAddress: req.ip || req.socket.remoteAddress || ""
      });
      const token = generateToken({
        userId: customer.authUserId,
        email: customer.email,
        role: customer.role || "customer",
        customerId: customer.id,
        sessionId
      });
      await sessionService.setTokenHash(sessionId, token);
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
        domain: process.env["NODE_ENV"] === "production" ? ".lab404electronics.com" : void 0,
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      await auditLogService.logFromRequest(req, {
        eventType: "auth.login.success" /* AUTH_LOGIN_SUCCESS */,
        actorType: "customer" /* CUSTOMER */,
        actorId: customer.id,
        actorEmail: customer.email,
        action: "login",
        status: "success" /* SUCCESS */,
        metadata: {
          sessionId,
          deviceType: deviceInfo.userAgent
        }
      });
      logger.info("Login successful", {
        email: customer.email,
        customerId: customer.id,
        sessionId
      });
      sendSuccess(res, {
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: customer.role || "customer",
          customerId: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName
        },
        token,
        expiresAt: getTokenExpiration().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const db2 = getDb();
    if (req.user?.role === "admin") {
      sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: "admin",
        isAdmin: true
      });
      return;
    }
    if (!req.user?.customerId) {
      throw new NotFoundError("Customer not found");
    }
    const [customer] = await db2.select().from(customers).where(eq(customers.id, req.user.customerId));
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    sendSuccess(res, {
      id: customer.authUserId,
      email: customer.email,
      role: req.user.role,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName
    });
  } catch (error) {
    next(error);
  }
});
authRoutes.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.user?.sessionId;
    if (sessionId) {
      await sessionService.revokeSession(sessionId, "user_action");
      logger.info("Session revoked on logout", {
        sessionId,
        customerId: req.user?.customerId
      });
    }
    await auditLogService.logFromRequest(req, {
      eventType: "auth.logout" /* AUTH_LOGOUT */,
      actorType: "customer" /* CUSTOMER */,
      actorId: req.user?.customerId,
      actorEmail: req.user?.email,
      action: "logout",
      status: "success" /* SUCCESS */,
      metadata: {
        sessionId
      }
    });
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
      domain: process.env["NODE_ENV"] === "production" ? ".lab404electronics.com" : void 0,
      path: "/"
    });
    sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});
authRoutes.post(
  "/admin/login",
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const db2 = getDb();
      const [customer] = await db2.select().from(customers).where(eq(customers.email, email.toLowerCase()));
      if (!customer || customer.isGuest) {
        throw new UnauthorizedError("Invalid email or password");
      }
      if (!customer.passwordHash) {
        throw new UnauthorizedError("Invalid email or password");
      }
      const isPasswordValid = await import_bcryptjs3.default.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
      }
      if (customer.role !== "admin") {
        throw new UnauthorizedError("Access denied. Admin privileges required.");
      }
      if (!customer.isActive) {
        throw new UnauthorizedError("Account is disabled. Please contact support.");
      }
      if (!customer.emailVerified) {
        throw new UnauthorizedError("Email not verified. Please verify your email address.");
      }
      const sessionId = await sessionService.createSession({
        customerId: customer.id,
        userAgent: req.headers["user-agent"] || "",
        ipAddress: req.ip || req.socket.remoteAddress || ""
      });
      const token = generateToken({
        userId: customer.authUserId,
        email: customer.email,
        role: "admin",
        customerId: customer.id,
        sessionId
      });
      await sessionService.setTokenHash(sessionId, token);
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
        domain: process.env["NODE_ENV"] === "production" ? ".lab404electronics.com" : void 0,
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      sendSuccess(res, {
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: "admin",
          customerId: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName
        },
        token,
        expiresAt: getTokenExpiration().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/forgot-password",
  verificationLimiter,
  xssSanitize,
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const db2 = getDb();
      const [customer] = await db2.select().from(customers).where(eq(customers.email, email.toLowerCase())).limit(1);
      if (customer && customer.isActive && !customer.isGuest && customer.passwordHash) {
        const code = await verificationCodeService.createCode({
          email: customer.email,
          type: "password_reset",
          ipAddress: req.ip,
          expiryMinutes: 15
        });
        const emailSent = await notificationService.sendVerificationCode({
          email: customer.email,
          code,
          type: "password_reset",
          expiryMinutes: 15
        });
        if (!emailSent) {
          logger.error("Failed to send password reset email", {
            email: customer.email,
            code
          });
        }
        logger.info("Password reset code sent", {
          email: customer.email,
          ip: req.ip
        });
        await auditLogService.logFromRequest(req, {
          eventType: "password.reset.requested" /* PASSWORD_RESET_REQUESTED */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customer.id,
          actorEmail: customer.email,
          action: "password_reset_request",
          status: "success" /* SUCCESS */,
          metadata: {
            method: "email_code",
            expiryMinutes: 15
          }
        });
      } else {
        const reason = !customer ? "not_found" : !customer.isActive ? "inactive" : customer.isGuest ? "guest" : !customer.passwordHash ? "no_password" : "unknown";
        logger.warn("Password reset attempt for invalid account", {
          email,
          reason,
          ip: req.ip
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      sendSuccess(res, {
        message: "If an account exists with this email, a verification code has been sent."
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/verify-reset-code",
  verificationLimiter,
  xssSanitize,
  validateBody(verifyResetCodeSchema),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const db2 = getDb();
      const now = /* @__PURE__ */ new Date();
      const [record] = await db2.select().from(verificationCodes).where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, "password_reset"),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, now)
        )
      ).orderBy(desc(verificationCodes.createdAt)).limit(1);
      if (!record) {
        logger.warn("Verification code not found or expired", { email, type: "password_reset" });
        throw new BadRequestError("Invalid or expired verification code");
      }
      if (record.attempts >= record.maxAttempts) {
        logger.warn("Max verification attempts exceeded", { email, type: "password_reset", attempts: record.attempts });
        throw new BadRequestError("Maximum verification attempts exceeded. Please request a new code.");
      }
      await db2.update(verificationCodes).set({ attempts: record.attempts + 1 }).where(eq(verificationCodes.id, record.id));
      if (record.code !== code) {
        logger.warn("Invalid verification code attempt", { email, type: "password_reset", attempts: record.attempts + 1 });
        throw new BadRequestError("Invalid verification code");
      }
      logger.info("Password reset code verified", {
        email: email.toLowerCase()
      });
      sendSuccess(res, {
        valid: true
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/reset-password",
  authLimiter,
  xssSanitize,
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { email, code, newPassword } = req.body;
      const normalizedEmail = email.toLowerCase();
      const db2 = getDb();
      const isValid = await verificationCodeService.validateCodeWithoutMarking({
        email: normalizedEmail,
        code,
        type: "password_reset"
      });
      if (!isValid) {
        throw new BadRequestError("Invalid or expired verification code");
      }
      const [customer] = await db2.select().from(customers).where(eq(customers.email, normalizedEmail)).limit(1);
      if (!customer) {
        logger.error("Customer not found after valid code validation", {
          email: normalizedEmail
        });
        throw new BadRequestError("Invalid verification code");
      }
      if (!customer.isActive) {
        logger.warn("Password reset attempt for inactive account", {
          customerId: customer.id
        });
        throw new BadRequestError("Account is inactive");
      }
      if (customer.isGuest) {
        logger.warn("Password reset attempt for guest account", {
          customerId: customer.id
        });
        throw new BadRequestError("Invalid account type");
      }
      const userInputs = [customer.email, customer.firstName, customer.lastName].filter(Boolean);
      const validation = await PasswordSecurityService.validatePassword(
        newPassword,
        customer.id,
        userInputs
      );
      if (!validation.isValid) {
        logger.warn("Password reset rejected due to security checks", {
          customerId: customer.id,
          errors: validation.errors
        });
        const errorMessage = validation.errors.join(". ") + " You can try again with a different password using the same verification code.";
        throw new BadRequestError(errorMessage);
      }
      const passwordHash = await import_bcryptjs3.default.hash(newPassword, 12);
      await db2.update(customers).set({
        passwordHash,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, customer.id));
      await PasswordSecurityService.recordPasswordChange({
        customerId: customer.id,
        passwordHash,
        changeReason: "password_reset",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
      await verificationCodeService.markCodeAsUsed(normalizedEmail, "password_reset");
      await auditLogService.logFromRequest(req, {
        eventType: "password.reset.completed" /* PASSWORD_RESET_COMPLETED */,
        actorType: "customer" /* CUSTOMER */,
        actorId: customer.id,
        actorEmail: customer.email,
        action: "password_reset_complete",
        status: "success" /* SUCCESS */,
        metadata: {
          method: "email_code",
          strengthScore: validation.strengthResult?.score
        }
      });
      await verificationCodeService.invalidateCodes(
        normalizedEmail,
        "password_reset"
      );
      const emailSent = await notificationService.sendPasswordChangedConfirmation({
        email: customer.email,
        firstName: customer.firstName,
        timestamp: /* @__PURE__ */ new Date(),
        ipAddress: req.ip
      });
      if (!emailSent) {
        logger.error("Failed to send password changed email", {
          email: customer.email,
          customerId: customer.id
        });
      }
      const token = generateToken({
        userId: customer.authUserId,
        email: customer.email,
        role: "customer",
        customerId: customer.id
      });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
        domain: process.env["NODE_ENV"] === "production" ? ".lab404electronics.com" : void 0,
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      logger.info("Password reset successful", {
        customerId: customer.id,
        email: customer.email
      });
      sendSuccess(res, {
        message: "Password reset successfully",
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: "customer",
          customerId: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName
        },
        token,
        expiresAt: getTokenExpiration().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/verify-email",
  verificationLimiter,
  xssSanitize,
  validateBody(verifyEmailSchema),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const db2 = getDb();
      const isValid = await verificationCodeService.validateCode({
        email: normalizedEmail,
        code,
        type: "email_verification"
      });
      if (!isValid) {
        return sendError(res, 400, "INVALID_CODE", "Invalid or expired verification code.");
      }
      const [customer] = await db2.select().from(customers).where(eq(customers.email, normalizedEmail)).limit(1);
      if (!customer || customer.isGuest) {
        return sendError(res, 400, "INVALID_CODE", "Invalid verification code.");
      }
      if (customer.emailVerified) {
        return sendError(res, 400, "ALREADY_VERIFIED", "Email already verified.");
      }
      await db2.update(customers).set({
        emailVerified: true,
        emailVerifiedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, customer.id));
      await verificationCodeService.invalidateCodes(
        normalizedEmail,
        "email_verification"
      );
      logger.info("Email verified successfully", {
        email: customer.email,
        customerId: customer.id
      });
      await auditLogService.logFromRequest(req, {
        eventType: "account.verified" /* ACCOUNT_VERIFIED */,
        actorType: "customer" /* CUSTOMER */,
        actorId: customer.id,
        actorEmail: customer.email,
        action: "email_verification",
        status: "success" /* SUCCESS */,
        metadata: {
          verificationMethod: "email_code",
          verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      const token = generateToken({
        userId: customer.authUserId,
        email: customer.email,
        role: "customer",
        customerId: customer.id
      });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      const user = {
        id: customer.authUserId,
        email: customer.email,
        emailVerified: true,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        role: "customer",
        customerId: customer.id
      };
      sendSuccess(res, {
        message: "Email verified successfully",
        user,
        token,
        expiresAt: getTokenExpiration().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
authRoutes.post(
  "/resend-verification",
  verificationLimiter,
  xssSanitize,
  validateBody(resendVerificationSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const db2 = getDb();
      const [customer] = await db2.select().from(customers).where(eq(customers.email, normalizedEmail)).limit(1);
      if (customer && !customer.isGuest && !customer.emailVerified) {
        await verificationCodeService.invalidateCodes(
          normalizedEmail,
          "email_verification"
        );
        const code = await verificationCodeService.createCode({
          email: customer.email,
          type: "email_verification",
          ipAddress: req.ip,
          expiryMinutes: 15
        });
        const emailSent = await notificationService.sendEmailVerification({
          email: customer.email,
          firstName: customer.firstName,
          code,
          expiryMinutes: 15
        });
        if (!emailSent) {
          logger.error("Failed to send verification email", {
            email: customer.email,
            customerId: customer.id
          });
        } else {
          logger.info("Verification email resent", {
            email: customer.email,
            customerId: customer.id
          });
        }
      }
      sendSuccess(res, {
        message: "If an unverified account exists, a verification code has been sent."
      });
    } catch (error) {
      next(error);
    }
  }
);
var passwordCheckSchema = import_zod4.z.object({
  password: import_zod4.z.string().min(1),
  email: import_zod4.z.string().email().optional(),
  customerId: import_zod4.z.string().uuid().optional()
});
authRoutes.post(
  "/password/check",
  authLimiter,
  validateBody(passwordCheckSchema),
  async (req, res, next) => {
    try {
      const { password, email, customerId } = req.body;
      const userInputs = [];
      if (email) {
        userInputs.push(email);
        const emailParts = email.split("@");
        userInputs.push(emailParts[0]);
      }
      let result;
      if (customerId) {
        const validation = await PasswordSecurityService.validatePassword(
          password,
          customerId,
          userInputs
        );
        result = validation.strengthResult;
      } else {
        const validation = await PasswordSecurityService.validateNewPassword(
          password,
          userInputs
        );
        result = validation.strengthResult;
      }
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/sessions.routes.ts
var import_express2 = require("express");
var sessionsRoutes = (0, import_express2.Router)();
sessionsRoutes.get(
  "/",
  requireAuth,
  async (req, res, next) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;
      if (!customerId) {
        return sendError(res, 400, "BAD_REQUEST", "Customer ID not found");
      }
      const sessions2 = await sessionService.getActiveSessions(customerId);
      const sessionsWithCurrent = sessions2.map((session) => ({
        ...session,
        isCurrent: session.id === currentSessionId
      }));
      sendSuccess(res, {
        sessions: sessionsWithCurrent,
        currentSessionId
      });
    } catch (error) {
      next(error);
    }
  }
);
sessionsRoutes.delete(
  "/:sessionId",
  requireAuth,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const customerId = req.user?.customerId;
      if (!customerId) {
        return sendError(res, 400, "BAD_REQUEST", "Customer ID not found");
      }
      const sessions2 = await sessionService.getActiveSessions(customerId);
      const session = sessions2.find((s) => s.id === sessionId);
      if (!session) {
        return sendError(res, 404, "NOT_FOUND", "Session not found or already revoked");
      }
      await sessionService.revokeSession(sessionId, "user_action");
      logger.info("Session revoked via API", {
        sessionId,
        customerId,
        deviceName: session.deviceName
      });
      sendSuccess(res, { message: "Session revoked successfully" });
    } catch (error) {
      next(error);
    }
  }
);
sessionsRoutes.post(
  "/logout-others",
  requireAuth,
  async (req, res, next) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;
      if (!customerId || !currentSessionId) {
        return sendError(res, 400, "BAD_REQUEST", "Session information not found");
      }
      const count2 = await sessionService.revokeOtherSessions(customerId, currentSessionId);
      logger.info("Other sessions revoked", { customerId, count: count2 });
      sendSuccess(res, {
        message: `${count2} session(s) logged out successfully`,
        count: count2
      });
    } catch (error) {
      next(error);
    }
  }
);
sessionsRoutes.post(
  "/logout-all",
  requireAuth,
  async (req, res, next) => {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        return sendError(res, 400, "BAD_REQUEST", "Customer ID not found");
      }
      const count2 = await sessionService.revokeAllSessions(customerId);
      res.clearCookie("auth_token");
      logger.info("All sessions revoked", { customerId, count: count2 });
      sendSuccess(res, {
        message: `All ${count2} session(s) logged out successfully`,
        count: count2
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/products.routes.ts
var import_express3 = require("express");
var import_zod5 = require("zod");
var productsRoutes = (0, import_express3.Router)();
var productFiltersSchema = import_zod5.z.object({
  page: import_zod5.z.string().optional(),
  limit: import_zod5.z.string().optional(),
  search: import_zod5.z.string().optional(),
  categoryId: import_zod5.z.string().uuid().optional(),
  categorySlug: import_zod5.z.string().optional(),
  category: import_zod5.z.string().optional(),
  // Alias for categorySlug
  brand: import_zod5.z.string().optional(),
  status: import_zod5.z.enum(["draft", "active", "archived"]).optional(),
  isFeatured: import_zod5.z.enum(["true", "false"]).optional(),
  minPrice: import_zod5.z.string().optional(),
  maxPrice: import_zod5.z.string().optional(),
  inStock: import_zod5.z.enum(["true", "false"]).optional(),
  sortBy: import_zod5.z.enum(["name", "basePrice", "createdAt", "stockQuantity"]).optional(),
  sortOrder: import_zod5.z.enum(["asc", "desc"]).optional()
});
var createProductSchema = import_zod5.z.object({
  // Basic info
  sku: import_zod5.z.string().min(1).max(100).optional(),
  barcode: import_zod5.z.string().max(100).optional(),
  name: import_zod5.z.string().min(1).max(255),
  slug: import_zod5.z.string().max(255).optional(),
  description: import_zod5.z.string().optional(),
  shortDescription: import_zod5.z.string().max(500).optional(),
  categoryId: import_zod5.z.string().uuid().optional().nullable(),
  brand: import_zod5.z.string().max(255).optional(),
  // Pricing
  basePrice: import_zod5.z.number().positive().max(999999.99),
  costPrice: import_zod5.z.number().positive().max(999999.99).optional().nullable(),
  compareAtPrice: import_zod5.z.number().positive().max(999999.99).optional().nullable(),
  // Physical attributes
  weight: import_zod5.z.number().positive().optional().nullable(),
  dimensions: import_zod5.z.object({
    width: import_zod5.z.number().positive().optional(),
    height: import_zod5.z.number().positive().optional(),
    depth: import_zod5.z.number().positive().optional()
  }).optional().nullable(),
  // Inventory
  stockQuantity: import_zod5.z.number().int().min(0).optional().default(0),
  lowStockThreshold: import_zod5.z.number().int().min(0).optional().default(5),
  trackInventory: import_zod5.z.boolean().optional().default(true),
  allowBackorder: import_zod5.z.boolean().optional().default(false),
  // Media
  images: import_zod5.z.array(import_zod5.z.object({
    url: import_zod5.z.string().url(),
    alt: import_zod5.z.string().optional(),
    width: import_zod5.z.number().optional(),
    height: import_zod5.z.number().optional()
  })).optional().default([]),
  videos: import_zod5.z.array(import_zod5.z.object({
    url: import_zod5.z.string().url(),
    title: import_zod5.z.string().optional()
  })).optional().default([]),
  thumbnailUrl: import_zod5.z.string().url().optional().nullable(),
  // Organization & categorization
  tags: import_zod5.z.array(import_zod5.z.string()).max(20).optional().default([]),
  specifications: import_zod5.z.record(import_zod5.z.string()).optional().default({}),
  features: import_zod5.z.array(import_zod5.z.string()).max(20).optional().default([]),
  // SEO
  metaTitle: import_zod5.z.string().max(255).optional(),
  metaDescription: import_zod5.z.string().max(500).optional(),
  // Status & flags
  status: import_zod5.z.enum(["draft", "active", "archived"]).optional().default("draft"),
  isFeatured: import_zod5.z.boolean().optional().default(false),
  isDigital: import_zod5.z.boolean().optional().default(false),
  requiresShipping: import_zod5.z.boolean().optional().default(true),
  // Supplier
  supplierId: import_zod5.z.string().max(255).optional(),
  supplierSku: import_zod5.z.string().max(255).optional(),
  // Import
  importedFrom: import_zod5.z.string().max(255).optional(),
  externalUrl: import_zod5.z.string().url().max(500).optional()
});
var updateProductSchema = createProductSchema.partial();
productsRoutes.get("/", validateQuery(productFiltersSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query);
    const filters = req.query;
    const conditions = [];
    conditions.push(eq(products.status, "active"));
    const search = filters["search"];
    const categoryId = filters["categoryId"];
    const categorySlug = filters["categorySlug"] || filters["category"];
    const brand = filters["brand"];
    const minPrice = filters["minPrice"];
    const maxPrice = filters["maxPrice"];
    const inStock = filters["inStock"];
    const isFeatured = filters["isFeatured"];
    const sortBy = filters["sortBy"] || "createdAt";
    const sortOrder = filters["sortOrder"] || "desc";
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (categorySlug) {
      const [cat] = await db2.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug));
      if (cat) {
        conditions.push(eq(products.categoryId, cat.id));
      }
    }
    if (brand) {
      conditions.push(eq(products.brand, brand));
    }
    if (minPrice) {
      conditions.push(gte(products.basePrice, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(products.basePrice, maxPrice));
    }
    if (inStock === "true") {
      conditions.push(
        or(
          sql`${products.stockQuantity} > 0`,
          eq(products.allowBackorder, true)
        )
      );
    }
    if (isFeatured === "true") {
      conditions.push(eq(products.isFeatured, true));
    }
    const countResult = await db2.select({ count: sql`count(*)` }).from(products).where(and(...conditions));
    const count2 = countResult[0]?.count ?? 0;
    const sortColumnMap = {
      name: products.name,
      basePrice: products.basePrice,
      createdAt: products.createdAt,
      stockQuantity: products.stockQuantity
    };
    const sortColumn = sortColumnMap[sortBy] || products.createdAt;
    const productList = await db2.select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      slug: products.slug,
      thumbnailUrl: products.thumbnailUrl,
      images: products.images,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      lowStockThreshold: products.lowStockThreshold,
      status: products.status,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug
    }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions)).orderBy(sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)).limit(limit).offset(offset);
    const productsWithStock = productList.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : void 0,
      images: p.images || [],
      inStock: p.stockQuantity > 0,
      category: p.categoryId && p.categoryName ? {
        id: p.categoryId,
        name: p.categoryName,
        slug: p.categorySlug
      } : null
    }));
    sendSuccess(res, productsWithStock, 200, createPaginationMeta(page, limit, Number(count2)));
  } catch (error) {
    next(error);
  }
});
productsRoutes.get("/featured", async (req, res, next) => {
  try {
    const db2 = getDb();
    const limit = Math.min(20, parseInt(req.query["limit"] || "8", 10));
    const productList = await db2.select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      slug: products.slug,
      thumbnailUrl: products.thumbnailUrl,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity
    }).from(products).where(and(eq(products.status, "active"), eq(products.isFeatured, true))).orderBy(desc(products.createdAt)).limit(limit);
    const productsWithStock = productList.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : void 0,
      inStock: p.stockQuantity > 0
    }));
    sendSuccess(res, productsWithStock);
  } catch (error) {
    next(error);
  }
});
productsRoutes.get("/:productId/variants", async (req, res, next) => {
  try {
    const db2 = getDb();
    const productId = req.params["productId"];
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return next();
    }
    const [product] = await db2.select({ id: products.id, name: products.name }).from(products).where(eq(products.id, productId));
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    const variants = await db2.select().from(productVariants).where(and(
      eq(productVariants.productId, productId),
      eq(productVariants.isActive, true)
    )).orderBy(asc(productVariants.name));
    sendSuccess(res, variants.map((v) => ({
      ...v,
      basePrice: Number(v.basePrice)
    })));
  } catch (error) {
    next(error);
  }
});
productsRoutes.get("/:slug", async (req, res, next) => {
  try {
    const db2 = getDb();
    const slug = req.params["slug"];
    const [product] = await db2.select().from(products).where(eq(products.slug, slug));
    if (!product || product.status !== "active") {
      throw new NotFoundError("Product not found");
    }
    let category;
    if (product.categoryId) {
      [category] = await db2.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.id, product.categoryId));
    }
    sendSuccess(res, {
      ...product,
      basePrice: Number(product.basePrice),
      costPrice: product.costPrice ? Number(product.costPrice) : void 0,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : void 0,
      inStock: product.stockQuantity > 0 || product.allowBackorder,
      category
    });
  } catch (error) {
    next(error);
  }
});
productsRoutes.get("/admin/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [product] = await db2.select().from(products).where(eq(products.id, id));
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    let category;
    if (product.categoryId) {
      [category] = await db2.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.id, product.categoryId));
    }
    sendSuccess(res, {
      ...product,
      basePrice: Number(product.basePrice),
      costPrice: product.costPrice ? Number(product.costPrice) : void 0,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : void 0,
      weight: product.weight ? Number(product.weight) : void 0,
      inStock: product.stockQuantity > 0 || product.allowBackorder,
      category
    });
  } catch (error) {
    next(error);
  }
});
productsRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createProductSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      const sku = data.sku || generateSku();
      const [existingSku] = await db2.select({ id: products.id }).from(products).where(eq(products.sku, sku));
      if (existingSku) {
        throw new ConflictError("SKU already exists");
      }
      let slug = data.slug || generateSlug(data.name);
      const [existingSlug] = await db2.select({ id: products.id }).from(products).where(eq(products.slug, slug));
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      const insertResult = await db2.insert(products).values({
        ...data,
        sku,
        slug,
        basePrice: String(data.basePrice),
        costPrice: data.costPrice ? String(data.costPrice) : null,
        compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
        weight: data.weight ? String(data.weight) : null,
        categoryId: data.categoryId || null,
        thumbnailUrl: data.thumbnailUrl || null
      }).returning();
      const product = insertResult[0];
      if (!product) {
        throw new Error("Failed to create product");
      }
      try {
        if (await searchService.isAvailable()) {
          let categoryName = "";
          let categorySlugValue = "";
          if (product.categoryId) {
            const [cat] = await db2.select({ name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.id, product.categoryId));
            if (cat) {
              categoryName = cat.name;
              categorySlugValue = cat.slug;
            }
          }
          await searchService.indexProduct({
            id: product.id,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription,
            brand: product.brand,
            categoryId: product.categoryId,
            categoryName,
            categorySlug: categorySlugValue,
            basePrice: Number(product.basePrice),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            stockQuantity: product.stockQuantity,
            inStock: product.stockQuantity > 0 || product.allowBackorder,
            isFeatured: product.isFeatured,
            tags: product.tags || [],
            thumbnailUrl: product.thumbnailUrl,
            images: product.images || [],
            createdAt: new Date(product.createdAt).getTime(),
            updatedAt: new Date(product.updatedAt).getTime()
          });
        }
      } catch (e) {
        logger.error("Failed to index product in search", { error: e, productId: product.id });
      }
      sendCreated(res, {
        ...product,
        basePrice: Number(product.basePrice),
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        weight: product.weight ? Number(product.weight) : null
      });
    } catch (error) {
      next(error);
    }
  }
);
productsRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateProductSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(products).where(eq(products.id, id));
      if (!existing) {
        throw new NotFoundError("Product not found");
      }
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data.basePrice !== void 0) {
        updateData["basePrice"] = String(data.basePrice);
      }
      if (data.costPrice !== void 0) {
        updateData["costPrice"] = data.costPrice ? String(data.costPrice) : null;
      }
      if (data.compareAtPrice !== void 0) {
        updateData["compareAtPrice"] = data.compareAtPrice ? String(data.compareAtPrice) : null;
      }
      if (data.weight !== void 0) {
        updateData["weight"] = data.weight ? String(data.weight) : null;
      }
      if (data.categoryId !== void 0) {
        updateData["categoryId"] = data.categoryId || null;
      }
      if (data.thumbnailUrl !== void 0) {
        updateData["thumbnailUrl"] = data.thumbnailUrl || null;
      }
      const updateResult = await db2.update(products).set(updateData).where(eq(products.id, id)).returning();
      const product = updateResult[0];
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      try {
        if (await searchService.isAvailable()) {
          let categoryName = "";
          let categorySlugValue = "";
          if (product.categoryId) {
            const [cat] = await db2.select({ name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.id, product.categoryId));
            if (cat) {
              categoryName = cat.name;
              categorySlugValue = cat.slug;
            }
          }
          await searchService.updateProduct({
            id: product.id,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription,
            brand: product.brand,
            categoryId: product.categoryId,
            categoryName,
            categorySlug: categorySlugValue,
            basePrice: Number(product.basePrice),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            stockQuantity: product.stockQuantity,
            inStock: product.stockQuantity > 0 || product.allowBackorder,
            isFeatured: product.isFeatured,
            tags: product.tags || [],
            thumbnailUrl: product.thumbnailUrl,
            images: product.images || [],
            createdAt: new Date(product.createdAt).getTime(),
            updatedAt: new Date(product.updatedAt).getTime()
          });
        }
      } catch (e) {
        logger.error("Failed to update product in search", { error: e, productId: product.id });
      }
      sendSuccess(res, {
        ...product,
        basePrice: Number(product.basePrice),
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        weight: product.weight ? Number(product.weight) : null
      });
    } catch (error) {
      next(error);
    }
  }
);
productsRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: products.id }).from(products).where(eq(products.id, id));
    if (!existing) {
      throw new NotFoundError("Product not found");
    }
    await db2.delete(products).where(eq(products.id, id));
    try {
      if (await searchService.isAvailable()) {
        await searchService.removeProduct(id);
      }
    } catch (e) {
      logger.error("Failed to remove product from search", { error: e, productId: id });
    }
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// src/routes/categories.routes.ts
var import_express4 = require("express");
var import_zod6 = require("zod");
var categoriesRoutes = (0, import_express4.Router)();
var createCategorySchema = import_zod6.z.object({
  name: import_zod6.z.string().min(1).max(255),
  slug: import_zod6.z.string().max(255).optional(),
  description: import_zod6.z.string().optional(),
  imageUrl: import_zod6.z.string().url().optional(),
  parentId: import_zod6.z.string().uuid().optional(),
  isActive: import_zod6.z.boolean().optional().default(true),
  sortOrder: import_zod6.z.number().int().min(0).optional().default(0)
});
var updateCategorySchema = createCategorySchema.partial();
categoriesRoutes.get("/", async (_req, res, next) => {
  try {
    const db2 = getDb();
    const categoryList = await db2.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
    const rootCategories = categoryList.filter((c) => !c.parentId);
    const categoryMap = new Map(categoryList.map((c) => [c.id, { ...c, children: [] }]));
    for (const category of categoryList) {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      }
    }
    const hierarchicalCategories = rootCategories.map((c) => categoryMap.get(c.id));
    sendSuccess(res, hierarchicalCategories);
  } catch (error) {
    next(error);
  }
});
categoriesRoutes.get("/:slug", async (req, res, next) => {
  try {
    const db2 = getDb();
    const slug = req.params["slug"];
    const categoryResult = await db2.select().from(categories).where(eq(categories.slug, slug));
    const category = categoryResult[0];
    if (!category || !category.isActive) {
      throw new NotFoundError("Category not found");
    }
    const countResult = await db2.select({ count: sql`count(*)` }).from(products).where(eq(products.categoryId, category.id));
    const count2 = countResult[0]?.count ?? 0;
    const subcategories = await db2.select().from(categories).where(eq(categories.parentId, category.id));
    sendSuccess(res, {
      ...category,
      productCount: Number(count2),
      children: subcategories
    });
  } catch (error) {
    next(error);
  }
});
categoriesRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createCategorySchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      let slug = data.slug || generateSlug(data.name);
      const existingSlugResult = await db2.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
      const existingSlug = existingSlugResult[0];
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      const categoryResult = await db2.insert(categories).values({
        ...data,
        slug
      }).returning();
      const category = categoryResult[0];
      sendCreated(res, category);
    } catch (error) {
      next(error);
    }
  }
);
categoriesRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateCategorySchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const existingResult = await db2.select().from(categories).where(eq(categories.id, id));
      const existing = existingResult[0];
      if (!existing) {
        throw new NotFoundError("Category not found");
      }
      const categoryResult = await db2.update(categories).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(categories.id, id)).returning();
      const category = categoryResult[0];
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }
);
categoriesRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const existingResult = await db2.select({ id: categories.id }).from(categories).where(eq(categories.id, id));
    const existing = existingResult[0];
    if (!existing) {
      throw new NotFoundError("Category not found");
    }
    await db2.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
    await db2.update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
    await db2.delete(categories).where(eq(categories.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// src/routes/cart.routes.ts
var import_express5 = require("express");
var import_zod7 = require("zod");
var import_uuid5 = require("uuid");
var cartRoutes = (0, import_express5.Router)();
cartRoutes.use(optionalAuth);
var addToCartSchema = import_zod7.z.object({
  productId: import_zod7.z.string().uuid(),
  variantId: import_zod7.z.string().uuid().optional(),
  quantity: import_zod7.z.preprocess(
    (val) => typeof val === "string" ? parseInt(val, 10) : val,
    import_zod7.z.number().int("Quantity must be a whole number").positive("Quantity must be positive").min(1, "Quantity must be at least 1").max(9999, "Quantity cannot exceed 9999")
  )
});
var updateCartItemSchema = import_zod7.z.object({
  quantity: import_zod7.z.preprocess(
    (val) => typeof val === "string" ? parseInt(val, 10) : val,
    import_zod7.z.number().int("Quantity must be a whole number").positive("Quantity must be positive").min(1, "Quantity must be at least 1").max(9999, "Quantity cannot exceed 9999")
  )
});
var applyPromoSchema = import_zod7.z.object({
  code: import_zod7.z.string().min(1).max(50)
});
async function getOrCreateCart(userId, sessionId) {
  const db2 = getDb();
  let cart;
  if (userId) {
    const [existing] = await db2.select().from(carts).where(eq(carts.customerId, userId));
    cart = existing;
  } else if (sessionId) {
    const [existing] = await db2.select().from(carts).where(eq(carts.sessionId, sessionId));
    cart = existing;
  }
  if (!cart) {
    const newSessionId = sessionId || (0, import_uuid5.v4)();
    const [created] = await db2.insert(carts).values({
      customerId: userId,
      sessionId: userId ? void 0 : newSessionId
    }).returning();
    if (!created) {
      throw new Error("Failed to create cart");
    }
    cart = created;
  }
  return cart;
}
async function getCartItems(cartId) {
  const db2 = getDb();
  return db2.select().from(cartItems).where(eq(cartItems.cartId, cartId));
}
cartRoutes.get("/", async (req, res, next) => {
  try {
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      return sendSuccess(res, {
        id: null,
        items: [],
        itemCount: 0
      });
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);
    sendSuccess(res, {
      id: cart.id,
      sessionId: cart.sessionId,
      items,
      itemCount: items.reduce((sum2, item) => sum2 + item.quantity, 0)
    });
  } catch (error) {
    next(error);
  }
});
cartRoutes.get("/calculate", async (req, res, next) => {
  try {
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      return sendSuccess(res, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        taxRate: 0,
        // Tax rate will be applied when items are added
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: "USD"
      });
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);
    if (items.length === 0) {
      return sendSuccess(res, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        taxRate: 0,
        // Tax rate will be applied when items are added
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: "USD"
      });
    }
    const db2 = getDb();
    const [promoCode] = await db2.select().from(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
    const cartInput = items.map((item) => ({
      id: item.id,
      // Pass actual cart item ID to pricing service
      productId: item.productId,
      variantId: item.variantId || void 0,
      quantity: item.quantity
    }));
    const calculation = await pricingService.calculateCart(
      cartInput,
      promoCode?.code
    );
    sendSuccess(res, calculation);
  } catch (error) {
    next(error);
  }
});
cartRoutes.post("/items", validateBody(addToCartSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"] || (0, import_uuid5.v4)();
    const { productId, variantId, quantity } = req.body;
    const [product] = await db2.select().from(products).where(eq(products.id, productId));
    if (!product || product.status !== "active") {
      throw new NotFoundError("Product not found");
    }
    if (variantId) {
      const [variant] = await db2.select().from(productVariants).where(eq(productVariants.id, variantId));
      if (!variant || !variant.isActive) {
        throw new NotFoundError("Variant not found");
      }
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const [existingItem] = await db2.select().from(cartItems).where(
      and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : isNull(cartItems.variantId)
      )
    );
    let cartItem;
    if (existingItem) {
      [cartItem] = await db2.update(cartItems).set({
        quantity: existingItem.quantity + quantity,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(cartItems.id, existingItem.id)).returning();
    } else {
      const [created] = await db2.insert(cartItems).values({
        cartId: cart.id,
        productId,
        variantId,
        quantity
      }).returning();
      cartItem = created;
    }
    if (!cartItem) {
      throw new Error("Failed to add item to cart");
    }
    sendSuccess(res, {
      id: cartItem.id,
      cartId: cart.id,
      sessionId: cart.sessionId,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity
    }, 201);
  } catch (error) {
    next(error);
  }
});
cartRoutes.put("/items/:id", validateBody(updateCartItemSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const { quantity } = req.body;
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      throw new NotFoundError("Cart item not found");
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const [cartItem] = await db2.select().from(cartItems).where(and(
      eq(cartItems.id, id),
      eq(cartItems.cartId, cart.id)
    ));
    if (!cartItem) {
      logger.warn("Cart item not found for update", {
        requestedId: id,
        cartId: cart.id,
        userId: req.user?.customerId,
        sessionId: req.sessionId || req.headers["x-session-id"],
        requestBody: req.body
      });
      throw new NotFoundError("Cart item not found");
    }
    const [updated] = await db2.update(cartItems).set({
      quantity,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(cartItems.id, id)).returning();
    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});
cartRoutes.delete("/items/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      throw new NotFoundError("Cart item not found");
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const [cartItem] = await db2.select().from(cartItems).where(and(
      eq(cartItems.id, id),
      eq(cartItems.cartId, cart.id)
    ));
    if (!cartItem) {
      logger.warn("Cart item not found for deletion", {
        requestedId: id,
        cartId: cart.id,
        userId: req.user?.customerId,
        sessionId: req.sessionId || req.headers["x-session-id"]
      });
      throw new NotFoundError("Cart item not found");
    }
    await db2.delete(cartItems).where(eq(cartItems.id, id));
    logger.info("Cart item deleted", {
      cartItemId: id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      userId: req.user?.customerId
    });
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
cartRoutes.post("/apply-promo", validateBody(applyPromoSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    const { code } = req.body;
    if (!userId && !sessionId) {
      throw new BadRequestError("Cart not found");
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);
    if (items.length === 0) {
      throw new BadRequestError("Cart is empty");
    }
    const cartInput = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || void 0,
      quantity: item.quantity
    }));
    const calculation = await pricingService.calculateCart(cartInput, code);
    if (!calculation.promoCodeId) {
      throw new BadRequestError("Invalid or expired promo code");
    }
    if (calculation.discountAmount === 0 && calculation.promoCode) {
      throw new BadRequestError(
        "This promo code does not apply to any items in your cart. It may only be valid for specific products or categories."
      );
    }
    await db2.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
    await db2.insert(cartPromoCodes).values({
      cartId: cart.id,
      promoCodeId: calculation.promoCodeId,
      code: calculation.promoCode
    });
    sendSuccess(res, calculation);
  } catch (error) {
    next(error);
  }
});
cartRoutes.delete("/promo", async (req, res, next) => {
  try {
    const db2 = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      throw new BadRequestError("Cart not found");
    }
    const cart = await getOrCreateCart(userId, sessionId);
    await db2.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
cartRoutes.post("/clear", async (req, res, next) => {
  try {
    const db2 = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers["x-session-id"];
    if (!userId && !sessionId) {
      return sendSuccess(res, { success: true, itemsRemoved: 0 });
    }
    const cart = await getOrCreateCart(userId, sessionId);
    const deleted = await db2.delete(cartItems).where(eq(cartItems.cartId, cart.id)).returning();
    await db2.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
    logger.info("Cart cleared", {
      cartId: cart.id,
      itemsRemoved: deleted.length,
      userId: req.user?.customerId
    });
    sendSuccess(res, { success: true, itemsRemoved: deleted.length });
  } catch (error) {
    next(error);
  }
});

// src/routes/orders.routes.ts
var import_express6 = require("express");
var import_zod8 = require("zod");

// src/services/email-templates.service.ts
var EmailTemplatesService = class {
  /**
   * Generate customer order confirmation email HTML
   */
  generateOrderConfirmationEmail(data) {
    const itemsHtml = data.items.map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">
          <strong>${this.escapeHtml(item.productName)}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">SKU: ${this.escapeHtml(item.sku)}</span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #1f2937;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #1f2937;">
          ${this.formatCurrency(item.lineTotal, data.currency)}
        </td>
      </tr>
    `
    ).join("");
    const content = `
      <!-- Order Confirmation Message -->
      <tr>
        <td style="padding: 40px 40px 20px;">
          <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px; font-weight: bold;">Order Confirmed!</h2>
          <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
            Thank you for your order. We'll prepare it and contact you for delivery.
          </p>
        </td>
      </tr>

      <!-- Order Number -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; text-align: center;">
            <p style="margin: 0 0 5px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">#${this.escapeHtml(data.orderNumber)}</p>
          </div>
        </td>
      </tr>

      <!-- Order Items -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Details</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Item</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 14px; color: #6b7280; font-weight: 600;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Price Breakdown -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Subtotal</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">${this.formatCurrency(data.subtotal, data.currency)}</td>
            </tr>
            ${data.discountAmount > 0 ? `
            <tr>
              <td style="font-size: 14px; color: #6b7280;">
                Discount ${data.promoCode ? `(${this.escapeHtml(data.promoCode)})` : ""}
              </td>
              <td style="text-align: right; font-size: 14px; color: #10b981;">-${this.formatCurrency(data.discountAmount, data.currency)}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Tax (${(data.taxRate * 100).toFixed(0)}%)</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">${this.formatCurrency(data.taxAmount, data.currency)}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Shipping</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">
                ${data.shippingAmount > 0 ? this.formatCurrency(data.shippingAmount, data.currency) : "Free"}
              </td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="font-size: 18px; font-weight: bold; color: #1f2937; padding-top: 12px;">Total</td>
              <td style="text-align: right; font-size: 18px; font-weight: bold; color: #1f2937; padding-top: 12px;">
                ${this.formatCurrency(data.total, data.currency)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- COD Payment Notice -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
              <strong>Payment Method:</strong> Cash on Delivery (COD)<br>
              Pay with cash when you receive your order.
            </p>
          </div>
        </td>
      </tr>

      <!-- Shipping Address -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Shipping Address</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.8;">
            ${this.formatAddress(data.shippingAddress)}
          </p>
        </td>
      </tr>

      ${data.customerNotes ? `
      <!-- Customer Notes -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Notes</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
            ${this.escapeHtml(data.customerNotes)}
          </p>
        </td>
      </tr>
      ` : ""}
    `;
    return this.generateEmailLayout(content, `Order Confirmation - #${data.orderNumber}`);
  }
  /**
   * Generate admin new order notification email HTML
   */
  generateNewOrderNotificationEmail(data) {
    const itemsHtml = data.items.map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">
          <strong>${this.escapeHtml(item.productName)}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">SKU: ${this.escapeHtml(item.sku)}</span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #1f2937;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #1f2937;">
          ${this.formatCurrency(item.lineTotal, data.currency)}
        </td>
      </tr>
    `
    ).join("");
    const content = `
      <tr>
        <td style="padding: 40px;">
          <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">New Order Received</h2>

          <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Order Number:</strong> #${this.escapeHtml(data.orderNumber)}
            </p>
          </div>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Customer</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
            <strong>${this.escapeHtml(data.customerName)}</strong><br>
            ${this.escapeHtml(data.customerEmail)}<br>
            ${this.escapeHtml(data.shippingAddress.phone)}
          </p>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Summary</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; margin-bottom: 20px; border-radius: 6px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Item</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 14px; color: #6b7280; font-weight: 600;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">
            Total: ${this.formatCurrency(data.total, data.currency)}
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Payment:</strong> Cash on Delivery (COD)
            </p>
          </div>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Shipping Address</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
            ${this.formatAddress(data.shippingAddress)}
          </p>

          ${data.customerNotes ? `
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Customer Notes</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            ${this.escapeHtml(data.customerNotes)}
          </p>
          ` : ""}

          <div style="text-align: center; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Log in to your admin dashboard to view and manage this order.
            </p>
          </div>
        </td>
      </tr>
    `;
    return this.generateEmailLayout(content, `New Order: #${data.orderNumber}`);
  }
  /**
   * Generate email layout wrapper with header and footer
   */
  generateEmailLayout(content, title) {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; color: #ffffff; padding: 30px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Lab404 Electronics</h1>
            </td>
          </tr>

          <!-- Content -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Questions? Contact us at <a href="mailto:contact@lab404electronics.com" style="color: #2563eb; text-decoration: none;">contact@lab404electronics.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; 2026 Lab404 Electronics. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
  /**
   * Format currency for display
   */
  formatCurrency(amount, currency) {
    return `$${amount.toFixed(2)}`;
  }
  /**
   * Format address for display
   */
  formatAddress(address) {
    const parts = [];
    parts.push(`<strong>${this.escapeHtml(address.firstName)} ${this.escapeHtml(address.lastName)}</strong>`);
    parts.push(this.escapeHtml(address.addressLine1));
    if (address.addressLine2) {
      parts.push(this.escapeHtml(address.addressLine2));
    }
    const cityStateLine = [];
    cityStateLine.push(this.escapeHtml(address.city));
    if (address.state) {
      cityStateLine.push(this.escapeHtml(address.state));
    }
    if (address.postalCode) {
      cityStateLine.push(this.escapeHtml(address.postalCode));
    }
    parts.push(cityStateLine.join(", "));
    parts.push(this.escapeHtml(address.country));
    parts.push(this.escapeHtml(address.phone));
    return parts.join("<br>");
  }
  /**
   * Escape HTML to prevent XSS in email templates
   */
  escapeHtml(text2) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text2.replace(/[&<>"']/g, (char2) => map[char2] || char2);
  }
};
var emailTemplatesService = new EmailTemplatesService();

// src/routes/orders.routes.ts
var ordersRoutes = (0, import_express6.Router)();
var addressSchema = import_zod8.z.object({
  firstName: import_zod8.z.string().min(1).max(100),
  lastName: import_zod8.z.string().min(1).max(100),
  company: import_zod8.z.string().max(255).optional(),
  addressLine1: import_zod8.z.string().min(1).max(255),
  addressLine2: import_zod8.z.string().max(255).optional(),
  city: import_zod8.z.string().min(1).max(100),
  state: import_zod8.z.string().max(100).optional(),
  postalCode: import_zod8.z.string().max(20).optional(),
  country: import_zod8.z.string().min(1).max(100),
  phone: import_zod8.z.string().max(50).optional()
});
var createOrderSchema = import_zod8.z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: import_zod8.z.boolean().optional().default(true),
  customerEmail: import_zod8.z.string().email(),
  customerNotes: import_zod8.z.string().max(1e3).optional(),
  paymentMethod: import_zod8.z.enum(["cod"]).default("cod")
});
var updateOrderSchema = import_zod8.z.object({
  status: import_zod8.z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: import_zod8.z.enum(["pending", "paid", "refunded", "failed"]).optional(),
  trackingNumber: import_zod8.z.string().max(255).optional(),
  shippingMethod: import_zod8.z.string().max(100).optional(),
  adminNotes: import_zod8.z.string().max(1e3).optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional()
});
var orderFiltersSchema = import_zod8.z.object({
  page: import_zod8.z.string().optional(),
  limit: import_zod8.z.string().optional(),
  status: import_zod8.z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: import_zod8.z.enum(["pending", "paid", "refunded", "failed"]).optional(),
  search: import_zod8.z.string().optional()
});
ordersRoutes.post(
  "/",
  strictLimiter,
  optionalAuth,
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const userId = req.user?.customerId;
      const sessionId = req.sessionId || req.headers["x-session-id"];
      const data = req.body;
      if (!userId && !sessionId) {
        throw new BadRequestError("No cart found");
      }
      let cart;
      if (userId) {
        [cart] = await db2.select().from(carts).where(eq(carts.customerId, userId));
      } else if (sessionId) {
        [cart] = await db2.select().from(carts).where(eq(carts.sessionId, sessionId));
      }
      if (!cart) {
        throw new BadRequestError("Cart not found");
      }
      const items = await db2.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
      if (items.length === 0) {
        throw new BadRequestError("Cart is empty");
      }
      const [promoCode] = await db2.select().from(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
      const cartInput = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || void 0,
        quantity: item.quantity
      }));
      const totals = await pricingService.calculateOrderTotals(
        cartInput,
        promoCode?.code
      );
      let customer;
      if (userId) {
        [customer] = await db2.select().from(customers).where(eq(customers.id, userId));
      } else {
        [customer] = await db2.insert(customers).values({
          email: data.customerEmail.toLowerCase(),
          firstName: data.shippingAddress.firstName,
          lastName: data.shippingAddress.lastName,
          phone: data.shippingAddress.phone,
          isGuest: true
        }).returning();
      }
      const countResult = await db2.select({ count: sql`count(*)` }).from(orders);
      const count2 = countResult[0]?.count ?? 0;
      const orderNumber = generateOrderNumber(Number(count2) + 1);
      const billingAddress = data.sameAsShipping ? data.shippingAddress : data.billingAddress || data.shippingAddress;
      if (!customer) {
        throw new BadRequestError("Failed to create or find customer");
      }
      const orderResult = await db2.insert(orders).values({
        orderNumber,
        customerId: customer.id,
        status: "pending",
        paymentStatus: "pending",
        shippingAddress: data.shippingAddress,
        billingAddress,
        currency: "USD",
        subtotalSnapshot: String(totals.subtotal),
        taxRateSnapshot: String(totals.taxRate),
        taxAmountSnapshot: String(totals.taxAmount),
        shippingAmountSnapshot: String(totals.shippingAmount),
        discountAmountSnapshot: String(totals.discountAmount),
        totalSnapshot: String(totals.total),
        promoCodeId: totals.promoCodeId,
        promoCodeSnapshot: totals.promoCodeSnapshot,
        paymentMethod: data.paymentMethod,
        customerNotes: data.customerNotes
      }).returning();
      const order = orderResult[0];
      if (!order) {
        throw new BadRequestError("Failed to create order");
      }
      for (const item of items) {
        const productResult = await db2.select().from(products).where(eq(products.id, item.productId));
        const product = productResult[0];
        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productId}`);
        }
        let variant;
        if (item.variantId) {
          const variantResult = await db2.select().from(productVariants).where(eq(productVariants.id, item.variantId));
          variant = variantResult[0];
        }
        const unitPrice = variant ? Number(variant.basePrice) : Number(product.basePrice);
        await db2.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: product.name,
          skuSnapshot: variant?.sku || product.sku,
          variantOptionsSnapshot: variant?.options,
          quantity: item.quantity,
          unitPriceSnapshot: String(unitPrice)
        });
      }
      for (const item of items) {
        if (item.variantId) {
          await db2.update(productVariants).set({
            stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(productVariants.id, item.variantId));
        } else {
          const [product] = await db2.select({ trackInventory: products.trackInventory }).from(products).where(eq(products.id, item.productId));
          if (product?.trackInventory) {
            await db2.update(products).set({
              stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(products.id, item.productId));
          }
        }
      }
      if (totals.promoCodeId) {
        await db2.update(promoCodes).set({ usageCount: sql`${promoCodes.usageCount} + 1` }).where(eq(promoCodes.id, totals.promoCodeId));
      }
      await db2.update(customers).set({ orderCount: sql`${customers.orderCount} + 1` }).where(eq(customers.id, customer.id));
      await db2.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db2.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));
      sendCreated(res, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: totals.total,
        status: order.status,
        paymentMethod: order.paymentMethod
      });
      try {
        const orderWithItems = await db2.query.orders.findFirst({
          where: eq(orders.id, order.id),
          with: {
            items: true
          }
        });
        if (!orderWithItems) {
          logger.warn("Order not found for email notification", { orderId: order.id });
          return;
        }
        const [storeSettings] = await db2.select().from(settings).where(eq(settings.key, "store"));
        const storeConfig = storeSettings?.value || {};
        const customerEmail = data["customerEmail"];
        const emailData = {
          orderNumber: order.orderNumber,
          customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          customerEmail,
          shippingAddress: { ...order.shippingAddress, email: customerEmail, phone: order.shippingAddress.phone || "" },
          items: orderWithItems.items.map((item) => ({
            productName: item.productNameSnapshot,
            sku: item.skuSnapshot,
            quantity: item.quantity,
            unitPrice: Number(item.unitPriceSnapshot),
            lineTotal: Number(item.unitPriceSnapshot) * item.quantity
          })),
          subtotal: Number(order.subtotalSnapshot),
          taxRate: Number(order.taxRateSnapshot),
          taxAmount: Number(order.taxAmountSnapshot),
          shippingAmount: Number(order.shippingAmountSnapshot),
          discountAmount: Number(order.discountAmountSnapshot),
          total: Number(order.totalSnapshot),
          currency: order.currency,
          promoCode: order.promoCodeSnapshot || void 0,
          customerNotes: order.customerNotes || void 0,
          orderDate: order.createdAt.toISOString(),
          paymentMethod: order.paymentMethod
        };
        const customerEmailHtml = emailTemplatesService.generateOrderConfirmationEmail(emailData);
        mailerService.sendEmail({
          to: emailData.customerEmail,
          subject: `Order Confirmation - ${order.orderNumber}`,
          html: customerEmailHtml
        }).then((success) => {
          if (success) {
            logger.info("Order confirmation email sent", {
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerEmail: emailData.customerEmail
            });
          }
        }).catch((error) => {
          logger.error("Failed to send customer order confirmation email", {
            error,
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerEmail: emailData.customerEmail
          });
        });
        if (storeConfig.orderNotificationEmail) {
          const adminEmailHtml = emailTemplatesService.generateNewOrderNotificationEmail(emailData);
          mailerService.sendEmail({
            to: storeConfig.orderNotificationEmail,
            subject: `New Order: ${order.orderNumber}`,
            html: adminEmailHtml
          }).then((success) => {
            if (success) {
              logger.info("Admin order notification email sent", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                adminEmail: storeConfig.orderNotificationEmail
              });
            }
          }).catch((error) => {
            logger.error("Failed to send admin order notification email", {
              error,
              orderId: order.id,
              orderNumber: order.orderNumber,
              adminEmail: storeConfig.orderNotificationEmail
            });
          });
        }
      } catch (emailError) {
        logger.error("Error in email notification process", {
          error: emailError,
          orderId: order.id,
          orderNumber: order.orderNumber
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
ordersRoutes.get("/track/:orderNumber", async (req, res, next) => {
  try {
    const db2 = getDb();
    const orderNumber = req.params["orderNumber"];
    const [order] = await db2.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    const items = await db2.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const timeline = [
      { status: "pending", timestamp: order.createdAt.toISOString(), description: "Order placed" }
    ];
    if (order.status !== "pending" && order.status !== "cancelled" && order.confirmedAt) {
      timeline.push({ status: "confirmed", timestamp: order.confirmedAt.toISOString(), description: "Order confirmed" });
    }
    if (["processing", "shipped", "delivered"].includes(order.status) && order.processingAt) {
      timeline.push({ status: "processing", timestamp: order.processingAt.toISOString(), description: "Order is being processed" });
    }
    if (["shipped", "delivered"].includes(order.status) && order.shippedAt) {
      timeline.push({ status: "shipped", timestamp: order.shippedAt.toISOString(), description: "Order shipped" });
    }
    if (order.status === "delivered" && order.deliveredAt) {
      timeline.push({ status: "delivered", timestamp: order.deliveredAt.toISOString(), description: "Order delivered" });
    }
    const shippingAddress = order.shippingAddress;
    sendSuccess(res, {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt.toISOString(),
      total: Number(order.totalSnapshot),
      itemCount: items.length,
      items: items.map((item) => ({
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        price: Number(item.unitPriceSnapshot)
      })),
      shippingLocation: shippingAddress ? {
        city: shippingAddress.city,
        country: shippingAddress.country
      } : null,
      timeline
    });
  } catch (error) {
    next(error);
  }
});
ordersRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const db2 = getDb();
    const customerId = req.user?.customerId;
    if (!customerId) {
      throw new ForbiddenError("Customer not found");
    }
    const { page, limit, offset } = parsePaginationParams(req.query);
    const countResult = await db2.select({ count: sql`count(*)` }).from(orders).where(eq(orders.customerId, customerId));
    const count2 = countResult[0]?.count ?? 0;
    const orderList = await db2.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalSnapshot: orders.totalSnapshot,
      createdAt: orders.createdAt
    }).from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
    const ordersWithTotals = orderList.map((o) => ({
      ...o,
      totalSnapshot: Number(o.totalSnapshot)
    }));
    sendSuccess(res, ordersWithTotals, 200, createPaginationMeta(page, limit, Number(count2)));
  } catch (error) {
    next(error);
  }
});
ordersRoutes.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const customerId = req.user?.customerId;
    const isAdmin = req.user?.role === "admin";
    const [order] = await db2.select().from(orders).where(eq(orders.id, id));
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (!isAdmin && order.customerId !== customerId) {
      throw new ForbiddenError("Access denied");
    }
    const items = await db2.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    let customer = null;
    if (order.customerId) {
      const [customerData] = await db2.select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName
      }).from(customers).where(eq(customers.id, order.customerId));
      customer = customerData || null;
    }
    sendSuccess(res, {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer,
      // Status
      status: order.status,
      paymentStatus: order.paymentStatus,
      // Financial
      currency: order.currency,
      subtotal: Number(order.subtotalSnapshot),
      taxRate: Number(order.taxRateSnapshot),
      tax: Number(order.taxAmountSnapshot),
      shipping: Number(order.shippingAmountSnapshot),
      discount: Number(order.discountAmountSnapshot),
      total: Number(order.totalSnapshot),
      // Promo
      promoCodeId: order.promoCodeId,
      promoCodeSnapshot: order.promoCodeSnapshot,
      // Payment & Shipping
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      // Addresses
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      // Notes
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      // Status Timestamps
      confirmedAt: order.confirmedAt?.toISOString(),
      processingAt: order.processingAt?.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      // Items
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productNameSnapshot,
        productImage: null,
        sku: item.skuSnapshot,
        variantOptions: item.variantOptionsSnapshot,
        quantity: item.quantity,
        price: Number(item.unitPriceSnapshot),
        total: Number(item.unitPriceSnapshot) * item.quantity
      }))
    });
  } catch (error) {
    next(error);
  }
});
ordersRoutes.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  validateQuery(orderFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const filters = req.query;
      const conditions = [];
      if (filters["status"]) {
        conditions.push(eq(orders.status, filters["status"]));
      }
      if (filters["paymentStatus"]) {
        conditions.push(eq(orders.paymentStatus, filters["paymentStatus"]));
      }
      if (filters["search"]) {
        const searchTerm = `%${filters["search"]}%`;
        conditions.push(
          or(
            ilike(orders.orderNumber, searchTerm),
            ilike(customers.email, searchTerm),
            ilike(customers.firstName, searchTerm),
            ilike(customers.lastName, searchTerm),
            sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName}) ILIKE ${searchTerm}`
          )
        );
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countQuery = filters["search"] ? db2.select({ count: sql`count(*)` }).from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).where(whereClause) : db2.select({ count: sql`count(*)` }).from(orders).where(whereClause);
      const countResult = await countQuery;
      const count2 = countResult[0]?.count ?? 0;
      const orderList = await db2.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalSnapshot: orders.totalSnapshot,
        shippingAddress: orders.shippingAddress,
        adminNotes: orders.adminNotes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customer: {
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName
        }
      }).from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).where(whereClause).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
      const formattedOrders = orderList.map((o) => ({
        ...o,
        total: Number(o.totalSnapshot),
        customer: o.customer?.id ? o.customer : null
      }));
      sendSuccess(res, formattedOrders, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);
ordersRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateOrderSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(orders).where(eq(orders.id, id));
      if (!existing) {
        throw new NotFoundError("Order not found");
      }
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: []
      };
      if (data.status && data.status !== existing.status) {
        const allowedNextStates = validTransitions[existing.status] || [];
        if (!allowedNextStates.includes(data.status)) {
          throw new BadRequestError(
            `Cannot transition from '${existing.status}' to '${data.status}'`
          );
        }
      }
      if (data.status === "cancelled" && existing.status !== "cancelled") {
        const orderItemsList = await db2.select().from(orderItems).where(eq(orderItems.orderId, id));
        for (const item of orderItemsList) {
          if (item.variantId) {
            await db2.update(productVariants).set({
              stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`
            }).where(eq(productVariants.id, item.variantId));
          } else if (item.productId) {
            await db2.update(products).set({
              stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`
            }).where(eq(products.id, item.productId));
          }
        }
      }
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data.status === "confirmed" && existing.status !== "confirmed") {
        updateData["confirmedAt"] = /* @__PURE__ */ new Date();
      }
      if (data.status === "processing" && existing.status !== "processing") {
        updateData["processingAt"] = /* @__PURE__ */ new Date();
      }
      if (data.status === "shipped" && existing.status !== "shipped") {
        updateData["shippedAt"] = /* @__PURE__ */ new Date();
      }
      if (data.status === "delivered" && existing.status !== "delivered") {
        updateData["deliveredAt"] = /* @__PURE__ */ new Date();
      }
      const orderResult = await db2.update(orders).set(updateData).where(eq(orders.id, id)).returning();
      const order = orderResult[0];
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }
);
ordersRoutes.get(
  "/:id/invoice",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const [order] = await db2.select().from(orders).where(eq(orders.id, id));
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      const items = await db2.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      let customer = null;
      if (order.customerId) {
        const [customerData] = await db2.select().from(customers).where(eq(customers.id, order.customerId));
        customer = customerData || null;
      }
      const shippingAddress = order.shippingAddress;
      const invoiceData = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        quotationNumber: order.orderNumber,
        createdAt: order.createdAt,
        validUntil: new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1e3),
        // 30 days
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || "cod",
        paidAt: order.paymentStatus === "paid" ? order.updatedAt : void 0,
        // Customer info
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName}` : "Guest Customer",
        customerEmail: customer?.email || "",
        customerPhone: customer?.phone || shippingAddress?.phone,
        customerCompany: shippingAddress?.company,
        // Items
        items: items.map((item) => ({
          productName: item.productNameSnapshot || "Unknown Product",
          sku: item.skuSnapshot || "",
          quantity: item.quantity,
          unitPrice: Number(item.unitPriceSnapshot),
          lineTotal: Number(item.unitPriceSnapshot) * item.quantity,
          variantOptions: item.variantOptionsSnapshot
        })),
        // Totals
        subtotal: Number(order.subtotalSnapshot),
        taxRate: Number(order.taxRateSnapshot),
        taxAmount: Number(order.taxAmountSnapshot),
        shippingAmount: Number(order.shippingAmountSnapshot),
        discountAmount: Number(order.discountAmountSnapshot),
        total: Number(order.totalSnapshot),
        currency: order.currency || "USD",
        // Company info (can be configured via env)
        companyName: process.env["COMPANY_NAME"] || "Lab404",
        companyAddress: process.env["COMPANY_ADDRESS"] || "123 Business Street, City, State 12345",
        companyPhone: process.env["COMPANY_PHONE"] || "+1 (555) 123-4567",
        companyEmail: process.env["COMPANY_EMAIL"] || "contact@lab404.com",
        companyWebsite: process.env["COMPANY_WEBSITE"] || "https://lab404.com"
      };
      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${order.orderNumber}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);
var adminCreateOrderSchema = import_zod8.z.object({
  // Customer - either existing or new
  customerId: import_zod8.z.string().uuid().optional(),
  customerEmail: import_zod8.z.string().email().optional(),
  customerFirstName: import_zod8.z.string().max(100).optional(),
  customerLastName: import_zod8.z.string().max(100).optional(),
  customerPhone: import_zod8.z.string().max(50).optional(),
  // Items (required)
  items: import_zod8.z.array(import_zod8.z.object({
    productId: import_zod8.z.string().uuid(),
    variantId: import_zod8.z.string().uuid().optional(),
    quantity: import_zod8.z.number().int().positive()
  })).min(1, "At least one item is required"),
  // Addresses
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: import_zod8.z.boolean().default(true),
  // Payment
  paymentMethod: import_zod8.z.enum(["cod", "bank_transfer", "cash"]),
  paymentStatus: import_zod8.z.enum(["pending", "paid"]).default("pending"),
  // Discounts
  promoCode: import_zod8.z.string().optional(),
  manualDiscount: import_zod8.z.number().min(0).optional(),
  // Notes
  adminNotes: import_zod8.z.string().max(1e3).optional(),
  customerNotes: import_zod8.z.string().max(1e3).optional()
});
ordersRoutes.post(
  "/admin",
  requireAuth,
  requireAdmin,
  validateBody(adminCreateOrderSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      let customer;
      if (data.customerId) {
        const [existingCustomer] = await db2.select().from(customers).where(eq(customers.id, data.customerId));
        if (!existingCustomer) {
          throw new BadRequestError("Customer not found");
        }
        customer = existingCustomer;
      } else if (data.customerEmail) {
        const [existingCustomer] = await db2.select().from(customers).where(eq(customers.email, data.customerEmail.toLowerCase()));
        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          const [newCustomer] = await db2.insert(customers).values({
            email: data.customerEmail.toLowerCase(),
            firstName: data.customerFirstName || data.shippingAddress.firstName,
            lastName: data.customerLastName || data.shippingAddress.lastName,
            phone: data.customerPhone || data.shippingAddress.phone,
            isGuest: true
          }).returning();
          customer = newCustomer;
        }
      } else {
        throw new BadRequestError("Either customerId or customerEmail is required");
      }
      if (!customer) {
        throw new BadRequestError("Failed to resolve customer");
      }
      const cartInput = data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      const totals = await pricingService.calculateOrderTotals(
        cartInput,
        data.promoCode
      );
      let finalDiscount = totals.discountAmount;
      let finalTotal = totals.total;
      if (data.manualDiscount && data.manualDiscount > 0) {
        const maxManualDiscount = totals.subtotal - totals.discountAmount;
        const appliedManualDiscount = Math.min(data.manualDiscount, maxManualDiscount);
        finalDiscount += appliedManualDiscount;
        finalTotal = totals.subtotal - finalDiscount + totals.taxAmount + totals.shippingAmount;
        const discountedSubtotal = totals.subtotal - finalDiscount;
        const newTax = discountedSubtotal * totals.taxRate;
        finalTotal = discountedSubtotal + newTax + totals.shippingAmount;
      }
      const countResult = await db2.select({ count: sql`count(*)` }).from(orders);
      const count2 = countResult[0]?.count ?? 0;
      const orderNumber = generateOrderNumber(Number(count2) + 1);
      const billingAddress = data.sameAsShipping ? data.shippingAddress : data.billingAddress || data.shippingAddress;
      const [order] = await db2.insert(orders).values({
        orderNumber,
        customerId: customer.id,
        status: "pending",
        paymentStatus: data.paymentStatus,
        shippingAddress: data.shippingAddress,
        billingAddress,
        currency: "USD",
        subtotalSnapshot: String(totals.subtotal),
        taxRateSnapshot: String(totals.taxRate),
        taxAmountSnapshot: String(data.manualDiscount ? (totals.subtotal - finalDiscount) * totals.taxRate : totals.taxAmount),
        shippingAmountSnapshot: String(totals.shippingAmount),
        discountAmountSnapshot: String(finalDiscount),
        totalSnapshot: String(finalTotal),
        promoCodeId: totals.promoCodeId,
        promoCodeSnapshot: totals.promoCodeSnapshot,
        paymentMethod: data.paymentMethod,
        customerNotes: data.customerNotes,
        adminNotes: data.adminNotes
      }).returning();
      if (!order) {
        throw new BadRequestError("Failed to create order");
      }
      for (const item of data.items) {
        const [product] = await db2.select().from(products).where(eq(products.id, item.productId));
        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productId}`);
        }
        let variant;
        if (item.variantId) {
          const [variantResult] = await db2.select().from(productVariants).where(eq(productVariants.id, item.variantId));
          variant = variantResult;
        }
        const unitPrice = variant ? Number(variant.basePrice) : Number(product.basePrice);
        await db2.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: product.name,
          skuSnapshot: variant?.sku || product.sku,
          variantOptionsSnapshot: variant?.options,
          quantity: item.quantity,
          unitPriceSnapshot: String(unitPrice)
        });
      }
      if (totals.promoCodeId) {
        await db2.update(promoCodes).set({ usageCount: sql`${promoCodes.usageCount} + 1` }).where(eq(promoCodes.id, totals.promoCodeId));
      }
      await db2.update(customers).set({ orderCount: sql`${customers.orderCount} + 1` }).where(eq(customers.id, customer.id));
      sendCreated(res, {
        id: order.id,
        orderNumber: order.orderNumber,
        total: finalTotal,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      });
    } catch (error) {
      next(error);
    }
  }
);
ordersRoutes.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const [order] = await db2.select().from(orders).where(eq(orders.id, id));
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      if (order.status !== "cancelled") {
        throw new BadRequestError("Only cancelled orders can be deleted");
      }
      await db2.delete(orderItems).where(eq(orderItems.orderId, id));
      await db2.delete(orders).where(eq(orders.id, id));
      sendSuccess(res, { message: "Order deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/customers.routes.ts
var import_express7 = require("express");
var import_zod9 = require("zod");
var import_bcryptjs4 = __toESM(require("bcryptjs"));
var customersRoutes = (0, import_express7.Router)();
var WEAK_PASSWORDS2 = [
  "123456",
  "123456789",
  "qwerty",
  "password",
  "12345678",
  "111111",
  "1234567890",
  "1234567",
  "password1",
  "123123",
  "abc123",
  "qwerty123",
  "1q2w3e4r",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login"
];
var updateProfileSchema = import_zod9.z.object({
  firstName: import_zod9.z.string().min(1).max(100).optional(),
  lastName: import_zod9.z.string().min(1).max(100).optional(),
  phone: import_zod9.z.string().max(50).optional()
});
var changePasswordSchema = import_zod9.z.object({
  currentPassword: import_zod9.z.string().min(1, "Current password is required"),
  newPassword: import_zod9.z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be less than 72 characters").refine(
    (password) => {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      return hasUppercase && hasLowercase && hasNumber;
    },
    { message: "Password must contain uppercase, lowercase, and number" }
  ).refine(
    (password) => !WEAK_PASSWORDS2.includes(password.toLowerCase()),
    { message: "Password is too common. Please choose a stronger password." }
  ),
  confirmPassword: import_zod9.z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var addressSchema2 = import_zod9.z.object({
  type: import_zod9.z.enum(["shipping", "billing"], {
    errorMap: () => ({ message: "Address type must be shipping or billing" })
  }),
  isDefault: import_zod9.z.boolean().optional().default(false),
  firstName: import_zod9.z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: import_zod9.z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  company: import_zod9.z.string().max(255, "Company must be less than 255 characters").optional(),
  addressLine1: import_zod9.z.string().min(1, "Address is required").max(255, "Address must be less than 255 characters"),
  addressLine2: import_zod9.z.string().max(255, "Address line 2 must be less than 255 characters").optional(),
  city: import_zod9.z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: import_zod9.z.string().max(100, "State must be less than 100 characters").optional(),
  postalCode: import_zod9.z.string().max(20, "Postal code must be less than 20 characters").optional(),
  country: import_zod9.z.string().min(1, "Country is required").max(100, "Country must be less than 100 characters"),
  phone: import_zod9.z.string().max(50, "Phone must be less than 50 characters").regex(/^[+]?[\d\s\-().]*$/, "Please enter a valid phone number").optional().or(import_zod9.z.literal(""))
});
var customerFiltersSchema = import_zod9.z.object({
  page: import_zod9.z.string().optional(),
  limit: import_zod9.z.string().optional(),
  search: import_zod9.z.string().optional(),
  isGuest: import_zod9.z.enum(["true", "false"]).optional()
});
var auditLogFiltersSchema = import_zod9.z.object({
  startDate: import_zod9.z.string().optional(),
  endDate: import_zod9.z.string().optional(),
  eventType: import_zod9.z.nativeEnum(SecurityEventType).optional(),
  limit: import_zod9.z.string().optional(),
  offset: import_zod9.z.string().optional()
});
var adminUpdateCustomerSchema = import_zod9.z.object({
  email: import_zod9.z.string().email("Please enter a valid email address").max(255, "Email must be less than 255 characters").optional(),
  firstName: import_zod9.z.string().min(1, "First name cannot be empty").max(100, "First name must be less than 100 characters").optional(),
  lastName: import_zod9.z.string().min(1, "Last name cannot be empty").max(100, "Last name must be less than 100 characters").optional(),
  phone: import_zod9.z.string().max(50, "Phone number must be less than 50 characters").regex(/^[+]?[\d\s\-().]*$/, "Please enter a valid phone number").optional().or(import_zod9.z.literal("")),
  isGuest: import_zod9.z.boolean().optional(),
  isActive: import_zod9.z.boolean().optional(),
  acceptsMarketing: import_zod9.z.boolean().optional(),
  notes: import_zod9.z.string().max(5e3, "Notes must be less than 5000 characters").optional(),
  tags: import_zod9.z.array(
    import_zod9.z.string().max(50, "Each tag must be less than 50 characters")
  ).optional()
});
var createCustomerSchema = import_zod9.z.object({
  email: import_zod9.z.string().min(1, "Email is required").email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  firstName: import_zod9.z.string().min(1, "First name cannot be empty").max(100, "First name must be less than 100 characters").optional(),
  lastName: import_zod9.z.string().min(1, "Last name cannot be empty").max(100, "Last name must be less than 100 characters").optional(),
  phone: import_zod9.z.string().max(50, "Phone number must be less than 50 characters").regex(/^[+]?[\d\s\-().]*$/, "Please enter a valid phone number").optional().or(import_zod9.z.literal("")),
  isGuest: import_zod9.z.boolean().optional().default(false),
  isActive: import_zod9.z.boolean().optional().default(true),
  acceptsMarketing: import_zod9.z.boolean().optional().default(false),
  notes: import_zod9.z.string().max(5e3, "Notes must be less than 5000 characters").optional(),
  tags: import_zod9.z.array(
    import_zod9.z.string().max(50, "Each tag must be less than 50 characters")
  ).optional()
});
customersRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    const db2 = getDb();
    const customerId = req.user?.customerId;
    if (!customerId) {
      throw new ForbiddenError("Customer not found");
    }
    const [customer] = await db2.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      orderCount: customers.orderCount,
      createdAt: customers.createdAt
    }).from(customers).where(eq(customers.id, customerId));
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    const customerAddresses = await db2.select().from(addresses).where(eq(addresses.customerId, customerId));
    sendSuccess(res, {
      ...customer,
      addresses: customerAddresses
    });
  } catch (error) {
    next(error);
  }
});
customersRoutes.put(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.user?.customerId;
      const data = req.body;
      if (!customerId) {
        throw new ForbiddenError("Customer not found");
      }
      const customerResult = await db2.update(customers).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, customerId)).returning({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone
      });
      const customer = customerResult[0];
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.put(
  "/me/password",
  requireAuth,
  validateBody(changePasswordSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.user?.customerId;
      const { currentPassword, newPassword } = req.body;
      if (!customerId) {
        throw new ForbiddenError("Customer not found");
      }
      const [customer] = await db2.select().from(customers).where(eq(customers.id, customerId));
      if (!customer || !customer.passwordHash) {
        throw new NotFoundError("Customer not found");
      }
      const isPasswordValid = await import_bcryptjs4.default.compare(currentPassword, customer.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError("Current password is incorrect");
      }
      const userInputs = [customer.email, customer.firstName, customer.lastName].filter(Boolean);
      const validation = await PasswordSecurityService.validatePassword(
        newPassword,
        customerId,
        userInputs
      );
      if (!validation.isValid) {
        throw new BadRequestError(validation.errors.join(". "));
      }
      const newPasswordHash = await import_bcryptjs4.default.hash(newPassword, 12);
      await db2.update(customers).set({
        passwordHash: newPasswordHash,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, customerId));
      await PasswordSecurityService.recordPasswordChange({
        customerId,
        passwordHash: newPasswordHash,
        changeReason: "user_action",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
      await auditLogService.logFromRequest(req, {
        eventType: "password.changed" /* PASSWORD_CHANGED */,
        actorType: "customer" /* CUSTOMER */,
        actorId: customerId,
        actorEmail: customer.email,
        action: "password_change",
        status: "success" /* SUCCESS */,
        metadata: {
          changeReason: "user_action",
          strengthScore: validation.strengthResult?.score
        }
      });
      if (validation.strengthResult?.isBreached) {
        await auditLogService.logFromRequest(req, {
          eventType: "password.breach.detected" /* PASSWORD_BREACH_DETECTED */,
          actorType: "customer" /* CUSTOMER */,
          actorId: customerId,
          actorEmail: customer.email,
          action: "password_breach_check",
          status: "success" /* SUCCESS */,
          metadata: { breachCount: validation.strengthResult?.breachCount || 0 }
        });
      }
      notificationService.sendPasswordChangedConfirmation({
        email: customer.email,
        firstName: customer.firstName,
        timestamp: /* @__PURE__ */ new Date(),
        ipAddress: req.ip || req.socket.remoteAddress
      }).catch((error) => {
        console.error("Failed to send password change confirmation:", error);
      });
      sendSuccess(res, { message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.get("/me/addresses", requireAuth, async (req, res, next) => {
  try {
    const db2 = getDb();
    const customerId = req.user?.customerId;
    if (!customerId) {
      throw new ForbiddenError("Customer not found");
    }
    const customerAddresses = await db2.select().from(addresses).where(eq(addresses.customerId, customerId));
    sendSuccess(res, customerAddresses);
  } catch (error) {
    next(error);
  }
});
customersRoutes.post(
  "/me/addresses",
  requireAuth,
  validateBody(addressSchema2),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.user?.customerId;
      const data = req.body;
      if (!customerId) {
        throw new ForbiddenError("Customer not found");
      }
      if (data.isDefault) {
        await db2.update(addresses).set({ isDefault: false }).where(
          and(
            eq(addresses.customerId, customerId),
            eq(addresses.type, data.type)
          )
        );
      }
      const addressResult = await db2.insert(addresses).values({
        customerId,
        ...data
      }).returning();
      const address = addressResult[0];
      sendCreated(res, address);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.put(
  "/me/addresses/:id",
  requireAuth,
  validateBody(addressSchema2.partial()),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.user?.customerId;
      const id = req.params["id"];
      const data = req.body;
      if (!customerId) {
        throw new ForbiddenError("Customer not found");
      }
      const [existing] = await db2.select().from(addresses).where(
        and(
          eq(addresses.id, id),
          eq(addresses.customerId, customerId)
        )
      );
      if (!existing) {
        throw new NotFoundError("Address not found");
      }
      if (data.isDefault) {
        await db2.update(addresses).set({ isDefault: false }).where(
          and(
            eq(addresses.customerId, customerId),
            eq(addresses.type, data.type || existing.type)
          )
        );
      }
      const addressResult = await db2.update(addresses).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(addresses.id, id)).returning();
      const address = addressResult[0];
      sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.delete("/me/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const db2 = getDb();
    const customerId = req.user?.customerId;
    const id = req.params["id"];
    if (!customerId) {
      throw new ForbiddenError("Customer not found");
    }
    const [existing] = await db2.select({ id: addresses.id }).from(addresses).where(
      and(
        eq(addresses.id, id),
        eq(addresses.customerId, customerId)
      )
    );
    if (!existing) {
      throw new NotFoundError("Address not found");
    }
    await db2.delete(addresses).where(eq(addresses.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
customersRoutes.get(
  "/",
  requireAuth,
  requireAdmin,
  validateQuery(customerFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const search = req.query["search"];
      const isGuest = req.query["isGuest"];
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(customers.email, `%${search}%`),
            like(customers.firstName, `%${search}%`),
            like(customers.lastName, `%${search}%`)
          )
        );
      }
      if (isGuest !== void 0) {
        conditions.push(eq(customers.isGuest, isGuest === "true"));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(customers).where(whereClause);
      const count2 = countResult[0]?.count ?? 0;
      const customerList = await db2.select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        isGuest: customers.isGuest,
        isActive: customers.isActive,
        orderCount: sql`COUNT(${orders.id})`.as("order_count"),
        paidOrders: sql`COUNT(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 END)`.as("paid_orders"),
        unpaidOrders: sql`COUNT(CASE WHEN ${orders.paymentStatus} != 'paid' AND ${orders.id} IS NOT NULL THEN 1 END)`.as("unpaid_orders"),
        totalSpent: sql`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.totalSnapshot} ELSE 0 END), 0)`.as("total_spent"),
        debt: sql`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} != 'paid' THEN ${orders.totalSnapshot} ELSE 0 END), 0)`.as("debt"),
        createdAt: customers.createdAt
      }).from(customers).leftJoin(orders, eq(orders.customerId, customers.id)).where(whereClause).groupBy(
        customers.id,
        customers.email,
        customers.firstName,
        customers.lastName,
        customers.phone,
        customers.isGuest,
        customers.isActive,
        customers.createdAt
      ).orderBy(desc(customers.createdAt)).limit(limit).offset(offset);
      const formattedList = customerList.map((c) => ({
        ...c,
        totalOrders: c.orderCount,
        paidOrders: Number(c.paidOrders),
        unpaidOrders: Number(c.unpaidOrders),
        totalSpent: Number(c.totalSpent),
        debt: Number(c.debt),
        orderCount: void 0
      }));
      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createCustomerSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      const [existingCustomer] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.email, data.email));
      if (existingCustomer) {
        throw new BadRequestError("A customer with this email already exists");
      }
      const customerResult = await db2.insert(customers).values({
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        isGuest: data.isGuest ?? false,
        isActive: data.isActive ?? true,
        acceptsMarketing: data.acceptsMarketing ?? false,
        notes: data.notes || null,
        tags: data.tags || null
      }).returning();
      const customer = customerResult[0];
      sendCreated(res, customer);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [customer] = await db2.select().from(customers).where(eq(customers.id, id));
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    const customerAddresses = await db2.select().from(addresses).where(eq(addresses.customerId, id));
    const recentOrders = await db2.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalSnapshot: orders.totalSnapshot,
      createdAt: orders.createdAt
    }).from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)).limit(10);
    const totalSpentResult = await db2.select({
      totalSpent: sql`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`
    }).from(orders).where(
      and(
        eq(orders.customerId, id),
        eq(orders.paymentStatus, "paid")
      )
    );
    const totalSpent = Number(totalSpentResult[0]?.totalSpent ?? 0);
    const debtResult = await db2.select({
      debt: sql`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`
    }).from(orders).where(
      and(
        eq(orders.customerId, id),
        sql`${orders.paymentStatus} != 'paid'`
      )
    );
    const debt = Number(debtResult[0]?.debt ?? 0);
    const orderCountsResult = await db2.select({
      totalOrders: sql`COUNT(*)`,
      paidOrders: sql`COUNT(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 END)`,
      unpaidOrders: sql`COUNT(CASE WHEN ${orders.paymentStatus} != 'paid' THEN 1 END)`
    }).from(orders).where(eq(orders.customerId, id));
    const totalOrders = Number(orderCountsResult[0]?.totalOrders ?? 0);
    const paidOrders = Number(orderCountsResult[0]?.paidOrders ?? 0);
    const unpaidOrders = Number(orderCountsResult[0]?.unpaidOrders ?? 0);
    sendSuccess(res, {
      ...customer,
      passwordHash: void 0,
      // Never expose password hash
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalSpent,
      debt,
      addresses: customerAddresses,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalSnapshot: Number(o.totalSnapshot)
      }))
    });
  } catch (error) {
    next(error);
  }
});
customersRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(adminUpdateCustomerSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.id, id));
      if (!existing) {
        throw new NotFoundError("Customer not found");
      }
      if (data.email) {
        const [emailExists] = await db2.select({ id: customers.id }).from(customers).where(
          and(
            eq(customers.email, data.email),
            sql`${customers.id} != ${id}`
          )
        );
        if (emailExists) {
          throw new BadRequestError("A customer with this email already exists");
        }
      }
      const customerResult = await db2.update(customers).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(customers.id, id)).returning();
      const customer = customerResult[0];
      sendSuccess(res, {
        ...customer,
        passwordHash: void 0
        // Never expose password hash
      });
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.id, id));
    if (!existing) {
      throw new NotFoundError("Customer not found");
    }
    await db2.update(customers).set({
      isActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(customers.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
customersRoutes.get("/:id/addresses", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const customerId = req.params["id"];
    const [customer] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId));
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    const customerAddresses = await db2.select().from(addresses).where(eq(addresses.customerId, customerId));
    sendSuccess(res, customerAddresses);
  } catch (error) {
    next(error);
  }
});
customersRoutes.post(
  "/:id/addresses",
  requireAuth,
  requireAdmin,
  validateBody(addressSchema2),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.params["id"];
      const data = req.body;
      const [customer] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId));
      if (!customer) {
        throw new NotFoundError("Customer not found");
      }
      if (data.isDefault) {
        await db2.update(addresses).set({ isDefault: false }).where(
          and(
            eq(addresses.customerId, customerId),
            eq(addresses.type, data.type)
          )
        );
      }
      const addressResult = await db2.insert(addresses).values({
        customerId,
        ...data
      }).returning();
      const address = addressResult[0];
      sendCreated(res, address);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.put(
  "/:id/addresses/:addressId",
  requireAuth,
  requireAdmin,
  validateBody(addressSchema2.partial()),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.params["id"];
      const addressId = req.params["addressId"];
      const data = req.body;
      const [customer] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId));
      if (!customer) {
        throw new NotFoundError("Customer not found");
      }
      const [existing] = await db2.select().from(addresses).where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.customerId, customerId)
        )
      );
      if (!existing) {
        throw new NotFoundError("Address not found");
      }
      if (data.isDefault) {
        await db2.update(addresses).set({ isDefault: false }).where(
          and(
            eq(addresses.customerId, customerId),
            eq(addresses.type, data.type || existing.type)
          )
        );
      }
      const addressResult = await db2.update(addresses).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(addresses.id, addressId)).returning();
      const address = addressResult[0];
      sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.delete(
  "/:id/addresses/:addressId",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const customerId = req.params["id"];
      const addressId = req.params["addressId"];
      const [existing] = await db2.select({ id: addresses.id }).from(addresses).where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.customerId, customerId)
        )
      );
      if (!existing) {
        throw new NotFoundError("Address not found");
      }
      await db2.delete(addresses).where(eq(addresses.id, addressId));
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.get("/:id/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const { page, limit, offset } = parsePaginationParams(req.query);
    const countResult = await db2.select({ count: sql`count(*)` }).from(orders).where(eq(orders.customerId, id));
    const count2 = countResult[0]?.count ?? 0;
    const orderList = await db2.select().from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
    sendSuccess(
      res,
      orderList.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.totalSnapshot),
        createdAt: o.createdAt
      })),
      200,
      createPaginationMeta(page, limit, Number(count2))
    );
  } catch (error) {
    next(error);
  }
});
customersRoutes.get("/me/security/login-attempts", requireAuth, async (req, res, next) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) {
      throw new ForbiddenError("Customer not found");
    }
    const attempts = await LoginAttemptService.getAttemptHistory(customerId, 50);
    sendSuccess(res, attempts);
  } catch (error) {
    next(error);
  }
});
customersRoutes.get(
  "/me/audit-logs",
  requireAuth,
  validateQuery(auditLogFiltersSchema),
  async (req, res, next) => {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        throw new ForbiddenError("Customer not found");
      }
      const {
        startDate,
        endDate,
        eventType,
        limit,
        offset
      } = req.query;
      const filters = {
        actorId: customerId,
        // Only return logs for this customer
        startDate: startDate ? new Date(startDate) : void 0,
        endDate: endDate ? new Date(endDate) : void 0,
        eventTypes: eventType ? [eventType] : void 0,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      };
      const logs = await auditLogService.query(filters);
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
);
customersRoutes.post("/admin/customers/:id/unlock", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    const db2 = getDb();
    const [customer] = await db2.select({ id: customers.id, email: customers.email }).from(customers).where(eq(customers.id, id));
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }
    await LoginAttemptService.unlockAccount(id);
    sendSuccess(res, {
      message: "Customer account unlocked successfully",
      customerId: id,
      email: customer.email
    });
  } catch (error) {
    next(error);
  }
});

// src/routes/promoCodes.routes.ts
var import_express8 = require("express");
var import_zod10 = require("zod");
var promoCodesRoutes = (0, import_express8.Router)();
var createPromoCodeSchema = import_zod10.z.object({
  code: import_zod10.z.string().min(3).max(50).transform((s) => s.toUpperCase()),
  description: import_zod10.z.string().max(500).optional(),
  discountType: import_zod10.z.enum(["percentage", "fixed_amount"]),
  discountValue: import_zod10.z.number().positive(),
  minimumOrderAmount: import_zod10.z.number().min(0).optional(),
  maximumDiscountAmount: import_zod10.z.number().positive().optional(),
  usageLimit: import_zod10.z.number().int().positive().optional(),
  usageLimitPerCustomer: import_zod10.z.number().int().positive().optional(),
  startsAt: import_zod10.z.string().datetime().optional(),
  expiresAt: import_zod10.z.string().datetime().optional(),
  isActive: import_zod10.z.boolean().optional().default(true)
});
var updatePromoCodeSchema = createPromoCodeSchema.partial().omit({ code: true });
var promoCodeFiltersSchema = import_zod10.z.object({
  page: import_zod10.z.string().optional(),
  limit: import_zod10.z.string().optional(),
  search: import_zod10.z.string().optional(),
  isActive: import_zod10.z.enum(["true", "false"]).optional(),
  status: import_zod10.z.enum(["active", "expired", "upcoming"]).optional()
});
promoCodesRoutes.post(
  "/validate",
  validateBody(import_zod10.z.object({ code: import_zod10.z.string().min(1), orderAmount: import_zod10.z.number().min(0) })),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { code, orderAmount } = req.body;
      const [promoCode] = await db2.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
      if (!promoCode) {
        throw new BadRequestError("Invalid promo code");
      }
      if (!promoCode.isActive) {
        throw new BadRequestError("Promo code is not active");
      }
      const now = /* @__PURE__ */ new Date();
      if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
        throw new BadRequestError("Promo code is not yet valid");
      }
      if (promoCode.expiresAt && new Date(promoCode.expiresAt) < now) {
        throw new BadRequestError("Promo code has expired");
      }
      if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
        throw new BadRequestError("Promo code usage limit reached");
      }
      if (promoCode.minimumOrderAmount && orderAmount < Number(promoCode.minimumOrderAmount)) {
        throw new BadRequestError(
          `Minimum order amount of $${promoCode.minimumOrderAmount} required`
        );
      }
      let discountAmount;
      if (promoCode.discountType === "percentage") {
        discountAmount = orderAmount * Number(promoCode.discountValue) / 100;
        if (promoCode.maximumDiscountAmount) {
          discountAmount = Math.min(discountAmount, Number(promoCode.maximumDiscountAmount));
        }
      } else {
        discountAmount = Math.min(Number(promoCode.discountValue), orderAmount);
      }
      sendSuccess(res, {
        valid: true,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: Number(promoCode.discountValue),
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: promoCode.description
      });
    } catch (error) {
      next(error);
    }
  }
);
promoCodesRoutes.get(
  "/",
  requireAuth,
  requireAdmin,
  validateQuery(promoCodeFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search, isActive, status } = req.query;
      const conditions = [];
      const now = /* @__PURE__ */ new Date();
      if (search) {
        conditions.push(
          or(
            like(promoCodes.code, `%${search.toUpperCase()}%`),
            like(promoCodes.description, `%${search}%`)
          )
        );
      }
      if (isActive !== void 0) {
        conditions.push(eq(promoCodes.isActive, isActive === "true"));
      }
      if (status === "active") {
        conditions.push(eq(promoCodes.isActive, true));
        conditions.push(
          or(
            sql`${promoCodes.startsAt} IS NULL`,
            lte(promoCodes.startsAt, now)
          )
        );
        conditions.push(
          or(
            sql`${promoCodes.expiresAt} IS NULL`,
            gte(promoCodes.expiresAt, now)
          )
        );
      } else if (status === "expired") {
        conditions.push(lte(promoCodes.expiresAt, now));
      } else if (status === "upcoming") {
        conditions.push(gte(promoCodes.startsAt, now));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(promoCodes).where(whereClause);
      const count2 = countResult[0]?.count ?? 0;
      const promoCodeList = await db2.select().from(promoCodes).where(whereClause).orderBy(desc(promoCodes.createdAt)).limit(limit).offset(offset);
      const formattedList = promoCodeList.map((pc) => ({
        ...pc,
        discountValue: Number(pc.discountValue),
        minimumOrderAmount: pc.minimumOrderAmount ? Number(pc.minimumOrderAmount) : null,
        maximumDiscountAmount: pc.maximumDiscountAmount ? Number(pc.maximumDiscountAmount) : null,
        isExpired: pc.expiresAt ? new Date(pc.expiresAt) < now : false,
        isUpcoming: pc.startsAt ? new Date(pc.startsAt) > now : false
      }));
      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);
promoCodesRoutes.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [promoCode] = await db2.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (!promoCode) {
      throw new NotFoundError("Promo code not found");
    }
    sendSuccess(res, {
      ...promoCode,
      discountValue: Number(promoCode.discountValue),
      minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
      maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null
    });
  } catch (error) {
    next(error);
  }
});
promoCodesRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createPromoCodeSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      const [existing] = await db2.select({ id: promoCodes.id }).from(promoCodes).where(eq(promoCodes.code, data.code));
      if (existing) {
        throw new ConflictError("Promo code already exists");
      }
      if (data.discountType === "percentage" && data.discountValue > 100) {
        throw new BadRequestError("Percentage discount cannot exceed 100%");
      }
      if (data.startsAt && data.expiresAt) {
        if (new Date(data.startsAt) >= new Date(data.expiresAt)) {
          throw new BadRequestError("Start date must be before expiry date");
        }
      }
      const promoCodeResult = await db2.insert(promoCodes).values({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : void 0,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : void 0
      }).returning();
      const promoCode = promoCodeResult[0];
      if (!promoCode) {
        throw new BadRequestError("Failed to create promo code");
      }
      sendCreated(res, {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
        maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null
      });
    } catch (error) {
      next(error);
    }
  }
);
promoCodesRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updatePromoCodeSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(promoCodes).where(eq(promoCodes.id, id));
      if (!existing) {
        throw new NotFoundError("Promo code not found");
      }
      if (data.discountType === "percentage" && data.discountValue && data.discountValue > 100) {
        throw new BadRequestError("Percentage discount cannot exceed 100%");
      }
      const startsAt = data.startsAt ? new Date(data.startsAt) : existing.startsAt;
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt;
      if (startsAt && expiresAt && startsAt >= expiresAt) {
        throw new BadRequestError("Start date must be before expiry date");
      }
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data["startsAt"]) {
        updateData["startsAt"] = new Date(data["startsAt"]);
      }
      if (data["expiresAt"]) {
        updateData["expiresAt"] = new Date(data["expiresAt"]);
      }
      const promoCodeResult = await db2.update(promoCodes).set(updateData).where(eq(promoCodes.id, id)).returning();
      const promoCode = promoCodeResult[0];
      if (!promoCode) {
        throw new NotFoundError("Promo code not found");
      }
      sendSuccess(res, {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
        maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null
      });
    } catch (error) {
      next(error);
    }
  }
);
promoCodesRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: promoCodes.id, usageCount: promoCodes.usageCount }).from(promoCodes).where(eq(promoCodes.id, id));
    if (!existing) {
      throw new NotFoundError("Promo code not found");
    }
    if (existing.usageCount > 0) {
      throw new BadRequestError(
        "Cannot delete promo code that has been used. Consider deactivating it instead."
      );
    }
    await db2.delete(promoCodes).where(eq(promoCodes.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
promoCodesRoutes.post("/:id/toggle", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (!existing) {
      throw new NotFoundError("Promo code not found");
    }
    const promoCodeResult = await db2.update(promoCodes).set({
      isActive: !existing.isActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(promoCodes.id, id)).returning();
    const promoCode = promoCodeResult[0];
    if (!promoCode) {
      throw new NotFoundError("Promo code not found");
    }
    sendSuccess(res, {
      ...promoCode,
      discountValue: Number(promoCode.discountValue),
      minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
      maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null
    });
  } catch (error) {
    next(error);
  }
});
promoCodesRoutes.get("/stats/summary", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const totalResult = await db2.select({ total: sql`count(*)` }).from(promoCodes);
    const total = totalResult[0]?.total ?? 0;
    const activeResult = await db2.select({ active: sql`count(*)` }).from(promoCodes).where(
      and(
        eq(promoCodes.isActive, true),
        or(
          sql`${promoCodes.startsAt} IS NULL`,
          lte(promoCodes.startsAt, now)
        ),
        or(
          sql`${promoCodes.expiresAt} IS NULL`,
          gte(promoCodes.expiresAt, now)
        )
      )
    );
    const active = activeResult[0]?.active ?? 0;
    const usageResult = await db2.select({ totalUsage: sql`COALESCE(sum(${promoCodes.usageCount}), 0)` }).from(promoCodes);
    const totalUsage = usageResult[0]?.totalUsage ?? 0;
    const topCodes = await db2.select({
      code: promoCodes.code,
      usageCount: promoCodes.usageCount,
      discountType: promoCodes.discountType,
      discountValue: promoCodes.discountValue
    }).from(promoCodes).where(sql`${promoCodes.usageCount} > 0`).orderBy(desc(promoCodes.usageCount)).limit(5);
    sendSuccess(res, {
      total: Number(total),
      active: Number(active),
      expired: Number(total) - Number(active),
      totalUsage: Number(totalUsage),
      topCodes: topCodes.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// src/routes/quotations.routes.ts
var import_express9 = require("express");
var import_zod11 = require("zod");

// src/services/quotation-activity.service.ts
var QuotationActivityService = class {
  /**
   * Log an activity for a quotation
   */
  async logActivity(params) {
    try {
      const db2 = getDb();
      await db2.insert(quotationActivities).values({
        quotationId: params.quotationId,
        activityType: params.activityType,
        description: params.description,
        actorType: params.actorType || "system",
        actorId: params.actorId,
        actorName: params.actorName,
        metadata: params.metadata
      });
      logger.debug("Activity logged", {
        quotationId: params.quotationId,
        activityType: params.activityType
      });
    } catch (error) {
      logger.error("Failed to log activity", { error, params });
    }
  }
  /**
   * Get activities for a quotation
   */
  async getActivities(quotationId, limit = 50) {
    const db2 = getDb();
    const activities = await db2.select().from(quotationActivities).where(eq(quotationActivities.quotationId, quotationId)).orderBy(desc(quotationActivities.createdAt)).limit(limit);
    return activities;
  }
  // Helper methods for common activity types
  async logCreated(quotationId, quotationNumber, actorName) {
    await this.logActivity({
      quotationId,
      activityType: "created",
      description: `Quotation ${quotationNumber} was created`,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { quotationNumber }
    });
  }
  async logUpdated(quotationId, quotationNumber, changes, actorName) {
    const description = changes?.length ? `Quotation updated: ${changes.join(", ")}` : `Quotation ${quotationNumber} was updated`;
    await this.logActivity({
      quotationId,
      activityType: "updated",
      description,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { changes }
    });
  }
  async logSent(quotationId, recipientEmail, actorName) {
    await this.logActivity({
      quotationId,
      activityType: "sent",
      description: `Quotation sent to ${recipientEmail}`,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { recipientEmail }
    });
  }
  async logViewed(quotationId, viewerInfo) {
    await this.logActivity({
      quotationId,
      activityType: "viewed",
      description: viewerInfo ? `Quotation viewed by ${viewerInfo}` : "Quotation was viewed",
      actorType: "customer",
      metadata: { viewerInfo }
    });
  }
  async logAccepted(quotationId, customerName) {
    await this.logActivity({
      quotationId,
      activityType: "accepted",
      description: customerName ? `Quotation accepted by ${customerName}` : "Quotation was accepted",
      actorType: "customer",
      actorName: customerName
    });
  }
  async logRejected(quotationId, reason, customerName) {
    await this.logActivity({
      quotationId,
      activityType: "rejected",
      description: reason ? `Quotation rejected: ${reason}` : "Quotation was rejected",
      actorType: "customer",
      actorName: customerName,
      metadata: { reason }
    });
  }
  async logExpired(quotationId) {
    await this.logActivity({
      quotationId,
      activityType: "expired",
      description: "Quotation has expired",
      actorType: "system"
    });
  }
  async logConverted(quotationId, orderId, orderNumber, actorName) {
    await this.logActivity({
      quotationId,
      activityType: "converted",
      description: `Quotation converted to order ${orderNumber}`,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { orderId, orderNumber }
    });
  }
  async logDuplicated(quotationId, newQuotationId, newQuotationNumber, actorName) {
    await this.logActivity({
      quotationId,
      activityType: "duplicated",
      description: `Quotation duplicated as ${newQuotationNumber}`,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { newQuotationId, newQuotationNumber }
    });
  }
  async logPdfGenerated(quotationId) {
    await this.logActivity({
      quotationId,
      activityType: "pdf_generated",
      description: "PDF was generated",
      actorType: "system"
    });
  }
  async logStatusChanged(quotationId, oldStatus, newStatus, actorName) {
    await this.logActivity({
      quotationId,
      activityType: "status_changed",
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      actorType: actorName ? "admin" : "system",
      actorName,
      metadata: { oldStatus, newStatus }
    });
  }
};
var quotationActivityService = new QuotationActivityService();

// src/services/quotation-revision.service.ts
var QuotationRevisionService = class {
  /**
   * Create a revision snapshot before updating a quotation
   */
  async createRevision(quotationId, changeDescription, createdBy, createdByName) {
    try {
      const db2 = getDb();
      const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, quotationId));
      if (!quotation) {
        logger.warn("Cannot create revision: Quotation not found", { quotationId });
        return;
      }
      const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      const [lastRevision] = await db2.select({ maxVersion: sql`COALESCE(MAX(${quotationRevisions.versionNumber}), 0)` }).from(quotationRevisions).where(eq(quotationRevisions.quotationId, quotationId));
      const nextVersion = (lastRevision?.maxVersion || 0) + 1;
      const snapshot = {
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerCompany: quotation.customerCompany,
        status: quotation.status,
        subtotal: Number(quotation.subtotal),
        taxRate: quotation.taxRate ? Number(quotation.taxRate) : void 0,
        taxAmount: quotation.taxAmount ? Number(quotation.taxAmount) : void 0,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue ? Number(quotation.discountValue) : void 0,
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
        notes: quotation.notes,
        termsAndConditions: quotation.termsAndConditions,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }))
      };
      await db2.insert(quotationRevisions).values({
        quotationId,
        versionNumber: nextVersion,
        snapshot,
        changeDescription,
        createdBy,
        createdByName
      });
      logger.debug("Revision created", {
        quotationId,
        versionNumber: nextVersion
      });
    } catch (error) {
      logger.error("Failed to create revision", { error, quotationId });
    }
  }
  /**
   * Get all revisions for a quotation
   */
  async getRevisions(quotationId) {
    const db2 = getDb();
    const revisions = await db2.select().from(quotationRevisions).where(eq(quotationRevisions.quotationId, quotationId)).orderBy(desc(quotationRevisions.versionNumber));
    return revisions;
  }
  /**
   * Get a specific revision
   */
  async getRevision(revisionId) {
    const db2 = getDb();
    const [revision] = await db2.select().from(quotationRevisions).where(eq(quotationRevisions.id, revisionId));
    return revision || null;
  }
  /**
   * Compare two revisions or a revision with current state
   */
  async compareRevisions(quotationId, revisionIdA, revisionIdB) {
    const db2 = getDb();
    const revisionA = await this.getRevision(revisionIdA);
    if (!revisionA) {
      return null;
    }
    let snapshotB;
    let versionB;
    if (revisionIdB) {
      const revisionB = await this.getRevision(revisionIdB);
      if (!revisionB) {
        return null;
      }
      snapshotB = revisionB.snapshot;
      versionB = revisionB.versionNumber;
    } else {
      const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, quotationId));
      if (!quotation) {
        return null;
      }
      const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      snapshotB = {
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerCompany: quotation.customerCompany,
        status: quotation.status,
        subtotal: Number(quotation.subtotal),
        taxRate: quotation.taxRate ? Number(quotation.taxRate) : void 0,
        taxAmount: quotation.taxAmount ? Number(quotation.taxAmount) : void 0,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue ? Number(quotation.discountValue) : void 0,
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
        notes: quotation.notes,
        termsAndConditions: quotation.termsAndConditions,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }))
      };
      versionB = "current";
    }
    const changes = [];
    const fieldsToCompare = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "customerCompany",
      "status",
      "subtotal",
      "taxRate",
      "taxAmount",
      "discountType",
      "discountValue",
      "discountAmount",
      "total",
      "notes",
      "termsAndConditions"
    ];
    for (const field of fieldsToCompare) {
      const oldValue = revisionA.snapshot[field];
      const newValue = snapshotB[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    }
    if (JSON.stringify(revisionA.snapshot.items) !== JSON.stringify(snapshotB.items)) {
      changes.push({
        field: "items",
        oldValue: `${revisionA.snapshot.items.length} items`,
        newValue: `${snapshotB.items.length} items`
      });
    }
    return {
      versionA: revisionA.versionNumber,
      versionB,
      snapshotA: revisionA.snapshot,
      snapshotB,
      changes
    };
  }
  /**
   * Restore a quotation to a previous revision
   */
  async restoreRevision(quotationId, revisionId, restoredBy, restoredByName) {
    const db2 = getDb();
    const revision = await this.getRevision(revisionId);
    if (!revision || revision.quotationId !== quotationId) {
      return false;
    }
    await this.createRevision(
      quotationId,
      `Restored from version ${revision.versionNumber}`,
      restoredBy,
      restoredByName
    );
    await db2.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    await db2.update(quotations).set({
      customerName: revision.snapshot.customerName,
      customerEmail: revision.snapshot.customerEmail,
      customerPhone: revision.snapshot.customerPhone,
      customerCompany: revision.snapshot.customerCompany,
      status: revision.snapshot.status,
      subtotal: String(revision.snapshot.subtotal),
      taxRate: revision.snapshot.taxRate ? String(revision.snapshot.taxRate) : null,
      taxAmount: revision.snapshot.taxAmount ? String(revision.snapshot.taxAmount) : null,
      discountType: revision.snapshot.discountType,
      discountValue: revision.snapshot.discountValue ? String(revision.snapshot.discountValue) : null,
      discountAmount: String(revision.snapshot.discountAmount),
      total: String(revision.snapshot.total),
      notes: revision.snapshot.notes,
      termsAndConditions: revision.snapshot.termsAndConditions,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(quotations.id, quotationId));
    for (const item of revision.snapshot.items) {
      await db2.insert(quotationItems).values({
        quotationId,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice)
      });
    }
    logger.info("Quotation restored from revision", {
      quotationId,
      revisionId,
      versionNumber: revision.versionNumber
    });
    return true;
  }
};
var quotationRevisionService = new QuotationRevisionService();

// src/routes/quotations.routes.ts
var quotationsRoutes = (0, import_express9.Router)();
var quotationItemSchema = import_zod11.z.object({
  // For product-based items
  productId: import_zod11.z.string().uuid().optional(),
  variantId: import_zod11.z.string().uuid().optional(),
  // For custom items (required if no productId)
  name: import_zod11.z.string().min(1).max(200).optional(),
  description: import_zod11.z.string().max(1e3).optional(),
  sku: import_zod11.z.string().max(100).optional(),
  unitPrice: import_zod11.z.number().positive().optional(),
  // Common fields
  quantity: import_zod11.z.number().int().min(1),
  customPrice: import_zod11.z.number().positive().optional()
  // Override price for product items
}).refine(
  (data) => {
    if (data.productId) {
      return true;
    }
    return data.name && data.unitPrice;
  },
  { message: "Either productId or (name and unitPrice) is required" }
);
var createQuotationSchema = import_zod11.z.object({
  customerId: import_zod11.z.string().uuid().optional(),
  customerName: import_zod11.z.string().min(1).max(200),
  customerEmail: import_zod11.z.string().email(),
  customerPhone: import_zod11.z.string().max(50).optional(),
  customerCompany: import_zod11.z.string().max(255).optional(),
  items: import_zod11.z.array(quotationItemSchema).min(1),
  notes: import_zod11.z.string().max(2e3).optional(),
  terms: import_zod11.z.string().max(2e3).optional(),
  validDays: import_zod11.z.number().int().min(1).max(365).optional().default(30),
  discountType: import_zod11.z.enum(["percentage", "fixed"]).optional(),
  discountValue: import_zod11.z.number().min(0).optional()
});
var updateQuotationItemSchema = import_zod11.z.object({
  // For product-based items
  productId: import_zod11.z.string().uuid().optional(),
  variantId: import_zod11.z.string().uuid().optional(),
  // For custom items
  name: import_zod11.z.string().min(1).max(200).optional(),
  description: import_zod11.z.string().max(1e3).optional(),
  sku: import_zod11.z.string().max(100).optional(),
  unitPrice: import_zod11.z.number().positive().optional(),
  // Common fields
  quantity: import_zod11.z.number().int().min(1),
  customPrice: import_zod11.z.number().positive().optional()
}).refine(
  (data) => {
    if (data.productId) {
      return true;
    }
    return data.name && data.unitPrice;
  },
  { message: "Either productId or (name and unitPrice) is required" }
);
var updateQuotationSchema = import_zod11.z.object({
  customerName: import_zod11.z.string().min(1).max(200).optional(),
  customerEmail: import_zod11.z.string().email().optional(),
  customerPhone: import_zod11.z.string().max(50).optional().nullable(),
  customerCompany: import_zod11.z.string().max(255).optional().nullable(),
  status: import_zod11.z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  notes: import_zod11.z.string().max(2e3).optional().nullable(),
  terms: import_zod11.z.string().max(2e3).optional().nullable(),
  validDays: import_zod11.z.number().int().min(1).max(365).optional(),
  discountType: import_zod11.z.enum(["percentage", "fixed"]).optional(),
  discountValue: import_zod11.z.number().min(0).optional(),
  taxRate: import_zod11.z.number().min(0).max(1).optional(),
  // Decimal 0-1
  items: import_zod11.z.array(updateQuotationItemSchema).min(1).optional()
});
var quotationFiltersSchema = import_zod11.z.object({
  page: import_zod11.z.string().optional(),
  limit: import_zod11.z.string().optional(),
  search: import_zod11.z.string().optional(),
  status: import_zod11.z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  customerId: import_zod11.z.string().uuid().optional()
});
function generateQuotationNumber(count2) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const sequence = String(count2).padStart(5, "0");
  return `QT-${year}-${sequence}`;
}
quotationsRoutes.get(
  "/",
  requireAuth,
  requireAdmin,
  validateQuery(quotationFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search, status, customerId } = req.query;
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(quotations.quotationNumber, `%${search}%`),
            like(quotations.customerName, `%${search}%`),
            like(quotations.customerEmail, `%${search}%`)
          )
        );
      }
      if (status) {
        conditions.push(eq(quotations.status, status));
      }
      if (customerId) {
        conditions.push(eq(quotations.customerId, customerId));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(quotations).where(whereClause);
      const count2 = countResult[0]?.count ?? 0;
      const quotationList = await db2.select().from(quotations).where(whereClause).orderBy(desc(quotations.createdAt)).limit(limit).offset(offset);
      const formattedList = quotationList.map((q) => ({
        ...q,
        subtotal: Number(q.subtotal),
        taxAmount: Number(q.taxAmount || 0),
        discountAmount: Number(q.discountAmount),
        total: Number(q.total),
        isExpired: q.validUntil ? new Date(q.validUntil) < /* @__PURE__ */ new Date() : false
      }));
      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);
quotationsRoutes.get("/stats", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
    const [totalResult] = await db2.select({ count: sql`count(*)` }).from(quotations);
    const statusCounts = await db2.select({
      status: quotations.status,
      count: sql`count(*)`
    }).from(quotations).groupBy(quotations.status);
    const [totalValueResult] = await db2.select({ total: sql`COALESCE(SUM(total), 0)` }).from(quotations);
    const [acceptedValueResult] = await db2.select({ total: sql`COALESCE(SUM(total), 0)` }).from(quotations).where(eq(quotations.status, "accepted"));
    const [expiringSoonResult] = await db2.select({ count: sql`count(*)` }).from(quotations).where(
      and(
        eq(quotations.status, "sent"),
        gte(quotations.validUntil, now),
        lte(quotations.validUntil, sevenDaysFromNow)
      )
    );
    const [thisMonthResult] = await db2.select({ count: sql`count(*)` }).from(quotations).where(gte(quotations.createdAt, startOfMonth));
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = Number(item.count);
      return acc;
    }, {});
    const acceptedCount = statusMap["accepted"] || 0;
    const rejectedCount = statusMap["rejected"] || 0;
    const convertedCount = statusMap["converted"] || 0;
    const totalDecided = acceptedCount + rejectedCount + convertedCount;
    const conversionRate = totalDecided > 0 ? (acceptedCount + convertedCount) / totalDecided * 100 : 0;
    sendSuccess(res, {
      total: Number(totalResult?.count ?? 0),
      byStatus: {
        draft: statusMap["draft"] || 0,
        sent: statusMap["sent"] || 0,
        accepted: statusMap["accepted"] || 0,
        rejected: statusMap["rejected"] || 0,
        expired: statusMap["expired"] || 0,
        converted: statusMap["converted"] || 0
      },
      totalValue: Number(totalValueResult?.total ?? 0),
      acceptedValue: Number(acceptedValueResult?.total ?? 0),
      conversionRate: Math.round(conversionRate * 100) / 100,
      expiringSoon: Number(expiringSoonResult?.count ?? 0),
      thisMonth: Number(thisMonthResult?.count ?? 0)
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/check-expired", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const expiredQuotations = await db2.select({ id: quotations.id, quotationNumber: quotations.quotationNumber }).from(quotations).where(
      and(
        eq(quotations.status, "sent"),
        lte(quotations.validUntil, now)
      )
    );
    if (expiredQuotations.length === 0) {
      sendSuccess(res, {
        updated: 0,
        message: "No quotations to expire"
      });
      return;
    }
    await db2.update(quotations).set({
      status: "expired",
      updatedAt: now
    }).where(
      and(
        eq(quotations.status, "sent"),
        lte(quotations.validUntil, now)
      )
    );
    for (const q of expiredQuotations) {
      await quotationActivityService.logActivity({
        quotationId: q.id,
        activityType: "status_changed",
        description: `Quotation automatically expired (past valid date)`,
        actorType: "system",
        actorName: "System",
        metadata: {
          previousStatus: "sent",
          newStatus: "expired",
          automatic: true
        }
      });
    }
    logger.info("Auto-expired quotations", {
      count: expiredQuotations.length,
      quotationNumbers: expiredQuotations.map((q) => q.quotationNumber)
    });
    sendSuccess(res, {
      updated: expiredQuotations.length,
      quotations: expiredQuotations.map((q) => q.quotationNumber),
      message: `${expiredQuotations.length} quotation(s) marked as expired`
    });
  } catch (error) {
    next(error);
  }
});
var bulkActionsSchema = import_zod11.z.object({
  action: import_zod11.z.enum(["delete", "send", "changeStatus"]),
  ids: import_zod11.z.array(import_zod11.z.string().uuid()).min(1).max(100),
  status: import_zod11.z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional()
}).refine(
  (data) => {
    if (data.action === "changeStatus" && !data.status) {
      return false;
    }
    return true;
  },
  { message: "Status is required for changeStatus action" }
);
quotationsRoutes.post(
  "/bulk",
  requireAuth,
  requireAdmin,
  validateBody(bulkActionsSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { action, ids, status } = req.body;
      const results = { success: [], failed: [] };
      for (const id of ids) {
        try {
          const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, id));
          if (!quotation) {
            results.failed.push(id);
            continue;
          }
          switch (action) {
            case "delete":
              await db2.delete(quotationItems).where(eq(quotationItems.quotationId, id));
              await db2.delete(quotations).where(eq(quotations.id, id));
              results.success.push(id);
              break;
            case "send":
              if (quotation.status !== "draft") {
                results.failed.push(id);
                continue;
              }
              const acceptanceToken = generateSecureToken(32);
              const tokenExpiresAt = /* @__PURE__ */ new Date();
              tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);
              await db2.update(quotations).set({
                status: "sent",
                acceptanceToken,
                tokenExpiresAt,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(quotations.id, id));
              await quotationActivityService.logSent(
                id,
                quotation.customerEmail,
                req.user?.name
              ).catch(() => {
              });
              results.success.push(id);
              break;
            case "changeStatus":
              if (!status) {
                results.failed.push(id);
                continue;
              }
              await db2.update(quotations).set({
                status,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(quotations.id, id));
              await quotationActivityService.logStatusChanged(
                id,
                quotation.status,
                status,
                req.user?.name
              ).catch(() => {
              });
              results.success.push(id);
              break;
          }
        } catch (error) {
          logger.error(`Bulk action ${action} failed for ${id}:`, error);
          results.failed.push(id);
        }
      }
      sendSuccess(res, {
        action,
        results,
        message: `Bulk ${action} completed: ${results.success.length} successful, ${results.failed.length} failed`
      });
    } catch (error) {
      next(error);
    }
  }
);
quotationsRoutes.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    sendSuccess(res, {
      ...quotation,
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      items: items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity
      }))
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createQuotationSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      const countResult = await db2.select({ count: sql`count(*)` }).from(quotations);
      const qCount = countResult[0]?.count ?? 0;
      const quotationNumber = generateQuotationNumber(Number(qCount) + 1);
      const validUntil = /* @__PURE__ */ new Date();
      validUntil.setDate(validUntil.getDate() + (data.validDays || 30));
      const processedItems = [];
      let subtotal = 0;
      for (const item of data.items) {
        if (item.productId) {
          const [product] = await db2.select().from(products).where(eq(products.id, item.productId));
          if (!product) {
            throw new BadRequestError(`Product not found: ${item.productId}`);
          }
          let unitPrice = Number(product.basePrice);
          let sku = product.sku;
          let variantId = null;
          if (item.variantId) {
            const [variant] = await db2.select().from(productVariants).where(eq(productVariants.id, item.variantId));
            if (variant) {
              unitPrice = Number(variant.basePrice);
              sku = variant.sku;
              variantId = variant.id;
            }
          }
          if (item.customPrice) {
            unitPrice = item.customPrice;
          }
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;
          processedItems.push({
            productId: item.productId,
            variantId,
            name: product.name,
            description: product.description || void 0,
            sku,
            quantity: item.quantity,
            unitPrice,
            isCustomItem: false
          });
        } else {
          const unitPrice = item.unitPrice;
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;
          processedItems.push({
            productId: null,
            variantId: null,
            name: item.name,
            // Already validated by schema
            description: item.description,
            sku: item.sku || null,
            quantity: item.quantity,
            unitPrice,
            isCustomItem: true
          });
        }
      }
      let discountAmount = 0;
      if (data.discountValue && data.discountValue > 0) {
        if (data.discountType === "percentage") {
          discountAmount = subtotal * data.discountValue / 100;
        } else {
          discountAmount = Math.min(data.discountValue, subtotal);
        }
      }
      const [taxSetting] = await db2.select().from(settings).where(eq(settings.key, "tax"));
      let taxRate = 0;
      if (taxSetting && taxSetting.value && typeof taxSetting.value === "object") {
        const taxValue = taxSetting.value;
        if (taxValue.tax_enabled && typeof taxValue.tax_rate === "number") {
          taxRate = taxValue.tax_rate / 100;
        }
      }
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * taxRate;
      const total = taxableAmount + taxAmount;
      const quotationResult = await db2.insert(quotations).values({
        quotationNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase(),
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        status: "draft",
        currency: "USD",
        subtotal: String(subtotal),
        taxRate: String(taxRate),
        taxAmount: String(taxAmount),
        discountType: data.discountType,
        discountValue: data.discountValue ? String(data.discountValue) : null,
        discountAmount: String(discountAmount),
        total: String(total),
        validUntil,
        validDays: data.validDays || 30,
        notes: data.notes,
        termsAndConditions: data.terms
      }).returning();
      const quotation = quotationResult[0];
      if (!quotation) {
        throw new BadRequestError("Failed to create quotation");
      }
      for (const item of processedItems) {
        await db2.insert(quotationItems).values({
          quotationId: quotation.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice)
        });
      }
      await quotationActivityService.logCreated(
        quotation.id,
        quotation.quotationNumber
      );
      sendCreated(res, {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
        total: Number(quotation.total),
        validUntil: quotation.validUntil
      });
    } catch (error) {
      next(error);
    }
  }
);
quotationsRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateQuotationSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(quotations).where(eq(quotations.id, id));
      if (!existing) {
        throw new NotFoundError("Quotation not found");
      }
      const isStatusOnlyUpdate = Object.keys(data).length === 1 && data["status"] !== void 0;
      if (existing.status !== "draft" && !isStatusOnlyUpdate) {
        throw new BadRequestError("Only draft quotations can be edited. Non-draft quotations can only have their status changed.");
      }
      await quotationRevisionService.createRevision(
        id,
        "Quotation updated",
        req.user?.id,
        req.user?.name
      ).catch(() => {
      });
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data["customerName"] !== void 0) {
        updateData["customerName"] = data["customerName"];
      }
      if (data["customerEmail"] !== void 0) {
        updateData["customerEmail"] = data["customerEmail"].toLowerCase();
      }
      if (data["customerPhone"] !== void 0) {
        updateData["customerPhone"] = data["customerPhone"] || null;
      }
      if (data["customerCompany"] !== void 0) {
        updateData["customerCompany"] = data["customerCompany"] || null;
      }
      if (data["status"] !== void 0) {
        updateData["status"] = data["status"];
      }
      if (data["notes"] !== void 0) {
        updateData["notes"] = data["notes"] || null;
      }
      if (data["terms"] !== void 0) {
        updateData["termsAndConditions"] = data["terms"] || null;
      }
      if (data["discountType"] !== void 0) {
        updateData["discountType"] = data["discountType"];
      }
      if (data["discountValue"] !== void 0) {
        updateData["discountValue"] = String(data["discountValue"]);
      }
      if (data["taxRate"] !== void 0) {
        updateData["taxRate"] = String(data["taxRate"]);
      }
      if (data["validDays"] !== void 0) {
        const validUntil = /* @__PURE__ */ new Date();
        validUntil.setDate(validUntil.getDate() + data["validDays"]);
        updateData["validUntil"] = validUntil;
      }
      const dataItems = data["items"];
      const shouldRecalculate = data["discountType"] !== void 0 || data["discountValue"] !== void 0 || data["taxRate"] !== void 0 || dataItems && dataItems.length > 0;
      if (dataItems && dataItems.length > 0) {
        await db2.delete(quotationItems).where(eq(quotationItems.quotationId, id));
        let subtotal = 0;
        const processedItems = [];
        for (const item of dataItems) {
          if (item.productId) {
            const [product] = await db2.select().from(products).where(eq(products.id, item.productId));
            if (!product) {
              throw new BadRequestError(`Product not found: ${item.productId}`);
            }
            let unitPrice = Number(product.basePrice);
            let sku = product.sku;
            let variantId = null;
            if (item.variantId) {
              const [variant] = await db2.select().from(productVariants).where(eq(productVariants.id, item.variantId));
              if (variant) {
                unitPrice = Number(variant.basePrice);
                sku = variant.sku;
                variantId = variant.id;
              }
            }
            if (item.customPrice) {
              unitPrice = item.customPrice;
            }
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;
            processedItems.push({
              productId: item.productId,
              variantId,
              name: product.name,
              description: product.description || void 0,
              sku,
              quantity: item.quantity,
              unitPrice
            });
          } else {
            const unitPrice = item.unitPrice;
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;
            processedItems.push({
              productId: null,
              variantId: null,
              name: item.name,
              // Validated by schema
              description: item.description,
              sku: item.sku || null,
              quantity: item.quantity,
              unitPrice
            });
          }
        }
        const discountType = data.discountType ?? existing.discountType ?? "percentage";
        const discountValue = data.discountValue ?? Number(existing.discountValue || 0);
        const taxRate = data.taxRate ?? Number(existing.taxRate || 0);
        let discountAmount = 0;
        if (discountType === "percentage") {
          discountAmount = subtotal * discountValue / 100;
        } else {
          discountAmount = Math.min(discountValue, subtotal);
        }
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;
        updateData["subtotal"] = String(subtotal);
        updateData["discountAmount"] = String(discountAmount);
        updateData["taxAmount"] = String(taxAmount);
        updateData["total"] = String(total);
        for (const item of processedItems) {
          await db2.insert(quotationItems).values({
            quotationId: id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: String(item.unitPrice)
          });
        }
      } else if (shouldRecalculate) {
        const existingItems = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
        const subtotal = existingItems.reduce((sum2, item) => {
          return sum2 + Number(item.unitPrice) * item.quantity;
        }, 0);
        const discountType = data["discountType"] ?? existing.discountType ?? "percentage";
        const discountValue = data["discountValue"] ?? Number(existing.discountValue || 0);
        const taxRate = data["taxRate"] ?? Number(existing.taxRate || 0);
        let discountAmount = 0;
        if (discountType === "percentage") {
          discountAmount = subtotal * discountValue / 100;
        } else {
          discountAmount = Math.min(discountValue, subtotal);
        }
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;
        updateData["subtotal"] = String(subtotal);
        updateData["discountAmount"] = String(discountAmount);
        updateData["taxAmount"] = String(taxAmount);
        updateData["total"] = String(total);
      }
      const quotationResult = await db2.update(quotations).set(updateData).where(eq(quotations.id, id)).returning();
      const quotation = quotationResult[0];
      if (!quotation) {
        throw new NotFoundError("Quotation not found");
      }
      const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
      sendSuccess(res, {
        ...quotation,
        subtotal: Number(quotation.subtotal),
        taxRate: Number(quotation.taxRate || 0),
        taxAmount: Number(quotation.taxAmount || 0),
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        items: items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.unitPrice) * item.quantity
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);
quotationsRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: quotations.id, status: quotations.status }).from(quotations).where(eq(quotations.id, id));
    if (!existing) {
      throw new NotFoundError("Quotation not found");
    }
    const deletableStatuses = ["draft", "rejected", "expired"];
    if (!deletableStatuses.includes(existing.status)) {
      throw new BadRequestError("Only draft, rejected, or expired quotations can be deleted. Sent and accepted quotations must be preserved.");
    }
    await db2.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    await db2.delete(quotations).where(eq(quotations.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/:id/activities", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    const activities = await quotationActivityService.getActivities(id);
    sendSuccess(res, activities);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/:id/revisions", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    const revisions = await quotationRevisionService.getRevisions(id);
    sendSuccess(res, revisions);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/:id/revisions/:revisionId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const revisionId = req.params["revisionId"];
    const revision = await quotationRevisionService.getRevision(revisionId);
    if (!revision) {
      throw new NotFoundError("Revision not found");
    }
    sendSuccess(res, revision);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/:id/revisions/:revisionId/restore", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    const revisionId = req.params["revisionId"];
    const success = await quotationRevisionService.restoreRevision(
      id,
      revisionId,
      req.user?.id,
      req.user?.name
    );
    if (!success) {
      throw new NotFoundError("Revision not found or does not belong to this quotation");
    }
    await quotationActivityService.logUpdated(id, "", ["Restored from previous version"]).catch(() => {
    });
    sendSuccess(res, { message: "Quotation restored from revision successfully" });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/:id/revisions/:revisionId/compare", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    const revisionId = req.params["revisionId"];
    const compareWith = req.query["compareWith"];
    const comparison = await quotationRevisionService.compareRevisions(id, revisionId, compareWith);
    if (!comparison) {
      throw new NotFoundError("Revision not found");
    }
    sendSuccess(res, comparison);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/:id/pdf", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const templateId = req.query["templateId"];
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    const items = await db2.select({
      id: quotationItems.id,
      quotationId: quotationItems.quotationId,
      productId: quotationItems.productId,
      variantId: quotationItems.variantId,
      name: quotationItems.name,
      description: quotationItems.description,
      sku: quotationItems.sku,
      quantity: quotationItems.quantity,
      unitPrice: quotationItems.unitPrice,
      createdAt: quotationItems.createdAt,
      productSlug: products.slug
    }).from(quotationItems).leftJoin(products, eq(quotationItems.productId, products.id)).where(eq(quotationItems.quotationId, id));
    const websiteUrl = process.env["WEB_URL"] || "https://lab404electronics.com";
    const companySettings = await db2.select().from(settings).where(
      or(
        eq(settings.key, "company_name"),
        eq(settings.key, "company_address"),
        eq(settings.key, "company_phone"),
        eq(settings.key, "company_email"),
        eq(settings.key, "company_website"),
        eq(settings.key, "quotation_terms")
      )
    );
    const settingsMap = new Map(companySettings.map((s) => [s.key, s.value]));
    let template = null;
    if (templateId) {
      [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.id, templateId));
    } else if (quotation.pdfTemplateId) {
      [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.id, quotation.pdfTemplateId));
    } else {
      [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.isDefault, true)).limit(1);
    }
    const templateConfig = template ? {
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
      logoUrl: template.logoUrl || void 0,
      showCompanyLogo: template.showCompanyLogo,
      showLineItemImages: template.showLineItemImages,
      showLineItemDescription: template.showLineItemDescription,
      showSku: template.showSku,
      headerText: template.headerText || void 0,
      footerText: template.footerText || void 0,
      thankYouMessage: template.thankYouMessage || void 0
    } : void 0;
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      validUntil: quotation.validUntil,
      status: quotation.status,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || void 0,
      customerCompany: quotation.customerCompany || void 0,
      items: items.map((item) => ({
        productName: item.name,
        sku: item.sku || "",
        description: item.description || void 0,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
        variantOptions: void 0,
        productUrl: item.productSlug ? `${websiteUrl}/products/${item.productSlug}` : void 0
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0,
      // Not in schema
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,
      notes: quotation.notes || void 0,
      terms: quotation.termsAndConditions || settingsMap.get("quotation_terms") || void 0,
      companyName: settingsMap.get("company_name") || "Lab404 Electronics",
      companyAddress: settingsMap.get("company_address") || "",
      companyPhone: settingsMap.get("company_phone") || "",
      companyEmail: settingsMap.get("company_email") || "",
      companyWebsite: settingsMap.get("company_website") || void 0
    }, templateConfig);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${quotation.quotationNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/:id/send", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    if (quotation.status !== "draft") {
      throw new BadRequestError("Only draft quotations can be sent");
    }
    const items = await db2.select({
      id: quotationItems.id,
      quotationId: quotationItems.quotationId,
      productId: quotationItems.productId,
      variantId: quotationItems.variantId,
      name: quotationItems.name,
      description: quotationItems.description,
      sku: quotationItems.sku,
      quantity: quotationItems.quantity,
      unitPrice: quotationItems.unitPrice,
      createdAt: quotationItems.createdAt,
      productSlug: products.slug
    }).from(quotationItems).leftJoin(products, eq(quotationItems.productId, products.id)).where(eq(quotationItems.quotationId, id));
    const websiteUrl = process.env["WEB_URL"] || "https://lab404electronics.com";
    const settingsRows = await db2.select().from(settings).where(
      or(
        eq(settings.key, "company_name"),
        eq(settings.key, "company_email"),
        eq(settings.key, "company_phone"),
        eq(settings.key, "company_address"),
        eq(settings.key, "company_website"),
        eq(settings.key, "quotation_terms")
      )
    );
    const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));
    let templateConfig = {};
    if (quotation.pdfTemplateId) {
      const [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.id, quotation.pdfTemplateId));
      if (template) {
        templateConfig = {
          primaryColor: template.primaryColor || void 0,
          accentColor: template.accentColor || void 0,
          logoUrl: template.logoUrl || void 0,
          showCompanyLogo: template.showCompanyLogo ?? true,
          showLineItemImages: template.showLineItemImages ?? false,
          headerText: template.headerText || void 0,
          footerText: template.footerText || void 0
        };
      }
    }
    const companyName = settingsMap.get("company_name") || "Lab404 Electronics";
    const companyEmail = settingsMap.get("company_email") || void 0;
    const companyPhone = settingsMap.get("company_phone") || void 0;
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || void 0,
      customerCompany: quotation.customerCompany || void 0,
      customerAddress: quotation.customerAddress,
      status: quotation.status,
      validUntil: quotation.validUntil || void 0,
      createdAt: quotation.createdAt,
      items: items.map((item) => ({
        productName: item.name,
        description: item.description || void 0,
        sku: item.sku || void 0,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
        productUrl: item.productSlug ? `${websiteUrl}/products/${item.productSlug}` : void 0
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0,
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,
      notes: quotation.notes || void 0,
      terms: quotation.termsAndConditions || settingsMap.get("quotation_terms") || void 0,
      companyName,
      companyAddress: settingsMap.get("company_address") || "",
      companyPhone: companyPhone || "",
      companyEmail: companyEmail || "",
      companyWebsite: settingsMap.get("company_website") || void 0
    }, templateConfig);
    const emailSent = await notificationService.sendQuotationToCustomer(
      {
        quotationNumber: quotation.quotationNumber,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        total: Number(quotation.total),
        validUntil: quotation.validUntil || null,
        currency: quotation.currency,
        itemCount: items.length,
        companyName,
        companyEmail,
        companyPhone
      },
      pdfBuffer
    );
    if (!emailSent) {
      logger.warn("Email not sent - SMTP may not be configured", {
        quotationId: id,
        customerEmail: quotation.customerEmail
      });
    }
    const acceptanceToken = generateSecureToken(32);
    const tokenExpiresAt = /* @__PURE__ */ new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);
    const validDays = quotation.validDays || 30;
    const newValidUntil = /* @__PURE__ */ new Date();
    newValidUntil.setDate(newValidUntil.getDate() + validDays);
    await db2.update(quotations).set({
      status: "sent",
      validUntil: newValidUntil,
      acceptanceToken,
      tokenExpiresAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(quotations.id, id));
    await quotationActivityService.logSent(id, quotation.customerEmail);
    const baseUrl = process.env["WEB_APP_URL"] || "http://localhost:3000";
    const acceptanceLink = `${baseUrl}/quotations/view/${acceptanceToken}`;
    sendSuccess(res, {
      message: emailSent ? "Quotation sent successfully" : "Quotation marked as sent (email not configured)",
      emailSent,
      quotationNumber: quotation.quotationNumber,
      sentTo: quotation.customerEmail,
      acceptanceLink
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/:id/convert-to-order", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    if (quotation.status !== "accepted") {
      throw new BadRequestError("Only accepted quotations can be converted to orders");
    }
    if (quotation.convertedToOrderId) {
      throw new BadRequestError("Quotation has already been converted to an order");
    }
    sendSuccess(res, {
      message: "Order creation from quotation not yet implemented",
      quotationId: quotation.id
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/:id/duplicate", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [original] = await db2.select().from(quotations).where(eq(quotations.id, id));
    if (!original) {
      throw new NotFoundError("Quotation not found");
    }
    const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    const countResult = await db2.select({ count: sql`count(*)` }).from(quotations);
    const count2 = countResult[0]?.count ?? 0;
    const quotationNumber = generateQuotationNumber(Number(count2) + 1);
    const validUntil = /* @__PURE__ */ new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    const [newQuotation] = await db2.insert(quotations).values({
      quotationNumber,
      customerId: original.customerId,
      customerName: original.customerName,
      customerEmail: original.customerEmail,
      customerPhone: original.customerPhone,
      customerCompany: original.customerCompany,
      status: "draft",
      currency: original.currency,
      subtotal: original.subtotal,
      taxRate: original.taxRate,
      taxAmount: original.taxAmount,
      discountAmount: original.discountAmount,
      total: original.total,
      validUntil,
      notes: original.notes,
      termsAndConditions: original.termsAndConditions
    }).returning();
    if (!newQuotation) {
      throw new BadRequestError("Failed to create quotation");
    }
    for (const item of items) {
      await db2.insert(quotationItems).values({
        quotationId: newQuotation.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      });
    }
    await quotationActivityService.logDuplicated(
      original.id,
      newQuotation.id,
      newQuotation.quotationNumber
    );
    await quotationActivityService.logCreated(
      newQuotation.id,
      newQuotation.quotationNumber
    );
    sendCreated(res, {
      id: newQuotation.id,
      quotationNumber: newQuotation.quotationNumber,
      status: newQuotation.status,
      total: Number(newQuotation.total),
      validUntil: newQuotation.validUntil,
      duplicatedFrom: original.quotationNumber
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/public/:token", async (req, res, next) => {
  try {
    const db2 = getDb();
    const token = req.params["token"];
    if (!token || token.length !== 64) {
      throw new BadRequestError("Invalid token");
    }
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.acceptanceToken, token));
    if (!quotation) {
      throw new NotFoundError("Quotation not found or link has expired");
    }
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < /* @__PURE__ */ new Date()) {
      throw new BadRequestError("This quotation link has expired");
    }
    const items = await db2.select().from(quotationItems).where(eq(quotationItems.quotationId, quotation.id));
    if (!quotation.viewedAt) {
      await db2.update(quotations).set({ viewedAt: /* @__PURE__ */ new Date() }).where(eq(quotations.id, quotation.id));
      await quotationActivityService.logViewed(quotation.id, quotation.customerName);
    }
    const settingsRows = await db2.select().from(settings).where(
      or(
        eq(settings.key, "company_name"),
        eq(settings.key, "company_email"),
        eq(settings.key, "company_phone"),
        eq(settings.key, "company_address"),
        eq(settings.key, "company_website")
      )
    );
    const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));
    sendSuccess(res, {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      status: quotation.status,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerCompany: quotation.customerCompany,
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      validUntil: quotation.validUntil,
      createdAt: quotation.createdAt,
      company: {
        name: settingsMap.get("company_name") || "Lab404 Electronics",
        email: settingsMap.get("company_email"),
        phone: settingsMap.get("company_phone"),
        address: settingsMap.get("company_address"),
        website: settingsMap.get("company_website")
      },
      canAccept: quotation.status === "sent",
      canReject: quotation.status === "sent"
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.post("/public/:token/accept", async (req, res, next) => {
  try {
    const db2 = getDb();
    const token = req.params["token"];
    if (!token || token.length !== 64) {
      throw new BadRequestError("Invalid token");
    }
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.acceptanceToken, token));
    if (!quotation) {
      throw new NotFoundError("Quotation not found or link has expired");
    }
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < /* @__PURE__ */ new Date()) {
      throw new BadRequestError("This quotation link has expired");
    }
    if (quotation.status !== "sent") {
      throw new BadRequestError(`Quotation cannot be accepted (current status: ${quotation.status})`);
    }
    await db2.update(quotations).set({
      status: "accepted",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(quotations.id, quotation.id));
    await quotationActivityService.logAccepted(quotation.id, quotation.customerName);
    sendSuccess(res, {
      message: "Quotation accepted successfully",
      quotationNumber: quotation.quotationNumber,
      status: "accepted"
    });
  } catch (error) {
    next(error);
  }
});
var rejectQuotationSchema = import_zod11.z.object({
  reason: import_zod11.z.string().max(1e3).optional()
});
quotationsRoutes.post("/public/:token/reject", validateBody(rejectQuotationSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const token = req.params["token"];
    const { reason } = req.body;
    if (!token || token.length !== 64) {
      throw new BadRequestError("Invalid token");
    }
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.acceptanceToken, token));
    if (!quotation) {
      throw new NotFoundError("Quotation not found or link has expired");
    }
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < /* @__PURE__ */ new Date()) {
      throw new BadRequestError("This quotation link has expired");
    }
    if (quotation.status !== "sent") {
      throw new BadRequestError(`Quotation cannot be rejected (current status: ${quotation.status})`);
    }
    await db2.update(quotations).set({
      status: "rejected",
      notes: reason ? `${quotation.notes || ""}

Rejection reason: ${reason}`.trim() : quotation.notes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(quotations.id, quotation.id));
    await quotationActivityService.logRejected(quotation.id, reason, quotation.customerName);
    sendSuccess(res, {
      message: "Quotation rejected",
      quotationNumber: quotation.quotationNumber,
      status: "rejected"
    });
  } catch (error) {
    next(error);
  }
});
quotationsRoutes.get("/public/:token/pdf", async (req, res, next) => {
  try {
    const db2 = getDb();
    const token = req.params["token"];
    if (!token || token.length !== 64) {
      throw new BadRequestError("Invalid token");
    }
    const [quotation] = await db2.select().from(quotations).where(eq(quotations.acceptanceToken, token));
    if (!quotation) {
      throw new NotFoundError("Quotation not found or link has expired");
    }
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < /* @__PURE__ */ new Date()) {
      throw new BadRequestError("This quotation link has expired");
    }
    const items = await db2.select({
      id: quotationItems.id,
      quotationId: quotationItems.quotationId,
      productId: quotationItems.productId,
      variantId: quotationItems.variantId,
      name: quotationItems.name,
      description: quotationItems.description,
      sku: quotationItems.sku,
      quantity: quotationItems.quantity,
      unitPrice: quotationItems.unitPrice,
      createdAt: quotationItems.createdAt,
      productSlug: products.slug
    }).from(quotationItems).leftJoin(products, eq(quotationItems.productId, products.id)).where(eq(quotationItems.quotationId, quotation.id));
    const websiteUrl = process.env["WEB_URL"] || "https://lab404electronics.com";
    const settingsRows = await db2.select().from(settings).where(
      or(
        eq(settings.key, "company_name"),
        eq(settings.key, "company_email"),
        eq(settings.key, "company_phone"),
        eq(settings.key, "company_address"),
        eq(settings.key, "company_website"),
        eq(settings.key, "quotation_terms")
      )
    );
    const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || void 0,
      customerCompany: quotation.customerCompany || void 0,
      customerAddress: quotation.customerAddress,
      status: quotation.status,
      validUntil: quotation.validUntil || void 0,
      createdAt: quotation.createdAt,
      items: items.map((item) => ({
        productName: item.name,
        description: item.description || void 0,
        sku: item.sku || void 0,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
        productUrl: item.productSlug ? `${websiteUrl}/products/${item.productSlug}` : void 0
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0,
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,
      notes: quotation.notes || void 0,
      terms: quotation.termsAndConditions || settingsMap.get("quotation_terms") || void 0,
      companyName: settingsMap.get("company_name") || "Lab404 Electronics",
      companyAddress: settingsMap.get("company_address") || "",
      companyPhone: settingsMap.get("company_phone") || "",
      companyEmail: settingsMap.get("company_email") || "",
      companyWebsite: settingsMap.get("company_website") || void 0
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${quotation.quotationNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// src/routes/quotation-templates.routes.ts
var import_express10 = require("express");
var import_zod12 = require("zod");
var quotationTemplatesRoutes = (0, import_express10.Router)();
var templateItemSchema = import_zod12.z.object({
  productId: import_zod12.z.string().uuid().optional(),
  name: import_zod12.z.string().min(1).max(200),
  description: import_zod12.z.string().max(1e3).optional(),
  sku: import_zod12.z.string().max(100).optional(),
  quantity: import_zod12.z.number().int().min(1),
  unitPrice: import_zod12.z.number().min(0)
});
var createTemplateSchema = import_zod12.z.object({
  name: import_zod12.z.string().min(1).max(255),
  description: import_zod12.z.string().max(2e3).optional(),
  items: import_zod12.z.array(templateItemSchema).min(1),
  defaultDiscount: import_zod12.z.number().min(0).optional(),
  defaultDiscountType: import_zod12.z.enum(["percentage", "fixed"]).optional(),
  defaultTaxRate: import_zod12.z.number().min(0).max(1).optional(),
  defaultValidDays: import_zod12.z.number().int().min(1).max(365).optional(),
  defaultTerms: import_zod12.z.string().max(5e3).optional()
});
var updateTemplateSchema = import_zod12.z.object({
  name: import_zod12.z.string().min(1).max(255).optional(),
  description: import_zod12.z.string().max(2e3).optional().nullable(),
  items: import_zod12.z.array(templateItemSchema).min(1).optional(),
  defaultDiscount: import_zod12.z.number().min(0).optional().nullable(),
  defaultDiscountType: import_zod12.z.enum(["percentage", "fixed"]).optional().nullable(),
  defaultTaxRate: import_zod12.z.number().min(0).max(1).optional().nullable(),
  defaultValidDays: import_zod12.z.number().int().min(1).max(365).optional(),
  defaultTerms: import_zod12.z.string().max(5e3).optional().nullable(),
  isActive: import_zod12.z.boolean().optional()
});
quotationTemplatesRoutes.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const activeOnly = req.query["activeOnly"] !== "false";
    const baseQuery = db2.select().from(quotationTemplates);
    const templates = activeOnly ? await baseQuery.where(eq(quotationTemplates.isActive, 1)).orderBy(desc(quotationTemplates.createdAt)) : await baseQuery.orderBy(desc(quotationTemplates.createdAt));
    sendSuccess(res, templates.map((t) => ({
      ...t,
      defaultDiscount: t.defaultDiscount ? Number(t.defaultDiscount) : null,
      defaultTaxRate: t.defaultTaxRate ? Number(t.defaultTaxRate) : null,
      isActive: Boolean(t.isActive)
    })));
  } catch (error) {
    next(error);
  }
});
quotationTemplatesRoutes.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [template] = await db2.select().from(quotationTemplates).where(eq(quotationTemplates.id, id));
    if (!template) {
      throw new NotFoundError("Template not found");
    }
    sendSuccess(res, {
      ...template,
      defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
      defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
      isActive: Boolean(template.isActive)
    });
  } catch (error) {
    next(error);
  }
});
quotationTemplatesRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createTemplateSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      const [template] = await db2.insert(quotationTemplates).values({
        name: data["name"],
        description: data["description"],
        items: data["items"],
        defaultDiscount: data["defaultDiscount"] ? String(data["defaultDiscount"]) : null,
        defaultDiscountType: data["defaultDiscountType"],
        defaultTaxRate: data["defaultTaxRate"] ? String(data["defaultTaxRate"]) : null,
        defaultValidDays: data["defaultValidDays"],
        defaultTerms: data["defaultTerms"]
      }).returning();
      if (!template) {
        throw new NotFoundError("Failed to create template");
      }
      sendCreated(res, {
        ...template,
        defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
        defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
        isActive: Boolean(template.isActive)
      });
    } catch (error) {
      next(error);
    }
  }
);
quotationTemplatesRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(quotationTemplates).where(eq(quotationTemplates.id, id));
      if (!existing) {
        throw new NotFoundError("Template not found");
      }
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data["name"] !== void 0) {
        updateData["name"] = data["name"];
      }
      if (data["description"] !== void 0) {
        updateData["description"] = data["description"];
      }
      if (data["items"] !== void 0) {
        updateData["items"] = data["items"];
      }
      if (data["defaultDiscount"] !== void 0) {
        updateData["defaultDiscount"] = data["defaultDiscount"] !== null ? String(data["defaultDiscount"]) : null;
      }
      if (data["defaultDiscountType"] !== void 0) {
        updateData["defaultDiscountType"] = data["defaultDiscountType"];
      }
      if (data["defaultTaxRate"] !== void 0) {
        updateData["defaultTaxRate"] = data["defaultTaxRate"] !== null ? String(data["defaultTaxRate"]) : null;
      }
      if (data["defaultValidDays"] !== void 0) {
        updateData["defaultValidDays"] = data["defaultValidDays"];
      }
      if (data["defaultTerms"] !== void 0) {
        updateData["defaultTerms"] = data["defaultTerms"];
      }
      if (data["isActive"] !== void 0) {
        updateData["isActive"] = data["isActive"] ? 1 : 0;
      }
      const [template] = await db2.update(quotationTemplates).set(updateData).where(eq(quotationTemplates.id, id)).returning();
      if (!template) {
        throw new NotFoundError("Template not found");
      }
      sendSuccess(res, {
        ...template,
        defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
        defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
        isActive: Boolean(template.isActive)
      });
    } catch (error) {
      next(error);
    }
  }
);
quotationTemplatesRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select().from(quotationTemplates).where(eq(quotationTemplates.id, id));
    if (!existing) {
      throw new NotFoundError("Template not found");
    }
    await db2.delete(quotationTemplates).where(eq(quotationTemplates.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// src/routes/blogs.routes.ts
var import_express11 = require("express");
var import_zod13 = require("zod");
var blogsRoutes = (0, import_express11.Router)();
var createBlogSchema = import_zod13.z.object({
  title: import_zod13.z.string().min(1).max(255),
  slug: import_zod13.z.string().max(255).optional(),
  excerpt: import_zod13.z.string().max(500).optional(),
  content: import_zod13.z.string().min(1),
  featuredImageUrl: import_zod13.z.string().url().optional(),
  tags: import_zod13.z.array(import_zod13.z.string()).optional(),
  status: import_zod13.z.enum(["draft", "published"]).optional().default("draft"),
  publishedAt: import_zod13.z.string().datetime().optional(),
  metaTitle: import_zod13.z.string().max(100).optional(),
  metaDescription: import_zod13.z.string().max(200).optional()
});
var updateBlogSchema = createBlogSchema.partial();
var blogFiltersSchema = import_zod13.z.object({
  page: import_zod13.z.string().optional(),
  limit: import_zod13.z.string().optional(),
  search: import_zod13.z.string().optional(),
  status: import_zod13.z.enum(["draft", "published"]).optional(),
  tag: import_zod13.z.string().optional()
});
blogsRoutes.get("/", validateQuery(blogFiltersSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { search, tag } = req.query;
    const isAdmin = req.user?.role === "admin";
    const conditions = [];
    if (!isAdmin) {
      conditions.push(eq(blogs.status, "published"));
      conditions.push(lte(blogs.publishedAt, /* @__PURE__ */ new Date()));
    }
    if (search) {
      conditions.push(
        or(
          like(blogs.title, `%${search}%`),
          like(blogs.excerpt, `%${search}%`)
        )
      );
    }
    if (tag) {
      conditions.push(sql`${tag} = ANY(${blogs.tags})`);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const countResult = await db2.select({ count: sql`count(*)` }).from(blogs).where(whereClause);
    const count2 = countResult[0]?.count ?? 0;
    const blogList = await db2.select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      excerpt: blogs.excerpt,
      featuredImageUrl: blogs.featuredImageUrl,
      tags: blogs.tags,
      status: blogs.status,
      publishedAt: blogs.publishedAt,
      createdAt: blogs.createdAt
    }).from(blogs).where(whereClause).orderBy(desc(blogs.publishedAt)).limit(limit).offset(offset);
    sendSuccess(res, blogList, 200, createPaginationMeta(page, limit, Number(count2)));
  } catch (error) {
    next(error);
  }
});
blogsRoutes.get("/tags", async (_req, res, next) => {
  try {
    const db2 = getDb();
    const result = await db2.select({ tags: blogs.tags }).from(blogs).where(eq(blogs.status, "published"));
    const allTags = result.flatMap((r) => r.tags || []).filter((tag, index2, self) => self.indexOf(tag) === index2).sort();
    sendSuccess(res, allTags);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.get("/:slug", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { slug } = req.params;
    const isAdmin = req.user?.role === "admin";
    const [blog] = await db2.select().from(blogs).where(eq(blogs.slug, slug));
    if (!blog) {
      throw new NotFoundError("Blog post not found");
    }
    if (!isAdmin && blog.status !== "published") {
      throw new NotFoundError("Blog post not found");
    }
    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.get("/:slug/related", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { slug } = req.params;
    const limitParam = parseInt(req.query["limit"]) || 3;
    const [currentBlog] = await db2.select({ id: blogs.id, tags: blogs.tags }).from(blogs).where(eq(blogs.slug, slug));
    if (!currentBlog) {
      throw new NotFoundError("Blog post not found");
    }
    let relatedPosts = [];
    if (currentBlog.tags && currentBlog.tags.length > 0) {
      relatedPosts = await db2.select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        excerpt: blogs.excerpt,
        featuredImageUrl: blogs.featuredImageUrl,
        publishedAt: blogs.publishedAt
      }).from(blogs).where(
        and(
          eq(blogs.status, "published"),
          sql`${blogs.id} != ${currentBlog.id}`,
          sql`${blogs.tags} && ${currentBlog.tags}`
          // Array overlap
        )
      ).orderBy(desc(blogs.publishedAt)).limit(limitParam);
    }
    if (relatedPosts.length < limitParam) {
      const existing = relatedPosts.map((p) => p.id);
      const needed = limitParam - relatedPosts.length;
      const recentPosts = await db2.select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        excerpt: blogs.excerpt,
        featuredImageUrl: blogs.featuredImageUrl,
        publishedAt: blogs.publishedAt
      }).from(blogs).where(
        and(
          eq(blogs.status, "published"),
          sql`${blogs.id} != ${currentBlog.id}`,
          existing.length > 0 ? sql`${blogs.id} != ALL(${existing})` : sql`true`
        )
      ).orderBy(desc(blogs.publishedAt)).limit(needed);
      relatedPosts = [...relatedPosts, ...recentPosts];
    }
    sendSuccess(res, relatedPosts);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  validateQuery(blogFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search, status, tag } = req.query;
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(blogs.title, `%${search}%`),
            like(blogs.excerpt, `%${search}%`)
          )
        );
      }
      if (status) {
        conditions.push(eq(blogs.status, status));
      }
      if (tag) {
        conditions.push(sql`${tag} = ANY(${blogs.tags})`);
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(blogs).where(whereClause);
      const count2 = countResult[0]?.count ?? 0;
      const blogList = await db2.select().from(blogs).where(whereClause).orderBy(desc(blogs.createdAt)).limit(limit).offset(offset);
      sendSuccess(res, blogList, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);
blogsRoutes.get(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const [blog] = await db2.select().from(blogs).where(eq(blogs.id, id));
      if (!blog) {
        throw new NotFoundError("Blog post not found");
      }
      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }
);
blogsRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createBlogSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      let slug = data.slug || generateSlug(data.title);
      const [existingSlug] = await db2.select({ id: blogs.id }).from(blogs).where(eq(blogs.slug, slug));
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      let publishedAt = data.publishedAt ? new Date(data.publishedAt) : void 0;
      if (data.status === "published" && !publishedAt) {
        publishedAt = /* @__PURE__ */ new Date();
      }
      let excerpt = data.excerpt;
      if (!excerpt && data.content) {
        const plainText = data.content.replace(/<[^>]*>/g, "");
        excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? "..." : "");
      }
      const sanitizedContent = sanitizeRichContent(data.content);
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user?.id || "");
      const [blog] = await db2.insert(blogs).values({
        title: data.title,
        slug,
        excerpt,
        content: sanitizedContent,
        featuredImageUrl: data.featuredImageUrl,
        tags: data.tags || [],
        status: data.status || "draft",
        publishedAt,
        metaTitle: data.metaTitle || data.title,
        metaDescription: data.metaDescription || excerpt,
        authorId: isValidUuid ? req.user?.id : void 0,
        authorName: req.user?.email?.split("@")[0] || "Admin"
      }).returning();
      sendCreated(res, blog);
    } catch (error) {
      next(error);
    }
  }
);
blogsRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateBlogSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select().from(blogs).where(eq(blogs.id, id));
      if (!existing) {
        throw new NotFoundError("Blog post not found");
      }
      const updateData = {
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data["content"]) {
        updateData["content"] = sanitizeRichContent(data["content"]);
      }
      if (data.slug && data.slug !== existing.slug) {
        const [existingSlug] = await db2.select({ id: blogs.id }).from(blogs).where(and(eq(blogs.slug, data.slug), sql`${blogs.id} != ${id}`));
        if (existingSlug) {
          throw new ConflictError("Slug already exists");
        }
      }
      if (data["publishedAt"]) {
        updateData["publishedAt"] = new Date(data["publishedAt"]);
      } else if (data.status === "published" && !existing.publishedAt) {
        updateData["publishedAt"] = /* @__PURE__ */ new Date();
      }
      const [blog] = await db2.update(blogs).set(updateData).where(eq(blogs.id, id)).returning();
      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }
);
blogsRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: blogs.id }).from(blogs).where(eq(blogs.id, id));
    if (!existing) {
      throw new NotFoundError("Blog post not found");
    }
    await db2.delete(blogs).where(eq(blogs.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.post("/:id/publish", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select().from(blogs).where(eq(blogs.id, id));
    if (!existing) {
      throw new NotFoundError("Blog post not found");
    }
    const [blog] = await db2.update(blogs).set({
      status: "published",
      publishedAt: existing.publishedAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(blogs.id, id)).returning();
    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.post("/:id/unpublish", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: blogs.id }).from(blogs).where(eq(blogs.id, id));
    if (!existing) {
      throw new NotFoundError("Blog post not found");
    }
    const [blog] = await db2.update(blogs).set({
      status: "draft",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(blogs.id, id)).returning();
    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});
blogsRoutes.post("/:id/duplicate", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [original] = await db2.select().from(blogs).where(eq(blogs.id, id));
    if (!original) {
      throw new NotFoundError("Blog post not found");
    }
    const slug = `${original.slug}-copy-${Date.now()}`;
    const [blog] = await db2.insert(blogs).values({
      title: `${original.title} (Copy)`,
      slug,
      excerpt: original.excerpt,
      content: original.content,
      featuredImageUrl: original.featuredImageUrl,
      tags: original.tags,
      status: "draft",
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      authorId: req.user?.id
    }).returning();
    sendCreated(res, blog);
  } catch (error) {
    next(error);
  }
});

// src/routes/settings.routes.ts
var import_express12 = require("express");
var import_zod14 = require("zod");
var settingsRoutes = (0, import_express12.Router)();
var DEFAULT_BUSINESS = {
  business_name: "Lab404 Electronics",
  business_email: "info@lab404.com",
  business_phone: "",
  business_address: "",
  currency: "USD",
  currency_symbol: "$"
};
var DEFAULT_TAX = {
  tax_rate: 0,
  tax_label: "VAT",
  tax_enabled: false
};
var DEFAULT_DELIVERY = {
  delivery_fee: 0,
  delivery_enabled: false,
  free_delivery_threshold: 0,
  delivery_time_min: 7,
  delivery_time_max: 14
};
var DEFAULT_NOTIFICATIONS = {
  email_notifications: true,
  sound_notifications: true,
  low_stock_notifications: true,
  new_order_notifications: true
};
var DEFAULT_SYSTEM = {
  site_title: "Lab404 Electronics",
  site_description: "Your trusted electronics store",
  maintenance_mode: false,
  allow_guest_checkout: true,
  max_cart_items: 99
};
var activityLogFiltersSchema = import_zod14.z.object({
  page: import_zod14.z.string().optional(),
  limit: import_zod14.z.string().optional(),
  adminId: import_zod14.z.string().uuid().optional(),
  action: import_zod14.z.string().optional(),
  entityType: import_zod14.z.string().optional(),
  startDate: import_zod14.z.string().optional(),
  endDate: import_zod14.z.string().optional()
});
var updateAdminSettingsSchema = import_zod14.z.object({
  // Business/Store Info
  business_name: import_zod14.z.string().min(1).optional(),
  business_email: import_zod14.z.string().email().optional(),
  business_phone: import_zod14.z.string().optional(),
  business_address: import_zod14.z.string().optional(),
  currency: import_zod14.z.string().optional(),
  currency_symbol: import_zod14.z.string().optional(),
  // Tax
  tax_rate: import_zod14.z.number().min(0).max(100).optional(),
  tax_label: import_zod14.z.string().optional(),
  tax_enabled: import_zod14.z.boolean().optional(),
  // Delivery/Shipping
  delivery_fee: import_zod14.z.number().min(0).optional(),
  delivery_enabled: import_zod14.z.boolean().optional(),
  free_delivery_threshold: import_zod14.z.number().min(0).optional(),
  // System
  site_title: import_zod14.z.string().optional(),
  site_description: import_zod14.z.string().optional(),
  low_stock_threshold: import_zod14.z.number().min(0).optional(),
  // Notifications
  email_notifications: import_zod14.z.boolean().optional(),
  low_stock_notifications: import_zod14.z.boolean().optional(),
  new_order_notifications: import_zod14.z.boolean().optional()
});
async function updateGroupedSetting(db2, key, updates, description) {
  const [existing] = await db2.select().from(settings).where(eq(settings.key, key));
  let currentValue;
  if (existing && existing.value) {
    currentValue = existing.value;
  } else {
    switch (key) {
      case "business":
        currentValue = DEFAULT_BUSINESS;
        break;
      case "tax":
        currentValue = DEFAULT_TAX;
        break;
      case "delivery":
        currentValue = DEFAULT_DELIVERY;
        break;
      case "notifications":
        currentValue = DEFAULT_NOTIFICATIONS;
        break;
      case "system":
        currentValue = DEFAULT_SYSTEM;
        break;
      default:
        currentValue = {};
    }
  }
  const newValue = { ...currentValue, ...updates };
  if (existing) {
    await db2.update(settings).set({ value: newValue, updatedAt: /* @__PURE__ */ new Date() }).where(eq(settings.key, key));
  } else {
    await db2.insert(settings).values({
      key,
      value: newValue,
      description
    });
  }
  return newValue;
}
settingsRoutes.get("/public", async (_req, res, next) => {
  try {
    const db2 = getDb();
    const [businessRow, taxRow, deliveryRow, systemRow] = await Promise.all([
      db2.select().from(settings).where(eq(settings.key, "business")),
      db2.select().from(settings).where(eq(settings.key, "tax")),
      db2.select().from(settings).where(eq(settings.key, "delivery")),
      db2.select().from(settings).where(eq(settings.key, "system"))
    ]);
    const business = businessRow[0]?.value || DEFAULT_BUSINESS;
    const tax = taxRow[0]?.value || DEFAULT_TAX;
    const delivery = deliveryRow[0]?.value || DEFAULT_DELIVERY;
    const system = systemRow[0]?.value || DEFAULT_SYSTEM;
    sendSuccess(res, {
      // Business
      company_name: business.business_name,
      company_email: business.business_email,
      company_phone: business.business_phone,
      company_address: business.business_address,
      currency: business.currency,
      currency_symbol: business.currency_symbol,
      // Tax
      tax_rate: tax.tax_rate,
      tax_label: tax.tax_label,
      tax_enabled: tax.tax_enabled,
      // Delivery
      delivery_fee: delivery.delivery_fee,
      delivery_enabled: delivery.delivery_enabled,
      free_delivery_threshold: delivery.free_delivery_threshold,
      // System
      site_title: system.site_title,
      site_description: system.site_description
    });
  } catch (error) {
    next(error);
  }
});
settingsRoutes.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const db2 = getDb();
    const [businessRow, taxRow, deliveryRow, notificationsRow, systemRow] = await Promise.all([
      db2.select().from(settings).where(eq(settings.key, "business")),
      db2.select().from(settings).where(eq(settings.key, "tax")),
      db2.select().from(settings).where(eq(settings.key, "delivery")),
      db2.select().from(settings).where(eq(settings.key, "notifications")),
      db2.select().from(settings).where(eq(settings.key, "system"))
    ]);
    const business = { ...DEFAULT_BUSINESS, ...businessRow[0]?.value || {} };
    const tax = { ...DEFAULT_TAX, ...taxRow[0]?.value || {} };
    const delivery = { ...DEFAULT_DELIVERY, ...deliveryRow[0]?.value || {} };
    const notifications = { ...DEFAULT_NOTIFICATIONS, ...notificationsRow[0]?.value || {} };
    const system = { ...DEFAULT_SYSTEM, ...systemRow[0]?.value || {} };
    sendSuccess(res, {
      // Store/Business Information
      business_name: business.business_name,
      business_email: business.business_email,
      business_phone: business.business_phone,
      business_address: business.business_address,
      // Currency
      currency: business.currency,
      currency_symbol: business.currency_symbol,
      // Tax
      tax_rate: tax.tax_rate,
      tax_label: tax.tax_label,
      tax_enabled: tax.tax_enabled,
      // Delivery/Shipping
      delivery_fee: delivery.delivery_fee,
      delivery_enabled: delivery.delivery_enabled,
      free_delivery_threshold: delivery.free_delivery_threshold,
      delivery_time_min: delivery.delivery_time_min,
      delivery_time_max: delivery.delivery_time_max,
      // Notifications
      email_notifications: notifications.email_notifications,
      sound_notifications: notifications.sound_notifications,
      low_stock_notifications: notifications.low_stock_notifications,
      new_order_notifications: notifications.new_order_notifications,
      // System
      site_title: system.site_title,
      site_description: system.site_description,
      maintenance_mode: system.maintenance_mode,
      allow_guest_checkout: system.allow_guest_checkout,
      max_cart_items: system.max_cart_items
    });
  } catch (error) {
    next(error);
  }
});
settingsRoutes.put(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(updateAdminSettingsSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const updates = req.body;
      const updatedGroups = [];
      const businessUpdates = {};
      const taxUpdates = {};
      const deliveryUpdates = {};
      const notificationUpdates = {};
      const systemUpdates = {};
      if (updates.business_name !== void 0) {
        businessUpdates.business_name = updates.business_name;
      }
      if (updates.business_email !== void 0) {
        businessUpdates.business_email = updates.business_email;
      }
      if (updates.business_phone !== void 0) {
        businessUpdates.business_phone = updates.business_phone;
      }
      if (updates.business_address !== void 0) {
        businessUpdates.business_address = updates.business_address;
      }
      if (updates.currency !== void 0) {
        businessUpdates.currency = updates.currency;
      }
      if (updates.currency_symbol !== void 0) {
        businessUpdates.currency_symbol = updates.currency_symbol;
      }
      if (updates.tax_rate !== void 0) {
        taxUpdates.tax_rate = updates.tax_rate;
      }
      if (updates.tax_label !== void 0) {
        taxUpdates.tax_label = updates.tax_label;
      }
      if (updates.tax_enabled !== void 0) {
        taxUpdates.tax_enabled = updates.tax_enabled;
      }
      if (updates.delivery_fee !== void 0) {
        deliveryUpdates.delivery_fee = updates.delivery_fee;
      }
      if (updates.delivery_enabled !== void 0) {
        deliveryUpdates.delivery_enabled = updates.delivery_enabled;
      }
      if (updates.free_delivery_threshold !== void 0) {
        deliveryUpdates.free_delivery_threshold = updates.free_delivery_threshold;
      }
      if (updates.email_notifications !== void 0) {
        notificationUpdates.email_notifications = updates.email_notifications;
      }
      if (updates.low_stock_notifications !== void 0) {
        notificationUpdates.low_stock_notifications = updates.low_stock_notifications;
      }
      if (updates.new_order_notifications !== void 0) {
        notificationUpdates.new_order_notifications = updates.new_order_notifications;
      }
      if (updates.site_title !== void 0) {
        systemUpdates.site_title = updates.site_title;
      }
      if (updates.site_description !== void 0) {
        systemUpdates.site_description = updates.site_description;
      }
      if (Object.keys(businessUpdates).length > 0) {
        await updateGroupedSetting(db2, "business", businessUpdates, "Business settings");
        updatedGroups.push("business");
      }
      if (Object.keys(taxUpdates).length > 0) {
        await updateGroupedSetting(db2, "tax", taxUpdates, "Tax settings");
        updatedGroups.push("tax");
      }
      if (Object.keys(deliveryUpdates).length > 0) {
        await updateGroupedSetting(db2, "delivery", deliveryUpdates, "Delivery settings");
        updatedGroups.push("delivery");
      }
      if (Object.keys(notificationUpdates).length > 0) {
        await updateGroupedSetting(db2, "notifications", notificationUpdates, "Notification settings");
        updatedGroups.push("notifications");
      }
      if (Object.keys(systemUpdates).length > 0) {
        await updateGroupedSetting(db2, "system", systemUpdates, "System settings");
        updatedGroups.push("system");
      }
      if (updatedGroups.length > 0) {
        await db2.insert(adminActivityLogs).values({
          adminUserId: req.user.id,
          action: "update",
          entityType: "settings",
          details: { updatedGroups, updatedFields: Object.keys(updates) }
        });
      }
      sendSuccess(res, {
        message: "Settings updated successfully",
        updatedGroups,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      next(error);
    }
  }
);
settingsRoutes.get("/:key", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const key = req.params["key"];
    const [setting] = await db2.select().from(settings).where(eq(settings.key, key));
    if (!setting) {
      const defaults = {
        business: DEFAULT_BUSINESS,
        tax: DEFAULT_TAX,
        delivery: DEFAULT_DELIVERY,
        notifications: DEFAULT_NOTIFICATIONS,
        system: DEFAULT_SYSTEM
      };
      if (defaults[key]) {
        return sendSuccess(res, {
          key,
          value: defaults[key],
          isDefault: true
        });
      }
      throw new NotFoundError("Setting not found");
    }
    sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
});
settingsRoutes.post("/reset", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const { groups } = req.body;
    const validGroups = ["business", "tax", "delivery", "notifications", "system"];
    if (groups && groups.length > 0) {
      for (const group of groups) {
        if (validGroups.includes(group)) {
          await db2.delete(settings).where(eq(settings.key, group));
        }
      }
    } else {
      for (const group of validGroups) {
        await db2.delete(settings).where(eq(settings.key, group));
      }
    }
    await db2.insert(adminActivityLogs).values({
      adminUserId: req.user.id,
      action: "reset",
      entityType: "settings",
      details: { resetGroups: groups || "all" }
    });
    sendSuccess(res, { message: "Settings reset to defaults" });
  } catch (error) {
    next(error);
  }
});
settingsRoutes.get(
  "/activity-logs",
  requireAuth,
  requireAdmin,
  validateQuery(activityLogFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { adminId, action, entityType, startDate, endDate } = req.query;
      const conditions = [];
      if (adminId) {
        conditions.push(eq(adminActivityLogs.adminUserId, adminId));
      }
      if (action) {
        conditions.push(eq(adminActivityLogs.action, action));
      }
      if (entityType) {
        conditions.push(eq(adminActivityLogs.entityType, entityType));
      }
      if (startDate) {
        conditions.push(gte(adminActivityLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(sql`${adminActivityLogs.createdAt} <= ${end}`);
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(adminActivityLogs).where(whereClause);
      const count2 = countResult[0]?.count ?? 0;
      const logs = await db2.select({
        id: adminActivityLogs.id,
        adminUserId: adminActivityLogs.adminUserId,
        action: adminActivityLogs.action,
        entityType: adminActivityLogs.entityType,
        entityId: adminActivityLogs.entityId,
        details: adminActivityLogs.details,
        ipAddress: adminActivityLogs.ipAddress,
        createdAt: adminActivityLogs.createdAt
      }).from(adminActivityLogs).where(whereClause).orderBy(desc(adminActivityLogs.createdAt)).limit(limit).offset(offset);
      sendSuccess(res, logs, 200, createPaginationMeta(page, limit, Number(count2)));
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/analytics.routes.ts
var import_express13 = require("express");
var import_zod15 = require("zod");
var analyticsRoutes = (0, import_express13.Router)();
analyticsRoutes.use(requireAuth, requireAdmin);
var dateRangeSchema = import_zod15.z.object({
  startDate: import_zod15.z.string().optional(),
  endDate: import_zod15.z.string().optional(),
  period: import_zod15.z.enum(["today", "yesterday", "week", "month", "quarter", "year", "all"]).optional()
});
function getDateRange(query) {
  const now = /* @__PURE__ */ new Date();
  let startDate;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  if (query.period) {
    switch (query.period) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "all":
        startDate = void 0;
        endDate = void 0;
        break;
    }
  } else {
    if (query.startDate) {
      startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0);
    }
    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    }
  }
  return { startDate, endDate };
}
analyticsRoutes.get("/dashboard", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const orderConditions = [];
    if (startDate) {
      orderConditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      orderConditions.push(lte(orders.createdAt, endDate));
    }
    const orderWhere = orderConditions.length > 0 ? and(...orderConditions) : void 0;
    const [revenueResult] = await db2.select({
      totalRevenue: sql`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
      orderCount: sql`COUNT(*)`
    }).from(orders).where(
      and(
        orderWhere,
        eq(orders.paymentStatus, "paid")
      )
    );
    const [pendingResult] = await db2.select({ count: sql`COUNT(*)` }).from(orders).where(
      and(
        orderWhere,
        eq(orders.status, "pending")
      )
    );
    const customerConditions = [];
    if (startDate) {
      customerConditions.push(gte(customers.createdAt, startDate));
    }
    if (endDate) {
      customerConditions.push(lte(customers.createdAt, endDate));
    }
    const customerWhere = customerConditions.length > 0 ? and(...customerConditions) : void 0;
    const [customerResult] = await db2.select({ count: sql`COUNT(*)` }).from(customers).where(customerWhere);
    const averageOrderValue = revenueResult?.orderCount && revenueResult.orderCount > 0 ? Number(revenueResult.totalRevenue) / Number(revenueResult.orderCount) : 0;
    let previousPeriodData = null;
    if (startDate && endDate) {
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const prevEnd = new Date(startDate.getTime() - 1);
      const [prevRevenue] = await db2.select({
        totalRevenue: sql`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
        orderCount: sql`COUNT(*)`
      }).from(orders).where(
        and(
          gte(orders.createdAt, prevStart),
          lte(orders.createdAt, prevEnd),
          eq(orders.paymentStatus, "paid")
        )
      );
      const [prevCustomers] = await db2.select({ count: sql`COUNT(*)` }).from(customers).where(
        and(
          gte(customers.createdAt, prevStart),
          lte(customers.createdAt, prevEnd)
        )
      );
      const currentRevenue = Number(revenueResult?.totalRevenue ?? 0);
      const prevRevenueNum = Number(prevRevenue?.totalRevenue ?? 0);
      previousPeriodData = {
        revenueChange: prevRevenueNum > 0 ? (currentRevenue - prevRevenueNum) / prevRevenueNum * 100 : currentRevenue > 0 ? 100 : 0,
        orderCountChange: Number(prevRevenue?.orderCount ?? 0) > 0 ? (Number(revenueResult?.orderCount ?? 0) - Number(prevRevenue?.orderCount ?? 0)) / Number(prevRevenue?.orderCount ?? 1) * 100 : Number(revenueResult?.orderCount ?? 0) > 0 ? 100 : 0,
        customerCountChange: Number(prevCustomers?.count ?? 0) > 0 ? (Number(customerResult?.count ?? 0) - Number(prevCustomers?.count ?? 0)) / Number(prevCustomers?.count ?? 1) * 100 : Number(customerResult?.count ?? 0) > 0 ? 100 : 0
      };
    }
    sendSuccess(res, {
      totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
      orderCount: Number(revenueResult?.orderCount ?? 0),
      pendingOrders: Number(pendingResult?.count ?? 0),
      customerCount: Number(customerResult?.count ?? 0),
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      previousPeriodComparison: previousPeriodData
    });
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/sales", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const groupBy = req.query["groupBy"] || "day";
    let dateFormat;
    switch (groupBy) {
      case "hour":
        dateFormat = "YYYY-MM-DD HH24:00";
        break;
      case "day":
        dateFormat = "YYYY-MM-DD";
        break;
      case "week":
        dateFormat = "IYYY-IW";
        break;
      case "month":
        dateFormat = "YYYY-MM";
        break;
      default:
        dateFormat = "YYYY-MM-DD";
    }
    const conditions = [eq(orders.paymentStatus, "paid")];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    const periodExpr = sql`TO_CHAR(${orders.createdAt}, ${sql.raw(`'${dateFormat}'`)})`;
    const salesData = await db2.select({
      period: sql`${periodExpr}`,
      revenue: sql`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
      orderCount: sql`COUNT(*)`,
      averageOrderValue: sql`AVG(CAST(${orders.totalSnapshot} AS DECIMAL))`
    }).from(orders).where(and(...conditions)).groupBy(periodExpr).orderBy(periodExpr);
    sendSuccess(res, salesData.map((row) => ({
      period: row.period,
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
      averageOrderValue: Math.round(Number(row.averageOrderValue) * 100) / 100
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/sales/by-status", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const statusData = await db2.select({
      status: orders.status,
      count: sql`COUNT(*)`,
      totalValue: sql`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`
    }).from(orders).where(whereClause).groupBy(orders.status);
    sendSuccess(res, statusData.map((row) => ({
      status: row.status,
      count: Number(row.count),
      totalValue: Number(row.totalValue) || 0
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/products/top-selling", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const limit = parseInt(req.query["limit"]) || 10;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    conditions.push(eq(orders.paymentStatus, "paid"));
    const topProducts = await db2.select({
      productId: orderItems.productId,
      productName: orderItems.productNameSnapshot,
      totalQuantity: sql`SUM(${orderItems.quantity})`,
      totalRevenue: sql`SUM(CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity})`,
      orderCount: sql`COUNT(DISTINCT ${orderItems.orderId})`
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(...conditions)).groupBy(orderItems.productId, orderItems.productNameSnapshot).orderBy(desc(sql`SUM(${orderItems.quantity})`)).limit(limit);
    sendSuccess(res, topProducts.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
      orderCount: Number(row.orderCount)
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/products/low-stock", async (req, res, next) => {
  try {
    const db2 = getDb();
    const threshold = parseInt(req.query["threshold"]) || 10;
    const lowStockProducts = await db2.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stockQuantity: products.stockQuantity,
      status: products.status
    }).from(products).where(
      and(
        eq(products.status, "active"),
        lte(products.stockQuantity, threshold)
      )
    ).orderBy(products.stockQuantity).limit(50);
    const lowStockVariants = await db2.select({
      id: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      sku: productVariants.sku,
      options: productVariants.options,
      stockQuantity: productVariants.stockQuantity
    }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(
      and(
        eq(productVariants.isActive, true),
        lte(productVariants.stockQuantity, threshold)
      )
    ).orderBy(productVariants.stockQuantity).limit(50);
    sendSuccess(res, {
      products: lowStockProducts,
      variants: lowStockVariants,
      threshold
    });
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/customers/overview", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const conditions = [];
    if (startDate) {
      conditions.push(gte(customers.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(customers.createdAt, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [totalResult] = await db2.select({ count: sql`COUNT(*)` }).from(customers).where(whereClause);
    const [guestResult] = await db2.select({ count: sql`COUNT(*)` }).from(customers).where(
      and(
        whereClause,
        eq(customers.isGuest, true)
      )
    );
    const [withOrdersResult] = await db2.select({ count: sql`COUNT(*)` }).from(customers).where(
      and(
        whereClause,
        sql`${customers.orderCount} > 0`
      )
    );
    const topCustomers = await db2.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      orderCount: customers.orderCount
    }).from(customers).where(sql`${customers.orderCount} > 0`).orderBy(desc(customers.orderCount)).limit(10);
    sendSuccess(res, {
      totalCustomers: Number(totalResult?.count ?? 0),
      guestCustomers: Number(guestResult?.count ?? 0),
      registeredCustomers: Number(totalResult?.count ?? 0) - Number(guestResult?.count ?? 0),
      customersWithOrders: Number(withOrdersResult?.count ?? 0),
      topCustomers
    });
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/customers/new", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const groupBy = req.query["groupBy"] || "day";
    let dateFormat;
    switch (groupBy) {
      case "day":
        dateFormat = "YYYY-MM-DD";
        break;
      case "week":
        dateFormat = "IYYY-IW";
        break;
      case "month":
        dateFormat = "YYYY-MM";
        break;
      default:
        dateFormat = "YYYY-MM-DD";
    }
    const conditions = [];
    if (startDate) {
      conditions.push(gte(customers.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(customers.createdAt, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const customerData = await db2.select({
      period: sql`TO_CHAR(${customers.createdAt}, ${dateFormat})`,
      total: sql`COUNT(*)`,
      guests: sql`COUNT(*) FILTER (WHERE ${customers.isGuest} = true)`,
      registered: sql`COUNT(*) FILTER (WHERE ${customers.isGuest} = false)`
    }).from(customers).where(whereClause).groupBy(sql`TO_CHAR(${customers.createdAt}, ${dateFormat})`).orderBy(sql`TO_CHAR(${customers.createdAt}, ${dateFormat})`);
    sendSuccess(res, customerData.map((row) => ({
      period: row.period,
      total: Number(row.total),
      guests: Number(row.guests),
      registered: Number(row.registered)
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/revenue/breakdown", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const conditions = [eq(orders.paymentStatus, "paid")];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    const [breakdown] = await db2.select({
      subtotal: sql`SUM(CAST(${orders.subtotalSnapshot} AS DECIMAL))`,
      taxAmount: sql`SUM(CAST(${orders.taxAmountSnapshot} AS DECIMAL))`,
      shippingAmount: sql`SUM(CAST(${orders.shippingAmountSnapshot} AS DECIMAL))`,
      discountAmount: sql`SUM(CAST(${orders.discountAmountSnapshot} AS DECIMAL))`,
      total: sql`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
      orderCount: sql`COUNT(*)`
    }).from(orders).where(and(...conditions));
    sendSuccess(res, {
      subtotal: Number(breakdown?.subtotal) || 0,
      taxAmount: Number(breakdown?.taxAmount) || 0,
      shippingAmount: Number(breakdown?.shippingAmount) || 0,
      discountAmount: Number(breakdown?.discountAmount) || 0,
      total: Number(breakdown?.total) || 0,
      orderCount: Number(breakdown?.orderCount) || 0
    });
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/revenue/by-payment-method", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const conditions = [eq(orders.paymentStatus, "paid")];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    const byPaymentMethod = await db2.select({
      paymentMethod: orders.paymentMethod,
      revenue: sql`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
      orderCount: sql`COUNT(*)`
    }).from(orders).where(and(...conditions)).groupBy(orders.paymentMethod);
    sendSuccess(res, byPaymentMethod.map((row) => ({
      paymentMethod: row.paymentMethod || "unknown",
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount)
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/orders/recent", async (req, res, next) => {
  try {
    const db2 = getDb();
    const limit = parseInt(req.query["limit"]) || 10;
    const recentOrders = await db2.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerEmail: customers.email,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      total: orders.totalSnapshot,
      status: orders.status,
      createdAt: orders.createdAt
    }).from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).orderBy(desc(orders.createdAt)).limit(limit);
    sendSuccess(res, recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customerFirstName && order.customerLastName ? `${order.customerFirstName} ${order.customerLastName}` : order.customerEmail || "Guest",
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
    })));
  } catch (error) {
    next(error);
  }
});
analyticsRoutes.get("/export", validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    const orderData = await db2.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.totalSnapshot,
      createdAt: orders.createdAt
    }).from(orders).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(orders.createdAt));
    const customerConditions = [];
    if (startDate) {
      customerConditions.push(gte(customers.createdAt, startDate));
    }
    if (endDate) {
      customerConditions.push(lte(customers.createdAt, endDate));
    }
    const customerData = await db2.select({
      id: customers.id,
      email: customers.email,
      isGuest: customers.isGuest,
      orderCount: customers.orderCount,
      createdAt: customers.createdAt
    }).from(customers).where(customerConditions.length > 0 ? and(...customerConditions) : void 0);
    const exportData = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalOrders: orderData.length,
        totalCustomers: customerData.length,
        totalRevenue: orderData.filter((o) => o.paymentStatus === "paid").reduce((sum2, o) => sum2 + Number(o.total), 0)
      },
      orders: orderData.map((o) => ({
        ...o,
        total: Number(o.total)
      })),
      customers: customerData
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="analytics-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`
    );
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// src/routes/export.routes.ts
var import_express14 = require("express");
var import_zod16 = require("zod");
var exportRoutes = (0, import_express14.Router)();
exportRoutes.use(requireAuth, requireAdmin);
var exportQuerySchema = import_zod16.z.object({
  format: import_zod16.z.enum(["csv", "json", "jsonl"]).optional().default("csv"),
  startDate: import_zod16.z.string().optional(),
  endDate: import_zod16.z.string().optional(),
  status: import_zod16.z.string().optional()
});
function setExportHeaders(res, filename, contentType) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}
exportRoutes.get("/products", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, status } = req.query;
    const conditions = [];
    if (status) {
      conditions.push(eq(products.status, status));
    }
    const productList = await db2.select({
      id: products.id,
      sku: products.sku,
      barcode: products.barcode,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDescription: products.shortDescription,
      categoryId: products.categoryId,
      categoryName: categories.name,
      brand: products.brand,
      basePrice: products.basePrice,
      costPrice: products.costPrice,
      compareAtPrice: products.compareAtPrice,
      weight: products.weight,
      dimensions: products.dimensions,
      stockQuantity: products.stockQuantity,
      lowStockThreshold: products.lowStockThreshold,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      images: products.images,
      videos: products.videos,
      thumbnailUrl: products.thumbnailUrl,
      tags: products.tags,
      specifications: products.specifications,
      features: products.features,
      metaTitle: products.metaTitle,
      metaDescription: products.metaDescription,
      status: products.status,
      isFeatured: products.isFeatured,
      isDigital: products.isDigital,
      requiresShipping: products.requiresShipping,
      supplierId: products.supplierId,
      supplierSku: products.supplierSku,
      importedFrom: products.importedFrom,
      externalUrl: products.externalUrl,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt
    }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(products.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("products", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(productList, exportService.getProductColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(productList));
    } else {
      res.send(exportService.toJSON(productList));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/orders", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, startDate, endDate, status } = req.query;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    const orderList = await db2.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerEmail: customers.email,
      customerName: sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      shippingAddress: orders.shippingAddress,
      billingAddress: orders.billingAddress,
      currency: orders.currency,
      subtotalSnapshot: orders.subtotalSnapshot,
      taxRateSnapshot: orders.taxRateSnapshot,
      taxAmountSnapshot: orders.taxAmountSnapshot,
      shippingAmountSnapshot: orders.shippingAmountSnapshot,
      discountAmountSnapshot: orders.discountAmountSnapshot,
      totalSnapshot: orders.totalSnapshot,
      promoCodeId: orders.promoCodeId,
      promoCodeSnapshot: orders.promoCodeSnapshot,
      shippingMethod: orders.shippingMethod,
      trackingNumber: orders.trackingNumber,
      confirmedAt: orders.confirmedAt,
      processingAt: orders.processingAt,
      shippedAt: orders.shippedAt,
      deliveredAt: orders.deliveredAt,
      customerNotes: orders.customerNotes,
      adminNotes: orders.adminNotes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    }).from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(orders.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("orders", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(orderList, exportService.getOrderColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(orderList));
    } else {
      res.send(exportService.toJSON(orderList));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/orders/:id/items", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const format = req.query["format"] || "csv";
    const [order] = await db2.select({ orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, id));
    const items = await db2.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      orderNumber: sql`${order?.orderNumber || ""}`,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      productNameSnapshot: orderItems.productNameSnapshot,
      skuSnapshot: orderItems.skuSnapshot,
      variantOptionsSnapshot: orderItems.variantOptionsSnapshot,
      quantity: orderItems.quantity,
      unitPriceSnapshot: orderItems.unitPriceSnapshot,
      lineTotal: sql`CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity}`,
      createdAt: orderItems.createdAt
    }).from(orderItems).where(eq(orderItems.orderId, id));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename(`order-${order?.orderNumber || id}-items`, extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(items, exportService.getOrderItemColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/order-items", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, startDate, endDate } = req.query;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }
    const items = await db2.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      orderNumber: orders.orderNumber,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      productNameSnapshot: orderItems.productNameSnapshot,
      skuSnapshot: orderItems.skuSnapshot,
      variantOptionsSnapshot: orderItems.variantOptionsSnapshot,
      quantity: orderItems.quantity,
      unitPriceSnapshot: orderItems.unitPriceSnapshot,
      lineTotal: sql`CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity}`,
      createdAt: orderItems.createdAt
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(orders.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("order-items", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(items, exportService.getOrderItemColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/customers", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, startDate, endDate } = req.query;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(customers.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(customers.createdAt, end));
    }
    const customerList = await db2.select({
      id: customers.id,
      authUserId: customers.authUserId,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      defaultShippingAddress: customers.defaultShippingAddress,
      defaultBillingAddress: customers.defaultBillingAddress,
      isGuest: customers.isGuest,
      isActive: customers.isActive,
      acceptsMarketing: customers.acceptsMarketing,
      notes: customers.notes,
      tags: customers.tags,
      orderCount: customers.orderCount,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt
    }).from(customers).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(customers.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("customers", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(customerList, exportService.getCustomerColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(customerList));
    } else {
      res.send(exportService.toJSON(customerList));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/promo-codes", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format } = req.query;
    const promoCodeList = await db2.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("promo-codes", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(promoCodeList, exportService.getPromoCodeColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(promoCodeList));
    } else {
      res.send(exportService.toJSON(promoCodeList));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/quotations", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, startDate, endDate, status } = req.query;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(quotations.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(quotations.createdAt, end));
    }
    if (status) {
      conditions.push(eq(quotations.status, status));
    }
    const quotationList = await db2.select().from(quotations).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(quotations.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("quotations", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(quotationList, exportService.getQuotationColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(quotationList));
    } else {
      res.send(exportService.toJSON(quotationList));
    }
  } catch (error) {
    next(error);
  }
});
exportRoutes.get("/quotation-items", validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db2 = getDb();
    const { format, startDate, endDate } = req.query;
    const conditions = [];
    if (startDate) {
      conditions.push(gte(quotations.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(quotations.createdAt, end));
    }
    const items = await db2.select({
      id: quotationItems.id,
      quotationId: quotationItems.quotationId,
      quotationNumber: quotations.quotationNumber,
      productId: quotationItems.productId,
      variantId: quotationItems.variantId,
      name: quotationItems.name,
      description: quotationItems.description,
      sku: quotationItems.sku,
      quantity: quotationItems.quantity,
      unitPrice: quotationItems.unitPrice,
      lineTotal: sql`CAST(${quotationItems.unitPrice} AS DECIMAL) * ${quotationItems.quantity}`,
      createdAt: quotationItems.createdAt
    }).from(quotationItems).innerJoin(quotations, eq(quotationItems.quotationId, quotations.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(quotations.createdAt));
    const { contentType, extension } = exportService.getContentType(format);
    const filename = exportService.getFilename("quotation-items", extension);
    setExportHeaders(res, filename, contentType);
    if (format === "csv") {
      const csv = exportService.toCSV(items, exportService.getQuotationItemColumns());
      res.send(csv);
    } else if (format === "jsonl") {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});

// src/routes/import.routes.ts
var import_express15 = require("express");
var import_zod17 = require("zod");
var importRoutes = (0, import_express15.Router)();
importRoutes.use(requireAuth, requireAdmin);
var csvImportSchema = import_zod17.z.object({
  csvContent: import_zod17.z.string().min(1),
  dryRun: import_zod17.z.boolean().optional().default(false),
  updateExisting: import_zod17.z.boolean().optional().default(false)
});
var urlImportSchema = import_zod17.z.object({
  url: import_zod17.z.string().url(),
  source: import_zod17.z.enum(["amazon", "aliexpress", "ebay", "other"]).optional().default("other")
});
importRoutes.get("/templates/products", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="product-import-template.csv"');
  res.send(importService.getProductTemplate());
});
importRoutes.get("/templates/customers", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="customer-import-template.csv"');
  res.send(importService.getCustomerTemplate());
});
importRoutes.post(
  "/products",
  validateBody(csvImportSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { csvContent, dryRun, updateExisting } = req.body;
      const rawData = importService.parseCSV(csvContent);
      if (rawData.length === 0) {
        throw new BadRequestError("CSV file is empty or invalid");
      }
      const result = importService.mapAndValidate(
        rawData,
        importService.getProductMappings(),
        importService.getProductSchema()
      );
      if (dryRun) {
        return sendSuccess(res, {
          dryRun: true,
          ...result,
          data: result.data.slice(0, 5)
          // Only return first 5 for preview
        });
      }
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      for (const productData of result.data) {
        const data = productData;
        const [existingProduct] = await db2.select({ id: products.id }).from(products).where(eq(products.sku, data.sku));
        if (existingProduct) {
          if (updateExisting) {
            await db2.update(products).set({
              name: data.name,
              barcode: data.barcode,
              description: data.description,
              shortDescription: data.shortDescription,
              basePrice: String(data.basePrice),
              costPrice: data.costPrice ? String(data.costPrice) : void 0,
              compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : void 0,
              stockQuantity: data.stockQuantity,
              lowStockThreshold: data.lowStockThreshold,
              trackInventory: data.trackInventory,
              allowBackorder: data.allowBackorder,
              weight: data.weight ? String(data.weight) : void 0,
              dimensions: data.dimensions,
              brand: data.brand,
              status: data.status,
              isFeatured: data.isFeatured,
              isDigital: data.isDigital,
              requiresShipping: data.requiresShipping,
              thumbnailUrl: data.thumbnailUrl,
              images: data.images,
              metaTitle: data.metaTitle,
              metaDescription: data.metaDescription,
              tags: data.tags,
              features: data.features,
              specifications: data.specifications,
              supplierId: data.supplierId,
              supplierSku: data.supplierSku,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(products.id, existingProduct.id));
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }
        let categoryId;
        if (data.categoryName) {
          const [category] = await db2.select({ id: categories.id }).from(categories).where(eq(categories.name, data.categoryName));
          if (category) {
            categoryId = category.id;
          }
        }
        const slug = generateSlug(data.name);
        await db2.insert(products).values({
          name: data.name,
          slug: `${slug}-${Date.now()}`,
          // Ensure unique slug
          sku: data.sku,
          barcode: data.barcode,
          description: data.description,
          shortDescription: data.shortDescription,
          basePrice: String(data.basePrice),
          costPrice: data.costPrice ? String(data.costPrice) : void 0,
          compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : void 0,
          stockQuantity: data.stockQuantity || 0,
          lowStockThreshold: data.lowStockThreshold || 5,
          trackInventory: data.trackInventory ?? true,
          allowBackorder: data.allowBackorder || false,
          weight: data.weight ? String(data.weight) : void 0,
          dimensions: data.dimensions,
          categoryId,
          brand: data.brand,
          status: data.status || "draft",
          isFeatured: data.isFeatured || false,
          isDigital: data.isDigital || false,
          requiresShipping: data.requiresShipping ?? true,
          thumbnailUrl: data.thumbnailUrl,
          images: data.images || [],
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          tags: data.tags || [],
          features: data.features || [],
          specifications: data.specifications || {},
          supplierId: data.supplierId,
          supplierSku: data.supplierSku
        });
        importedCount++;
      }
      sendSuccess(res, {
        success: true,
        totalRows: result.totalRows,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: result.errors
      });
    } catch (error) {
      next(error);
    }
  }
);
importRoutes.post(
  "/customers",
  validateBody(csvImportSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { csvContent, dryRun, updateExisting } = req.body;
      const rawData = importService.parseCSV(csvContent);
      if (rawData.length === 0) {
        throw new BadRequestError("CSV file is empty or invalid");
      }
      const result = importService.mapAndValidate(
        rawData,
        importService.getCustomerMappings(),
        importService.getCustomerSchema()
      );
      if (dryRun) {
        return sendSuccess(res, {
          dryRun: true,
          ...result,
          data: result.data.slice(0, 5)
        });
      }
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      for (const customerData of result.data) {
        const data = customerData;
        const [existingCustomer] = await db2.select({ id: customers.id }).from(customers).where(eq(customers.email, data.email.toLowerCase()));
        if (existingCustomer) {
          if (updateExisting) {
            const shippingAddress2 = importService.buildAddressFromFlatFields(data, "shipping");
            const billingAddress2 = importService.buildAddressFromFlatFields(data, "billing");
            await db2.update(customers).set({
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
              isActive: data.isActive,
              acceptsMarketing: data.acceptsMarketing,
              notes: data.notes,
              tags: data.tags,
              defaultShippingAddress: shippingAddress2,
              defaultBillingAddress: billingAddress2,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(customers.id, existingCustomer.id));
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }
        const shippingAddress = importService.buildAddressFromFlatFields(data, "shipping");
        const billingAddress = importService.buildAddressFromFlatFields(data, "billing");
        await db2.insert(customers).values({
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          isActive: data.isActive ?? true,
          isGuest: false,
          acceptsMarketing: data.acceptsMarketing || false,
          notes: data.notes,
          tags: data.tags || [],
          defaultShippingAddress: shippingAddress,
          defaultBillingAddress: billingAddress
        });
        importedCount++;
      }
      sendSuccess(res, {
        success: true,
        totalRows: result.totalRows,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: result.errors
      });
    } catch (error) {
      next(error);
    }
  }
);
importRoutes.post(
  "/from-url",
  validateBody(urlImportSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { url, source } = req.body;
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      let detectedSource = source;
      if (hostname.includes("amazon")) {
        detectedSource = "amazon";
      } else if (hostname.includes("aliexpress")) {
        detectedSource = "aliexpress";
      } else if (hostname.includes("ebay")) {
        detectedSource = "ebay";
      }
      const jobResult = await db2.insert(productImportJobs).values({
        source: detectedSource,
        sourceUrl: url,
        status: "pending"
      }).returning();
      const job = jobResult[0];
      if (!job) {
        throw new BadRequestError("Failed to create import job");
      }
      sendCreated(res, {
        jobId: job.id,
        status: job.status,
        source: detectedSource,
        url,
        message: "Import job created. Product data will be extracted in the background."
      });
    } catch (error) {
      next(error);
    }
  }
);
importRoutes.get("/jobs", async (req, res, next) => {
  try {
    const db2 = getDb();
    const jobs = await db2.select().from(productImportJobs).orderBy(productImportJobs.createdAt);
    sendSuccess(res, jobs);
  } catch (error) {
    next(error);
  }
});
importRoutes.get("/jobs/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { id } = req.params;
    const [job] = await db2.select().from(productImportJobs).where(eq(productImportJobs.id, id));
    if (!job) {
      throw new NotFoundError("Import job not found");
    }
    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
});
importRoutes.post("/jobs/:id/retry", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { id } = req.params;
    const [job] = await db2.select().from(productImportJobs).where(eq(productImportJobs.id, id));
    if (!job) {
      throw new NotFoundError("Import job not found");
    }
    if (job.status !== "failed") {
      throw new BadRequestError("Only failed jobs can be retried");
    }
    await db2.update(productImportJobs).set({
      status: "pending",
      errorMessage: null
    }).where(eq(productImportJobs.id, id));
    sendSuccess(res, { message: "Job queued for retry" });
  } catch (error) {
    next(error);
  }
});
importRoutes.delete("/jobs/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { id } = req.params;
    const [job] = await db2.select({ id: productImportJobs.id }).from(productImportJobs).where(eq(productImportJobs.id, id));
    if (!job) {
      throw new NotFoundError("Import job not found");
    }
    await db2.delete(productImportJobs).where(eq(productImportJobs.id, id));
    sendSuccess(res, { message: "Import job deleted" });
  } catch (error) {
    next(error);
  }
});

// src/routes/contact.routes.ts
var import_express16 = require("express");
var import_zod18 = require("zod");
var import_crypto5 = __toESM(require("crypto"));
var contactRoutes = (0, import_express16.Router)();
var contactFormSchema = import_zod18.z.object({
  name: import_zod18.z.string().min(1).max(100),
  email: import_zod18.z.string().email(),
  phone: import_zod18.z.string().max(50).optional(),
  subject: import_zod18.z.string().min(1).max(200),
  message: import_zod18.z.string().min(10).max(5e3),
  recaptchaToken: import_zod18.z.string().optional()
  // For future reCAPTCHA integration
});
var newsletterSchema = import_zod18.z.object({
  email: import_zod18.z.string().email(),
  name: import_zod18.z.string().max(100).optional(),
  source: import_zod18.z.enum(["footer", "checkout", "popup", "import", "admin"]).optional()
});
contactRoutes.post(
  "/",
  strictLimiter,
  validateBody(contactFormSchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      console.log("Contact form submission:", {
        name,
        email,
        phone,
        subject,
        messageLength: message.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      sendSuccess(res, {
        message: "Thank you for contacting us. We will get back to you soon.",
        received: true
      });
    } catch (error) {
      next(error);
    }
  }
);
contactRoutes.post(
  "/newsletter",
  strictLimiter,
  validateBody(newsletterSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { email, name, source = "footer" } = req.body;
      const [existing] = await db2.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase()));
      if (existing) {
        if (existing.status === "unsubscribed") {
          await db2.update(newsletterSubscribers).set({
            status: "active",
            name: name || existing.name,
            unsubscribedAt: null,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(newsletterSubscribers.id, existing.id));
          return sendSuccess(res, {
            message: "Welcome back! You have been resubscribed to our newsletter.",
            subscribed: true
          });
        }
        return sendSuccess(res, {
          message: "You are already subscribed to our newsletter.",
          subscribed: true
        });
      }
      const unsubscribeToken = import_crypto5.default.randomBytes(32).toString("hex");
      await db2.insert(newsletterSubscribers).values({
        email: email.toLowerCase(),
        name: name || null,
        source,
        unsubscribeToken,
        status: "active"
      });
      sendSuccess(res, {
        message: "Successfully subscribed to the newsletter.",
        subscribed: true
      });
    } catch (error) {
      next(error);
    }
  }
);
contactRoutes.get(
  "/newsletter/unsubscribe/:token",
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { token } = req.params;
      const [subscriber] = await db2.select({ email: newsletterSubscribers.email, status: newsletterSubscribers.status }).from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeToken, token));
      if (!subscriber) {
        throw new NotFoundError("Invalid unsubscribe link");
      }
      sendSuccess(res, {
        email: subscriber.email,
        status: subscriber.status
      });
    } catch (error) {
      next(error);
    }
  }
);
contactRoutes.post(
  "/newsletter/unsubscribe/:token",
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { token } = req.params;
      const [subscriber] = await db2.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeToken, token));
      if (!subscriber) {
        throw new NotFoundError("Invalid unsubscribe link");
      }
      if (subscriber.status === "unsubscribed") {
        return sendSuccess(res, {
          message: "You have already unsubscribed from our newsletter.",
          unsubscribed: true
        });
      }
      await db2.update(newsletterSubscribers).set({
        status: "unsubscribed",
        unsubscribedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(newsletterSubscribers.id, subscriber.id));
      sendSuccess(res, {
        message: "You have been successfully unsubscribed from our newsletter.",
        unsubscribed: true
      });
    } catch (error) {
      next(error);
    }
  }
);
contactRoutes.post(
  "/quote-request",
  strictLimiter,
  validateBody(
    import_zod18.z.object({
      name: import_zod18.z.string().min(1).max(100),
      email: import_zod18.z.string().email(),
      phone: import_zod18.z.string().max(50).optional(),
      company: import_zod18.z.string().max(255).optional(),
      products: import_zod18.z.array(
        import_zod18.z.object({
          productId: import_zod18.z.string().uuid(),
          quantity: import_zod18.z.number().int().min(1)
        })
      ).min(1),
      message: import_zod18.z.string().max(2e3).optional()
    })
  ),
  async (req, res, next) => {
    try {
      const { name, email, phone, company, products: products2, message } = req.body;
      console.log("Quote request:", {
        name,
        email,
        phone,
        company,
        productCount: products2.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      sendSuccess(res, {
        message: "Quote request received. We will contact you shortly with pricing.",
        received: true
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/upload.routes.ts
var import_express17 = require("express");
var import_zod19 = require("zod");
var import_imagekit = __toESM(require("imagekit"));
var uploadRoutes = (0, import_express17.Router)();
var imagekit = null;
function getImageKit() {
  if (!imagekit) {
    if (!config.imagekit.publicKey || !config.imagekit.privateKey || !config.imagekit.urlEndpoint) {
      throw new BadRequestError("ImageKit is not configured");
    }
    imagekit = new import_imagekit.default({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint
    });
  }
  return imagekit;
}
var uploadSchema = import_zod19.z.object({
  file: import_zod19.z.string().min(1),
  // Base64 encoded file
  fileName: import_zod19.z.string().min(1).max(255),
  folder: import_zod19.z.string().optional().default("/uploads")
});
var uploadUrlSchema = import_zod19.z.object({
  url: import_zod19.z.string().url(),
  fileName: import_zod19.z.string().min(1).max(255),
  folder: import_zod19.z.string().optional().default("/uploads")
});
var deleteSchema = import_zod19.z.object({
  fileId: import_zod19.z.string().min(1)
});
uploadRoutes.use(requireAuth, requireAdmin);
uploadRoutes.get("/auth", async (req, res, next) => {
  try {
    const ik = getImageKit();
    const authParams = ik.getAuthenticationParameters();
    sendSuccess(res, authParams);
  } catch (error) {
    next(error);
  }
});
uploadRoutes.post(
  "/",
  validateBody(uploadSchema),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { file, fileName, folder } = req.body;
      const result = await ik.upload({
        file,
        fileName,
        folder,
        useUniqueFileName: true
      });
      sendSuccess(res, {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        fileType: result.fileType,
        size: result.size,
        width: result.width,
        height: result.height
      });
    } catch (error) {
      next(error);
    }
  }
);
uploadRoutes.post(
  "/from-url",
  validateBody(uploadUrlSchema),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { url, fileName, folder } = req.body;
      const result = await ik.upload({
        file: url,
        fileName,
        folder,
        useUniqueFileName: true
      });
      sendSuccess(res, {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        fileType: result.fileType,
        size: result.size,
        width: result.width,
        height: result.height
      });
    } catch (error) {
      next(error);
    }
  }
);
uploadRoutes.delete("/:fileId", async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { fileId } = req.params;
    await ik.deleteFile(fileId);
    sendSuccess(res, { message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
});
uploadRoutes.get("/list", async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { folder, limit, skip } = req.query;
    const files = await ik.listFiles({
      path: folder || "/uploads",
      limit: limit ? parseInt(limit) : 20,
      skip: skip ? parseInt(skip) : 0
    });
    sendSuccess(res, files);
  } catch (error) {
    next(error);
  }
});
uploadRoutes.get("/:fileId", async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { fileId } = req.params;
    const file = await ik.getFileDetails(fileId);
    sendSuccess(res, file);
  } catch (error) {
    next(error);
  }
});
uploadRoutes.post(
  "/bulk-delete",
  validateBody(import_zod19.z.object({ fileIds: import_zod19.z.array(import_zod19.z.string()).min(1).max(100) })),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { fileIds } = req.body;
      await ik.bulkDeleteFiles(fileIds);
      sendSuccess(res, {
        message: `${fileIds.length} files deleted successfully`,
        deletedCount: fileIds.length
      });
    } catch (error) {
      next(error);
    }
  }
);
uploadRoutes.get("/transform/:filePath(*)", async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { filePath } = req.params;
    const { width, height, quality, format, crop } = req.query;
    const transformations = [];
    if (width || height || quality || format || crop) {
      const transform = {};
      if (width) {
        transform.width = parseInt(width);
      }
      if (height) {
        transform.height = parseInt(height);
      }
      if (quality) {
        transform.quality = parseInt(quality);
      }
      if (format) {
        transform.format = format;
      }
      if (crop) {
        transform.cropMode = crop;
      }
      transformations.push(transform);
    }
    const url = ik.url({
      path: `/${filePath}`,
      transformation: transformations.length > 0 ? transformations : void 0
    });
    sendSuccess(res, { url });
  } catch (error) {
    next(error);
  }
});

// src/routes/health.routes.ts
var import_express18 = require("express");

// src/utils/db-health.ts
async function checkDbHealth() {
  const startTime = Date.now();
  try {
    const db2 = getDb();
    const versionResult = await db2.execute(sql`SELECT version()`);
    const rows = versionResult.rows;
    const version2 = rows[0]?.version || "unknown";
    const latency = Date.now() - startTime;
    const tablesResult = await db2.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tableRows = tablesResult.rows;
    const tables = tableRows.map((t) => t.table_name);
    return {
      connected: true,
      latency,
      version: version2,
      tables
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - startTime,
      version: "unknown",
      tables: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function verifySchema() {
  const requiredTables = [
    "addresses",
    "admin_activity_logs",
    "blogs",
    "cart_items",
    "cart_promo_codes",
    "carts",
    "categories",
    "customers",
    "order_items",
    "orders",
    "product_import_jobs",
    "product_variants",
    "products",
    "promo_codes",
    "quotation_items",
    "quotations",
    "settings"
  ];
  try {
    const health = await checkDbHealth();
    if (!health.connected) {
      return {
        valid: false,
        missingTables: requiredTables,
        extraTables: []
      };
    }
    const existingTables = new Set(health.tables);
    const missingTables = requiredTables.filter((t) => !existingTables.has(t));
    const extraTables = health.tables.filter((t) => !requiredTables.includes(t));
    return {
      valid: missingTables.length === 0,
      missingTables,
      extraTables
    };
  } catch (error) {
    return {
      valid: false,
      missingTables: requiredTables,
      extraTables: []
    };
  }
}
async function testConnection() {
  try {
    const db2 = getDb();
    await db2.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

// src/routes/health.routes.ts
var healthRoutes = (0, import_express18.Router)();
healthRoutes.get("/", async (_req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? "ok" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? "connected" : "disconnected"
  });
});
healthRoutes.get("/detailed", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const dbHealth = await checkDbHealth();
    const schemaStatus = await verifySchema();
    sendSuccess(res, {
      status: dbHealth.connected && schemaStatus.valid ? "healthy" : "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      database: {
        connected: dbHealth.connected,
        latency: dbHealth.latency,
        version: dbHealth.version,
        error: dbHealth.error
      },
      schema: {
        valid: schemaStatus.valid,
        tablesCount: dbHealth.tables.length,
        missingTables: schemaStatus.missingTables
      },
      environment: process.env["NODE_ENV"] || "development"
    });
  } catch (error) {
    next(error);
  }
});
healthRoutes.get("/ready", async (_req, res) => {
  const dbConnected = await testConnection();
  if (dbConnected) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: "Database not connected" });
  }
});
healthRoutes.get("/live", (_req, res) => {
  res.status(200).json({ alive: true });
});

// src/routes/notifications.routes.ts
var import_express19 = require("express");
var import_zod20 = require("zod");
var router = (0, import_express19.Router)();
var updateSettingsSchema = import_zod20.z.object({
  enabled: import_zod20.z.boolean().optional(),
  adminEmails: import_zod20.z.array(import_zod20.z.string().email()).optional(),
  notifications: import_zod20.z.object({
    new_order: import_zod20.z.boolean().optional(),
    order_status_change: import_zod20.z.boolean().optional(),
    low_stock_alert: import_zod20.z.boolean().optional(),
    new_customer: import_zod20.z.boolean().optional(),
    new_contact_message: import_zod20.z.boolean().optional(),
    quotation_request: import_zod20.z.boolean().optional(),
    payment_received: import_zod20.z.boolean().optional(),
    refund_processed: import_zod20.z.boolean().optional()
  }).optional()
});
var testNotificationSchema = import_zod20.z.object({
  type: import_zod20.z.enum([
    "new_order",
    "order_status_change",
    "low_stock_alert",
    "new_customer",
    "new_contact_message",
    "quotation_request",
    "payment_received",
    "refund_processed"
  ]),
  email: import_zod20.z.string().email().optional()
});
router.get("/settings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings3 = notificationService.getSettings();
    const smtpConfigured = mailerService.isReady();
    sendSuccess(res, {
      ...settings3,
      smtpConfigured
    });
  } catch (error) {
    next(error);
  }
});
router.put(
  "/settings",
  requireAuth,
  requireAdmin,
  validateBody(updateSettingsSchema),
  async (req, res, next) => {
    try {
      const updates = req.body;
      notificationService.updateSettings(updates);
      sendSuccess(res, {
        message: "Notification settings updated successfully",
        settings: notificationService.getSettings()
      });
    } catch (error) {
      next(error);
    }
  }
);
router.post(
  "/test",
  requireAuth,
  requireAdmin,
  validateBody(testNotificationSchema),
  async (req, res, next) => {
    try {
      const { type, email } = req.body;
      if (!mailerService.isReady()) {
        return sendError(res, 400, "SMTP_NOT_CONFIGURED", "SMTP not configured. Please configure SMTP settings first.");
      }
      const testData = {
        new_order: {
          orderId: "TEST-001",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          total: "299.99",
          itemCount: 3
        },
        order_status_change: {
          orderId: "TEST-001",
          previousStatus: "pending",
          newStatus: "processing"
        },
        low_stock_alert: {
          productId: "prod_123",
          productName: "Arduino Uno R3",
          sku: "ARD-UNO-R3",
          currentStock: 5,
          threshold: 10
        },
        new_customer: {
          customerId: "cust_123",
          customerName: "John Doe",
          customerEmail: "john@example.com"
        },
        new_contact_message: {
          name: "Jane Smith",
          email: "jane@example.com",
          subject: "Product Inquiry",
          message: "I would like to know more about your Arduino kits."
        },
        quotation_request: {
          quotationId: "QT-001",
          customerName: "Acme Corp",
          customerEmail: "purchasing@acme.com",
          itemCount: 5
        },
        payment_received: {
          orderId: "ORD-001",
          amount: "499.99",
          paymentMethod: "Credit Card",
          transactionId: "txn_abc123"
        },
        refund_processed: {
          orderId: "ORD-001",
          amount: "99.99",
          reason: "Customer requested cancellation"
        }
      };
      const originalSettings = notificationService.getSettings();
      if (email) {
        notificationService.updateSettings({ adminEmails: [email] });
      }
      const success = await notificationService.notify(type, testData[type]);
      if (email) {
        notificationService.updateSettings({ adminEmails: originalSettings.adminEmails });
      }
      if (success) {
        sendSuccess(res, {
          message: `Test ${type} notification sent successfully`,
          sentTo: email || originalSettings.adminEmails
        });
      } else {
        sendError(res, 500, "NOTIFICATION_FAILED", "Failed to send test notification");
      }
    } catch (error) {
      next(error);
    }
  }
);
router.post("/verify-smtp", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const isConnected = await mailerService.verifyConnection();
    if (isConnected) {
      sendSuccess(res, {
        message: "SMTP connection verified successfully",
        connected: true
      });
    } else {
      sendError(res, 400, "SMTP_CONNECTION_FAILED", "SMTP connection failed. Please check your settings.");
    }
  } catch (error) {
    next(error);
  }
});
var notifications_routes_default = router;

// src/routes/search.routes.ts
var import_express20 = require("express");
var import_zod21 = require("zod");
var searchRoutes = (0, import_express20.Router)();
var searchQuerySchema = import_zod21.z.object({
  q: import_zod21.z.string().min(1).max(200),
  limit: import_zod21.z.coerce.number().min(1).max(100).optional(),
  offset: import_zod21.z.coerce.number().min(0).optional(),
  category: import_zod21.z.string().optional(),
  minPrice: import_zod21.z.coerce.number().optional(),
  maxPrice: import_zod21.z.coerce.number().optional(),
  inStock: import_zod21.z.string().optional(),
  brand: import_zod21.z.string().optional(),
  sort: import_zod21.z.enum(["name:asc", "name:desc", "basePrice:asc", "basePrice:desc", "createdAt:desc"]).optional(),
  facets: import_zod21.z.string().optional()
  // comma-separated list of facet fields
});
var autocompleteSchema = import_zod21.z.object({
  q: import_zod21.z.string().min(1).max(100),
  limit: import_zod21.z.coerce.number().min(1).max(10).optional()
});
searchRoutes.get("/", validateQuery(searchQuerySchema), async (req, res, next) => {
  try {
    const { q, limit = 20, offset = 0, category, minPrice, maxPrice, inStock, brand, sort, facets } = req.query;
    const isAvailable = await searchService.isAvailable();
    if (!isAvailable) {
      return sendSuccess(res, {
        hits: [],
        query: q,
        processingTimeMs: 0,
        estimatedTotalHits: 0,
        limit: Number(limit),
        offset: Number(offset),
        error: "Search service temporarily unavailable"
      });
    }
    const filters = [];
    if (category) {
      filters.push(`categorySlug = "${category}"`);
    }
    if (minPrice !== void 0) {
      filters.push(`basePrice >= ${minPrice}`);
    }
    if (maxPrice !== void 0) {
      filters.push(`basePrice <= ${maxPrice}`);
    }
    if (inStock === "true") {
      filters.push("inStock = true");
    }
    if (brand) {
      filters.push(`brand = "${brand}"`);
    }
    const sortArray = [];
    if (sort) {
      sortArray.push(sort);
    }
    const facetFields = facets ? facets.split(",") : ["categorySlug", "brand", "inStock"];
    const result = await searchService.searchProducts(q, {
      limit: Number(limit),
      offset: Number(offset),
      filters,
      sort: sortArray,
      facets: facetFields
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});
searchRoutes.get("/autocomplete", validateQuery(autocompleteSchema), async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    const isAvailable = await searchService.isAvailable();
    if (!isAvailable) {
      return sendSuccess(res, { suggestions: [] });
    }
    const result = await searchService.searchProducts(q, {
      limit: Number(limit),
      offset: 0
    });
    const suggestions = result.hits.map((hit) => ({
      id: hit.id,
      name: hit.name,
      slug: hit.slug,
      thumbnailUrl: hit.thumbnailUrl,
      basePrice: hit.basePrice,
      categoryName: hit.categoryName
    }));
    sendSuccess(res, { suggestions, query: q });
  } catch (error) {
    next(error);
  }
});
searchRoutes.get("/health", async (req, res, next) => {
  try {
    const isAvailable = await searchService.isAvailable();
    const stats = isAvailable ? await searchService.getIndexStats() : null;
    sendSuccess(res, {
      available: isAvailable,
      stats
    });
  } catch (error) {
    next(error);
  }
});
searchRoutes.post("/sync", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await searchService.initialize();
    const result = await searchService.syncAllProducts();
    sendSuccess(res, {
      message: "Products synced successfully",
      ...result
    });
  } catch (error) {
    next(error);
  }
});
searchRoutes.post("/initialize", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await searchService.initialize();
    sendSuccess(res, {
      message: "Search index initialized successfully"
    });
  } catch (error) {
    next(error);
  }
});

// src/routes/google-images.routes.ts
var import_express21 = require("express");
var import_zod22 = require("zod");
var import_googleapis = require("googleapis");
var import_imagekit2 = __toESM(require("imagekit"));
var googleImagesRoutes = (0, import_express21.Router)();
var imagekit2 = null;
function getImageKit2() {
  if (!imagekit2) {
    if (!config.imagekit.publicKey || !config.imagekit.privateKey || !config.imagekit.urlEndpoint) {
      throw new BadRequestError("ImageKit is not configured");
    }
    imagekit2 = new import_imagekit2.default({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint
    });
  }
  return imagekit2;
}
var searchQuerySchema2 = import_zod22.z.object({
  query: import_zod22.z.string().min(1, "Search query is required").max(200, "Query too long"),
  limit: import_zod22.z.string().optional().transform((val) => Math.min(parseInt(val || "10", 10), 10)),
  start: import_zod22.z.string().optional().transform((val) => Math.max(parseInt(val || "1", 10), 1)),
  safeSearch: import_zod22.z.enum(["off", "medium", "high"]).optional().default("medium"),
  imageSize: import_zod22.z.enum(["huge", "icon", "large", "medium", "small", "xlarge", "xxlarge"]).optional(),
  imageType: import_zod22.z.enum(["clipart", "face", "lineart", "stock", "photo", "animated"]).optional(),
  fileType: import_zod22.z.enum(["jpg", "png", "gif", "bmp", "svg", "webp", "ico"]).optional()
});
var downloadSchema = import_zod22.z.object({
  imageUrl: import_zod22.z.string().url("Invalid image URL").optional(),
  imageUrls: import_zod22.z.array(import_zod22.z.string().url("Invalid image URL")).max(10, "Maximum 10 images per batch").optional(),
  folder: import_zod22.z.string().optional().default("/products")
});
var CACHE_TTL = 5 * 60 * 1e3;
var searchCache = /* @__PURE__ */ new Map();
var customSearch = null;
function getCustomSearchClient() {
  if (!customSearch) {
    customSearch = import_googleapis.google.customsearch("v1");
  }
  return customSearch;
}
function generateCacheKey(options) {
  return JSON.stringify({
    q: options.query,
    start: options.start || 1,
    num: options.limit || 10,
    safe: options.safeSearch || "medium",
    imgSize: options.imageSize,
    imgType: options.imageType,
    fileType: options.fileType
  });
}
googleImagesRoutes.get(
  "/search",
  requireAuth,
  requireAdmin,
  validateQuery(searchQuerySchema2),
  async (req, res, next) => {
    try {
      const { query, limit, start, safeSearch, imageSize, imageType, fileType } = req.query;
      if (!config.google.apiKey || !config.google.searchEngineId) {
        throw new BadRequestError("Google API is not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.");
      }
      const cacheKey = generateCacheKey({ query, limit, start, safeSearch, imageSize, imageType, fileType });
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return sendSuccess(res, cached.data);
      }
      const client = getCustomSearchClient();
      const searchParams = {
        auth: config.google.apiKey,
        cx: config.google.searchEngineId,
        q: query,
        searchType: "image",
        num: limit || 10,
        start: start || 1,
        safe: safeSearch || "medium"
      };
      if (imageSize) {
        searchParams.imgSize = imageSize;
      }
      if (imageType) {
        searchParams.imgType = imageType;
      }
      if (fileType) {
        searchParams.fileType = fileType;
      }
      const response = await client.cse.list(searchParams);
      if (!response || !response.data) {
        throw new BadRequestError("Invalid response from Google API");
      }
      const result = {
        query,
        results: (response.data.items || []).map((item) => ({
          title: item.title,
          link: item.link,
          thumbnail: item.image?.thumbnailLink,
          displayLink: item.displayLink,
          snippet: item.snippet,
          mime: item.mime,
          image: {
            contextLink: item.image?.contextLink,
            height: item.image?.height,
            width: item.image?.width,
            byteSize: item.image?.byteSize,
            thumbnailLink: item.image?.thumbnailLink,
            thumbnailHeight: item.image?.thumbnailHeight,
            thumbnailWidth: item.image?.thumbnailWidth
          }
        })),
        totalResults: response.data.searchInformation?.totalResults || "0",
        searchTime: response.data.searchInformation?.searchTime || 0,
        pagination: {
          start: start || 1,
          limit: limit || 10,
          hasNextPage: !!response.data.queries?.nextPage,
          nextStart: response.data.queries?.nextPage?.[0]?.startIndex
        }
      };
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
      if (searchCache.size > 100) {
        const entries = Array.from(searchCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const oldestEntry = entries[0];
        if (oldestEntry) {
          searchCache.delete(oldestEntry[0]);
        }
      }
      sendSuccess(res, result);
    } catch (error) {
      if (error.code === 429) {
        return next(new BadRequestError("Daily API quota exceeded. Please try again tomorrow."));
      }
      if (error.code === 403) {
        return next(new BadRequestError("Invalid API credentials. Please check your Google API configuration."));
      }
      next(error);
    }
  }
);
googleImagesRoutes.post(
  "/upload-to-imagekit",
  requireAuth,
  requireAdmin,
  validateBody(downloadSchema),
  async (req, res, next) => {
    try {
      const { imageUrl, imageUrls, folder } = req.body;
      const urls = imageUrls || (imageUrl ? [imageUrl] : []);
      if (urls.length === 0) {
        throw new BadRequestError("At least one image URL is required");
      }
      const ik = getImageKit2();
      const results = await Promise.all(
        urls.map(async (url, index2) => {
          try {
            const timestamp2 = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const urlPath = new URL(url).pathname;
            const extension = urlPath.split(".").pop()?.toLowerCase() || "jpg";
            const fileName = `google-image-${timestamp2}-${index2}-${random}.${extension}`;
            const uploadResult = await ik.upload({
              file: url,
              // ImageKit accepts URL directly
              fileName,
              folder: folder || "/products",
              useUniqueFileName: true,
              tags: ["google-images", "product-image"]
            });
            return {
              success: true,
              originalUrl: url,
              imagekitUrl: uploadResult.url,
              imagekitFileId: uploadResult.fileId,
              thumbnailUrl: uploadResult.thumbnailUrl,
              metadata: {
                width: uploadResult.width,
                height: uploadResult.height,
                size: uploadResult.size,
                fileType: uploadResult.fileType,
                filePath: uploadResult.filePath
              }
            };
          } catch (error) {
            console.error(`Failed to upload image: ${url}`, error.message);
            return {
              success: false,
              originalUrl: url,
              error: error.message || "Upload failed"
            };
          }
        })
      );
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;
      const imagekitUrls = results.filter((r) => r.success).map((r) => r.imagekitUrl);
      sendSuccess(res, {
        results,
        imagekitUrls,
        // Array of successful ImageKit URLs ready to use
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
googleImagesRoutes.get(
  "/cache-stats",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    const now = Date.now();
    const entries = Array.from(searchCache.entries()).map(([key, entry]) => {
      const parsed = JSON.parse(key);
      return {
        query: parsed.q,
        age: Math.floor((now - entry.timestamp) / 1e3)
      };
    });
    sendSuccess(res, {
      size: searchCache.size,
      ttl: Math.floor(CACHE_TTL / 1e3),
      entries
    });
  }
);
googleImagesRoutes.delete(
  "/cache",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    const size = searchCache.size;
    searchCache.clear();
    sendSuccess(res, { cleared: size });
  }
);

// src/routes/pdfTemplates.routes.ts
var import_express22 = require("express");
var import_zod23 = require("zod");
var pdfTemplatesRoutes = (0, import_express22.Router)();
var createTemplateSchema2 = import_zod23.z.object({
  name: import_zod23.z.string().min(1).max(100),
  isDefault: import_zod23.z.boolean().optional().default(false),
  logoUrl: import_zod23.z.string().max(500).optional().nullable(),
  primaryColor: import_zod23.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#1a1a2e"),
  accentColor: import_zod23.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#0066cc"),
  showCompanyLogo: import_zod23.z.boolean().optional().default(true),
  showLineItemImages: import_zod23.z.boolean().optional().default(false),
  showLineItemDescription: import_zod23.z.boolean().optional().default(false),
  showSku: import_zod23.z.boolean().optional().default(true),
  headerText: import_zod23.z.string().max(500).optional().nullable(),
  footerText: import_zod23.z.string().max(500).optional().nullable(),
  thankYouMessage: import_zod23.z.string().max(500).optional().nullable()
});
var updateTemplateSchema2 = import_zod23.z.object({
  name: import_zod23.z.string().min(1).max(100).optional(),
  isDefault: import_zod23.z.boolean().optional(),
  logoUrl: import_zod23.z.string().max(500).optional().nullable(),
  primaryColor: import_zod23.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: import_zod23.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  showCompanyLogo: import_zod23.z.boolean().optional(),
  showLineItemImages: import_zod23.z.boolean().optional(),
  showLineItemDescription: import_zod23.z.boolean().optional(),
  showSku: import_zod23.z.boolean().optional(),
  headerText: import_zod23.z.string().max(500).optional().nullable(),
  footerText: import_zod23.z.string().max(500).optional().nullable(),
  thankYouMessage: import_zod23.z.string().max(500).optional().nullable()
});
pdfTemplatesRoutes.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query);
    const countResult = await db2.select({ count: sql`count(*)` }).from(pdfTemplates);
    const count2 = countResult[0]?.count ?? 0;
    const templates = await db2.select().from(pdfTemplates).orderBy(desc(pdfTemplates.isDefault), desc(pdfTemplates.createdAt)).limit(limit).offset(offset);
    sendSuccess(res, templates, 200, createPaginationMeta(page, limit, Number(count2)));
  } catch (error) {
    next(error);
  }
});
pdfTemplatesRoutes.get("/default", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const db2 = getDb();
    const [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.isDefault, true)).limit(1);
    if (!template) {
      return sendSuccess(res, {
        id: null,
        name: "Default Template",
        isDefault: true,
        primaryColor: "#1a1a2e",
        accentColor: "#0066cc",
        showCompanyLogo: true,
        showLineItemImages: false,
        showLineItemDescription: false,
        showSku: true,
        headerText: null,
        footerText: null,
        thankYouMessage: null
      });
    }
    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});
pdfTemplatesRoutes.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [template] = await db2.select().from(pdfTemplates).where(eq(pdfTemplates.id, id));
    if (!template) {
      throw new NotFoundError("PDF template not found");
    }
    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});
pdfTemplatesRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createTemplateSchema2),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const data = req.body;
      if (data.isDefault) {
        await db2.update(pdfTemplates).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pdfTemplates.isDefault, true));
      }
      const [template] = await db2.insert(pdfTemplates).values({
        name: data.name,
        isDefault: data.isDefault || false,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || "#1a1a2e",
        accentColor: data.accentColor || "#0066cc",
        showCompanyLogo: data.showCompanyLogo ?? true,
        showLineItemImages: data.showLineItemImages ?? false,
        showLineItemDescription: data.showLineItemDescription ?? false,
        showSku: data.showSku ?? true,
        headerText: data.headerText,
        footerText: data.footerText,
        thankYouMessage: data.thankYouMessage
      }).returning();
      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }
);
pdfTemplatesRoutes.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateTemplateSchema2),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const data = req.body;
      const [existing] = await db2.select({ id: pdfTemplates.id }).from(pdfTemplates).where(eq(pdfTemplates.id, id));
      if (!existing) {
        throw new NotFoundError("PDF template not found");
      }
      if (data["isDefault"]) {
        await db2.update(pdfTemplates).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pdfTemplates.isDefault, true));
      }
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (data["name"] !== void 0) {
        updateData["name"] = data["name"];
      }
      if (data["isDefault"] !== void 0) {
        updateData["isDefault"] = data["isDefault"];
      }
      if (data["logoUrl"] !== void 0) {
        updateData["logoUrl"] = data["logoUrl"];
      }
      if (data["primaryColor"] !== void 0) {
        updateData["primaryColor"] = data["primaryColor"];
      }
      if (data["accentColor"] !== void 0) {
        updateData["accentColor"] = data["accentColor"];
      }
      if (data["showCompanyLogo"] !== void 0) {
        updateData["showCompanyLogo"] = data["showCompanyLogo"];
      }
      if (data["showLineItemImages"] !== void 0) {
        updateData["showLineItemImages"] = data["showLineItemImages"];
      }
      if (data["showLineItemDescription"] !== void 0) {
        updateData["showLineItemDescription"] = data["showLineItemDescription"];
      }
      if (data["showSku"] !== void 0) {
        updateData["showSku"] = data["showSku"];
      }
      if (data["headerText"] !== void 0) {
        updateData["headerText"] = data["headerText"];
      }
      if (data["footerText"] !== void 0) {
        updateData["footerText"] = data["footerText"];
      }
      if (data["thankYouMessage"] !== void 0) {
        updateData["thankYouMessage"] = data["thankYouMessage"];
      }
      const [template] = await db2.update(pdfTemplates).set(updateData).where(eq(pdfTemplates.id, id)).returning();
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }
);
pdfTemplatesRoutes.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: pdfTemplates.id, isDefault: pdfTemplates.isDefault }).from(pdfTemplates).where(eq(pdfTemplates.id, id));
    if (!existing) {
      throw new NotFoundError("PDF template not found");
    }
    if (existing.isDefault) {
      throw new BadRequestError("Cannot delete the default template. Set another template as default first.");
    }
    await db2.delete(pdfTemplates).where(eq(pdfTemplates.id, id));
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
pdfTemplatesRoutes.post("/:id/set-default", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select({ id: pdfTemplates.id }).from(pdfTemplates).where(eq(pdfTemplates.id, id));
    if (!existing) {
      throw new NotFoundError("PDF template not found");
    }
    await db2.update(pdfTemplates).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pdfTemplates.isDefault, true));
    const [template] = await db2.update(pdfTemplates).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pdfTemplates.id, id)).returning();
    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});

// src/routes/cron.routes.ts
var import_express23 = require("express");
var import_juice = __toESM(require("juice"));
var cronRoutes = (0, import_express23.Router)();
cronRoutes.use(cronLimiter);
var verifyCronSecret = (req, res, next) => {
  const expectedSecret = process.env["CRON_SECRET"];
  if (!expectedSecret) {
    logger.error("CRON_SECRET not configured");
    return sendError(res, 503, "CRON_NOT_CONFIGURED", "Cron jobs not configured");
  }
  const cronSecret = req.headers["x-cron-secret"] || req.query["secret"];
  const authHeader = req.headers["authorization"];
  const vercelCronSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (cronSecret !== expectedSecret && vercelCronSecret !== expectedSecret) {
    logger.warn("Invalid cron secret attempt", { ip: req.ip });
    return sendError(res, 403, "FORBIDDEN", "Forbidden");
  }
  next();
};
cronRoutes.post("/quotation-expiry-check", verifyCronSecret, async (req, res, next) => {
  try {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const results = [];
    const expiryWindows = [1, 3, 7];
    for (const days of expiryWindows) {
      const targetDateStart = new Date(now);
      targetDateStart.setDate(targetDateStart.getDate() + days);
      targetDateStart.setHours(0, 0, 0, 0);
      const targetDateEnd = new Date(targetDateStart);
      targetDateEnd.setHours(23, 59, 59, 999);
      const expiringQuotations = await db2.select().from(quotations).where(
        and(
          eq(quotations.status, "sent"),
          gte(quotations.validUntil, targetDateStart),
          lte(quotations.validUntil, targetDateEnd)
        )
      );
      logger.info(`Found ${expiringQuotations.length} quotations expiring in ${days} day(s)`);
      for (const quotation of expiringQuotations) {
        try {
          await notificationService.sendQuotationExpiryReminder(
            quotation.customerEmail,
            quotation.customerName,
            quotation.quotationNumber,
            days,
            quotation.validUntil,
            quotation.acceptanceToken || void 0
          );
          await quotationActivityService.logActivity({
            quotationId: quotation.id,
            activityType: "note_added",
            description: `Expiry reminder sent (${days} day${days === 1 ? "" : "s"} remaining)`,
            actorType: "system"
          }).catch(() => {
          });
          results.push({
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber,
            customerEmail: quotation.customerEmail,
            daysUntilExpiry: days,
            status: "sent"
          });
        } catch (error) {
          logger.error(`Failed to send expiry notification for ${quotation.quotationNumber}:`, error);
          results.push({
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber,
            customerEmail: quotation.customerEmail,
            daysUntilExpiry: days,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    }
    const expiredResult = await db2.update(quotations).set({
      status: "expired",
      updatedAt: now
    }).where(
      and(
        eq(quotations.status, "sent"),
        lte(quotations.validUntil, now)
      )
    ).returning({ id: quotations.id, quotationNumber: quotations.quotationNumber });
    for (const expired of expiredResult) {
      await quotationActivityService.logExpired(expired.id).catch(() => {
      });
    }
    const summary = {
      processedAt: now.toISOString(),
      notificationsSent: results.filter((r) => r.status === "sent").length,
      notificationsFailed: results.filter((r) => r.status === "failed").length,
      autoExpired: expiredResult.length,
      details: results,
      expiredQuotations: expiredResult.map((q) => q.quotationNumber)
    };
    logger.info("Quotation expiry check completed:", summary);
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
});
cronRoutes.post("/cleanup-verification-codes", verifyCronSecret, async (req, res, next) => {
  try {
    const startTime = Date.now();
    const deletedCount = await verificationCodeService.cleanupExpiredCodes();
    const duration = Date.now() - startTime;
    logger.info("Verification codes cleanup cron completed", {
      deletedCount,
      durationMs: duration
    });
    sendSuccess(res, {
      message: "Verification codes cleanup completed",
      deletedCount,
      durationMs: duration,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger.error("Verification codes cleanup cron failed", { error });
    next(error);
  }
});
cronRoutes.get("/health", (req, res) => {
  sendSuccess(res, { status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
cronRoutes.post("/newsletter-send", verifyCronSecret, async (req, res, next) => {
  try {
    const db2 = getDb();
    const now = /* @__PURE__ */ new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const results = [];
    const activeCampaigns = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.status, "sending"));
    logger.info(`Processing ${activeCampaigns.length} active newsletter campaigns`);
    for (const campaign of activeCampaigns) {
      const [todayStats] = await db2.select({
        sentToday: sql`count(*) filter (where ${newsletterSends.sentAt} >= ${startOfDay})`
      }).from(newsletterSends).where(eq(newsletterSends.campaignId, campaign.id));
      const sentToday = Number(todayStats?.sentToday || 0);
      const remainingToday = Math.max(0, campaign.dailyLimit - sentToday);
      if (remainingToday === 0) {
        logger.info(`Campaign ${campaign.name}: Daily limit reached (${campaign.dailyLimit})`);
        continue;
      }
      const pendingSends = await db2.select({
        id: newsletterSends.id,
        email: newsletterSends.email,
        subscriberId: newsletterSends.subscriberId
      }).from(newsletterSends).where(
        and(
          eq(newsletterSends.campaignId, campaign.id),
          eq(newsletterSends.status, "pending")
        )
      ).orderBy(asc(newsletterSends.createdAt)).limit(remainingToday);
      if (pendingSends.length === 0) {
        await db2.update(newsletterCampaigns).set({
          status: "completed",
          completedAt: now,
          updatedAt: now
        }).where(eq(newsletterCampaigns.id, campaign.id));
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          emailsSent: 0,
          emailsFailed: 0,
          completed: true
        });
        logger.info(`Campaign ${campaign.name}: Completed (all emails sent)`);
        continue;
      }
      let emailsSent = 0;
      let emailsFailed = 0;
      for (const send of pendingSends) {
        try {
          const [subscriber] = await db2.select({ unsubscribeToken: newsletterSubscribers.unsubscribeToken }).from(newsletterSubscribers).where(eq(newsletterSubscribers.id, send.subscriberId));
          const baseUrl = process.env["WEBSITE_URL"] || "http://localhost:3000";
          const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber?.unsubscribeToken || ""}`;
          const contentWithUnsubscribe = campaign.content + `
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              You received this email because you subscribed to our newsletter.
              <br>
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
            </p>
          `;
          const inlinedHtml = (0, import_juice.default)(contentWithUnsubscribe, {
            removeStyleTags: true,
            preserveMediaQueries: true,
            preserveFontFaces: true
          });
          const success = await mailerService.sendEmail({
            to: send.email,
            subject: campaign.subject,
            html: inlinedHtml
          });
          if (success) {
            await db2.update(newsletterSends).set({
              status: "sent",
              sentAt: now
            }).where(eq(newsletterSends.id, send.id));
            emailsSent++;
          } else {
            await db2.update(newsletterSends).set({
              status: "failed",
              errorMessage: "Email service returned failure",
              retryCount: sql`${newsletterSends.retryCount} + 1`
            }).where(eq(newsletterSends.id, send.id));
            emailsFailed++;
          }
        } catch (error) {
          logger.error(`Failed to send newsletter to ${send.email}:`, error);
          await db2.update(newsletterSends).set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            retryCount: sql`${newsletterSends.retryCount} + 1`
          }).where(eq(newsletterSends.id, send.id));
          emailsFailed++;
        }
      }
      await db2.update(newsletterCampaigns).set({
        sentCount: sql`${newsletterCampaigns.sentCount} + ${emailsSent}`,
        failedCount: sql`${newsletterCampaigns.failedCount} + ${emailsFailed}`,
        lastSentAt: emailsSent > 0 ? now : campaign.lastSentAt,
        updatedAt: now
      }).where(eq(newsletterCampaigns.id, campaign.id));
      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        emailsSent,
        emailsFailed,
        completed: false
      });
      logger.info(`Campaign ${campaign.name}: Sent ${emailsSent}, Failed ${emailsFailed}`);
    }
    const summary = {
      processedAt: now.toISOString(),
      campaignsProcessed: results.length,
      totalEmailsSent: results.reduce((sum2, r) => sum2 + r.emailsSent, 0),
      totalEmailsFailed: results.reduce((sum2, r) => sum2 + r.emailsFailed, 0),
      campaignsCompleted: results.filter((r) => r.completed).length,
      details: results
    };
    logger.info("Newsletter send cron completed:", summary);
    sendSuccess(res, summary);
  } catch (error) {
    logger.error("Newsletter send cron failed:", error);
    next(error);
  }
});

// src/routes/admin.routes.ts
var import_express24 = require("express");
var import_zod24 = require("zod");
var adminRoutes = (0, import_express24.Router)();
adminRoutes.use(requireAuth, requireAdmin);
var auditLogFiltersSchema2 = import_zod24.z.object({
  startDate: import_zod24.z.string().optional(),
  endDate: import_zod24.z.string().optional(),
  eventType: import_zod24.z.nativeEnum(SecurityEventType).optional(),
  status: import_zod24.z.nativeEnum(EventStatus).optional(),
  actorId: import_zod24.z.string().optional(),
  ipAddress: import_zod24.z.string().optional(),
  limit: import_zod24.z.string().optional(),
  offset: import_zod24.z.string().optional()
});
var exportFiltersSchema = import_zod24.z.object({
  startDate: import_zod24.z.string().optional(),
  endDate: import_zod24.z.string().optional(),
  eventType: import_zod24.z.nativeEnum(SecurityEventType).optional(),
  status: import_zod24.z.nativeEnum(EventStatus).optional(),
  actorId: import_zod24.z.string().optional(),
  ipAddress: import_zod24.z.string().optional(),
  format: import_zod24.z.enum(["csv", "json"]).optional().default("json")
});
var ipListFiltersSchema = import_zod24.z.object({
  isBlocked: import_zod24.z.string().optional(),
  minScore: import_zod24.z.string().optional(),
  maxScore: import_zod24.z.string().optional(),
  limit: import_zod24.z.string().optional(),
  offset: import_zod24.z.string().optional()
});
var blockIPSchema = import_zod24.z.object({
  reason: import_zod24.z.string().min(1, "Block reason is required"),
  duration: import_zod24.z.number().positive().optional()
});
adminRoutes.get("/audit-logs", validateQuery(auditLogFiltersSchema2), async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      eventType,
      status,
      actorId,
      ipAddress,
      limit,
      offset
    } = req.query;
    const filters = {
      startDate: startDate ? new Date(startDate) : void 0,
      endDate: endDate ? new Date(endDate) : void 0,
      eventTypes: eventType ? [eventType] : void 0,
      status,
      actorId,
      ipAddress,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    };
    const logs = await auditLogService.query(filters);
    sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/audit-logs/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const log = await auditLogService.getById(id);
    if (!log) {
      throw new NotFoundError("Audit log not found");
    }
    sendSuccess(res, log);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/audit-logs/export", validateQuery(exportFiltersSchema), async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      eventType,
      status,
      actorId,
      ipAddress,
      format
    } = req.query;
    const filters = {
      startDate: startDate ? new Date(startDate) : void 0,
      endDate: endDate ? new Date(endDate) : void 0,
      eventTypes: eventType ? [eventType] : void 0,
      status,
      actorId,
      ipAddress
    };
    let exportData;
    let contentType;
    let filename;
    if (format === "csv") {
      exportData = await auditLogService.exportToCSV(filters);
      contentType = "text/csv";
      filename = `audit-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    } else {
      exportData = await auditLogService.exportToJSON(filters);
      contentType = "application/json";
      filename = `audit-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/abuse/ips", validateQuery(ipListFiltersSchema), async (req, res, next) => {
  try {
    const { isBlocked, minScore, maxScore, limit, offset } = req.query;
    const filters = {
      isBlocked: isBlocked ? isBlocked === "true" : void 0,
      minScore: minScore ? parseInt(minScore, 10) : void 0,
      maxScore: maxScore ? parseInt(maxScore, 10) : void 0,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    };
    const ips = await ipReputationService.query(filters);
    sendSuccess(res, ips);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/abuse/ips/:ip", async (req, res, next) => {
  try {
    const ip = req.params.ip;
    const reputation = await ipReputationService.getReputation(ip);
    if (!reputation) {
      throw new NotFoundError("IP reputation not found");
    }
    sendSuccess(res, reputation);
  } catch (error) {
    next(error);
  }
});
adminRoutes.post("/abuse/ips/:ip/block", validateBody(blockIPSchema), async (req, res, next) => {
  try {
    const ip = req.params["ip"];
    const { reason, duration } = req.body;
    await ipReputationService.blockIP(ip, reason, duration);
    await auditLogService.logFromRequest(req, {
      eventType: "admin.action.performed" /* ADMIN_ACTION */,
      actorType: "admin" /* ADMIN */,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: "block_ip",
      status: "success" /* SUCCESS */,
      metadata: {
        targetIp: ip,
        reason,
        duration: duration || "permanent"
      }
    });
    sendSuccess(res, { message: "IP blocked successfully", ip, reason, duration });
  } catch (error) {
    next(error);
  }
});
adminRoutes.delete("/abuse/ips/:ip/unblock", async (req, res, next) => {
  try {
    const ip = req.params["ip"];
    await ipReputationService.unblockIP(ip);
    await auditLogService.logFromRequest(req, {
      eventType: "admin.action.performed" /* ADMIN_ACTION */,
      actorType: "admin" /* ADMIN */,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: "unblock_ip",
      status: "success" /* SUCCESS */,
      metadata: {
        targetIp: ip
      }
    });
    sendSuccess(res, { message: "IP unblocked successfully", ip });
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/abuse/stats", async (req, res, next) => {
  try {
    const stats = await ipReputationService.getStatistics();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});

// src/routes/newsletter.routes.ts
var import_express25 = require("express");
var import_zod25 = require("zod");
var import_crypto6 = __toESM(require("crypto"));
var import_juice2 = __toESM(require("juice"));
var newsletterRoutes = (0, import_express25.Router)();
newsletterRoutes.use(requireAuth, requireAdmin);
var subscriberFiltersSchema = import_zod25.z.object({
  page: import_zod25.z.string().optional(),
  limit: import_zod25.z.string().optional(),
  status: import_zod25.z.enum(["active", "unsubscribed", "bounced"]).optional(),
  source: import_zod25.z.enum(["footer", "checkout", "popup", "import", "admin"]).optional(),
  search: import_zod25.z.string().optional()
});
var addSubscriberSchema = import_zod25.z.object({
  email: import_zod25.z.string().email(),
  name: import_zod25.z.string().max(100).optional(),
  source: import_zod25.z.enum(["footer", "checkout", "popup", "import", "admin"]).optional().default("admin")
});
var importSubscribersSchema = import_zod25.z.object({
  subscribers: import_zod25.z.array(
    import_zod25.z.object({
      email: import_zod25.z.string().email(),
      name: import_zod25.z.string().max(100).optional()
    })
  ).min(1).max(1e4)
});
var campaignFiltersSchema = import_zod25.z.object({
  page: import_zod25.z.string().optional(),
  limit: import_zod25.z.string().optional(),
  status: import_zod25.z.enum(["draft", "scheduled", "sending", "paused", "completed", "cancelled"]).optional()
});
var createCampaignSchema = import_zod25.z.object({
  name: import_zod25.z.string().min(1).max(255),
  subject: import_zod25.z.string().min(1).max(255),
  previewText: import_zod25.z.string().max(255).optional().or(import_zod25.z.literal("")),
  content: import_zod25.z.string().min(1),
  dailyLimit: import_zod25.z.coerce.number().int().min(1).max(1e4).optional().default(100),
  sendTime: import_zod25.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(import_zod25.z.literal("")),
  // HH:MM format or empty
  scheduledAt: import_zod25.z.string().datetime().optional().or(import_zod25.z.literal(""))
});
var updateCampaignSchema = import_zod25.z.object({
  name: import_zod25.z.string().min(1).max(255).optional(),
  subject: import_zod25.z.string().min(1).max(255).optional(),
  previewText: import_zod25.z.string().max(255).optional().or(import_zod25.z.literal("")),
  content: import_zod25.z.string().min(1).optional(),
  dailyLimit: import_zod25.z.coerce.number().int().min(1).max(1e4).optional(),
  sendTime: import_zod25.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(import_zod25.z.literal("")),
  scheduledAt: import_zod25.z.string().datetime().optional().or(import_zod25.z.literal(""))
});
newsletterRoutes.get(
  "/subscribers",
  validateQuery(subscriberFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { status, source, search } = req.query;
      const conditions = [];
      if (status) {
        conditions.push(eq(newsletterSubscribers.status, status));
      }
      if (source) {
        conditions.push(eq(newsletterSubscribers.source, source));
      }
      if (search) {
        conditions.push(
          sql`(${newsletterSubscribers.email} ILIKE ${`%${search}%`} OR ${newsletterSubscribers.name} ILIKE ${`%${search}%`})`
        );
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterSubscribers).where(whereClause);
      const total = Number(countResult[0]?.count ?? 0);
      const subscribers = await db2.select().from(newsletterSubscribers).where(whereClause).orderBy(desc(newsletterSubscribers.subscribedAt)).limit(limit).offset(offset);
      sendSuccess(res, subscribers, 200, createPaginationMeta(page, limit, total));
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.get("/subscribers/stats", async (_req, res, next) => {
  try {
    const db2 = getDb();
    const statsResult = await db2.select({
      total: sql`count(*)`,
      active: sql`count(*) filter (where ${newsletterSubscribers.status} = 'active')`,
      unsubscribed: sql`count(*) filter (where ${newsletterSubscribers.status} = 'unsubscribed')`,
      bounced: sql`count(*) filter (where ${newsletterSubscribers.status} = 'bounced')`,
      thisMonth: sql`count(*) filter (where ${newsletterSubscribers.subscribedAt} >= date_trunc('month', current_date))`,
      thisWeek: sql`count(*) filter (where ${newsletterSubscribers.subscribedAt} >= date_trunc('week', current_date))`
    }).from(newsletterSubscribers);
    const stats = statsResult[0];
    const bySource = await db2.select({
      source: newsletterSubscribers.source,
      count: sql`count(*)`
    }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active")).groupBy(newsletterSubscribers.source);
    sendSuccess(res, {
      total: Number(stats?.total ?? 0),
      active: Number(stats?.active ?? 0),
      unsubscribed: Number(stats?.unsubscribed ?? 0),
      bounced: Number(stats?.bounced ?? 0),
      thisMonth: Number(stats?.thisMonth ?? 0),
      thisWeek: Number(stats?.thisWeek ?? 0),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = Number(item.count);
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.get("/subscribers/export", async (req, res, next) => {
  try {
    const db2 = getDb();
    const { status } = req.query;
    const conditions = [];
    if (status) {
      conditions.push(eq(newsletterSubscribers.status, status));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const subscribers = await db2.select({
      email: newsletterSubscribers.email,
      name: newsletterSubscribers.name,
      status: newsletterSubscribers.status,
      source: newsletterSubscribers.source,
      subscribedAt: newsletterSubscribers.subscribedAt,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt
    }).from(newsletterSubscribers).where(whereClause).orderBy(desc(newsletterSubscribers.subscribedAt));
    const headers = ["Email", "Name", "Status", "Source", "Subscribed At", "Unsubscribed At"];
    const rows = subscribers.map((s) => [
      s.email,
      s.name || "",
      s.status,
      s.source,
      s.subscribedAt.toISOString(),
      s.unsubscribedAt?.toISOString() || ""
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post(
  "/subscribers",
  validateBody(addSubscriberSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { email, name, source } = req.body;
      const [existing] = await db2.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase()));
      if (existing) {
        throw new BadRequestError("Email already subscribed");
      }
      const unsubscribeToken = import_crypto6.default.randomBytes(32).toString("hex");
      const [subscriber] = await db2.insert(newsletterSubscribers).values({
        email: email.toLowerCase(),
        name,
        source,
        unsubscribeToken,
        status: "active"
      }).returning();
      sendSuccess(res, subscriber, 201);
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.post(
  "/subscribers/import",
  validateBody(importSubscribersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { subscribers: inputSubscribers } = req.body;
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };
      const existingEmails = new Set(
        (await db2.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers)).map((s) => s.email.toLowerCase())
      );
      const newSubscribers = inputSubscribers.filter((s) => {
        if (existingEmails.has(s.email.toLowerCase())) {
          results.skipped++;
          return false;
        }
        return true;
      });
      const batchSize = 100;
      for (let i = 0; i < newSubscribers.length; i += batchSize) {
        const batch = newSubscribers.slice(i, i + batchSize);
        const values = batch.map((s) => ({
          email: s.email.toLowerCase(),
          name: s.name || null,
          source: "import",
          unsubscribeToken: import_crypto6.default.randomBytes(32).toString("hex"),
          status: "active"
        }));
        await db2.insert(newsletterSubscribers).values(values);
        results.imported += batch.length;
      }
      sendSuccess(res, {
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
        ...results
      });
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.delete("/subscribers/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [deleted] = await db2.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).returning();
    if (!deleted) {
      throw new NotFoundError("Subscriber not found");
    }
    sendSuccess(res, { message: "Subscriber removed successfully" });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post(
  "/subscribers/bulk-delete",
  validateBody(import_zod25.z.object({ ids: import_zod25.z.array(import_zod25.z.string().uuid()).min(1) })),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { ids } = req.body;
      const deleted = await db2.delete(newsletterSubscribers).where(inArray(newsletterSubscribers.id, ids)).returning();
      sendSuccess(res, { message: `${deleted.length} subscribers removed` });
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.get(
  "/campaigns",
  validateQuery(campaignFiltersSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { status } = req.query;
      const conditions = [];
      if (status) {
        conditions.push(eq(newsletterCampaigns.status, status));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterCampaigns).where(whereClause);
      const total = Number(countResult[0]?.count ?? 0);
      const campaigns = await db2.select().from(newsletterCampaigns).where(whereClause).orderBy(desc(newsletterCampaigns.createdAt)).limit(limit).offset(offset);
      sendSuccess(res, campaigns, 200, createPaginationMeta(page, limit, total));
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.get("/campaigns/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [campaign] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    sendSuccess(res, campaign);
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post(
  "/campaigns",
  validateBody(createCampaignSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const { name, subject, previewText, content, dailyLimit, sendTime, scheduledAt } = req.body;
      const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
      const subscriberCount = Number(countResult[0]?.count ?? 0);
      const userId = req.user?.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const createdBy = userId && uuidRegex.test(userId) ? userId : null;
      const [campaign] = await db2.insert(newsletterCampaigns).values({
        name,
        subject,
        previewText: previewText || null,
        content,
        // Raw HTML preserved - admin-only content
        dailyLimit,
        sendTime: sendTime || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: subscriberCount,
        status: scheduledAt ? "scheduled" : "draft",
        createdBy
      }).returning();
      sendSuccess(res, campaign, 201);
    } catch (error) {
      console.error("Campaign creation error:", error);
      next(error);
    }
  }
);
newsletterRoutes.put(
  "/campaigns/:id",
  validateBody(updateCampaignSchema),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const updates = req.body;
      const [existing] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
      if (!existing) {
        throw new NotFoundError("Campaign not found");
      }
      if (!["draft", "paused", "scheduled"].includes(existing.status)) {
        throw new BadRequestError("Can only edit draft, scheduled, or paused campaigns");
      }
      const additionalUpdates = {};
      if (updates["scheduledAt"]) {
        additionalUpdates["scheduledAt"] = new Date(updates["scheduledAt"]);
        if (existing.status === "draft") {
          additionalUpdates["status"] = "scheduled";
        }
      }
      if (updates["content"]) {
        const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
        additionalUpdates["totalRecipients"] = Number(countResult[0]?.count ?? 0);
      }
      const [campaign] = await db2.update(newsletterCampaigns).set({
        ...updates,
        ...additionalUpdates,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(newsletterCampaigns.id, id)).returning();
      sendSuccess(res, campaign);
    } catch (error) {
      next(error);
    }
  }
);
newsletterRoutes.delete("/campaigns/:id", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [existing] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    if (!existing) {
      throw new NotFoundError("Campaign not found");
    }
    if (existing.status !== "draft") {
      throw new BadRequestError("Can only delete draft campaigns");
    }
    await db2.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    sendSuccess(res, { message: "Campaign deleted successfully" });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post("/campaigns/:id/start", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [campaign] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    if (!["draft", "scheduled", "paused"].includes(campaign.status)) {
      throw new BadRequestError("Campaign cannot be started in its current state");
    }
    const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
    const totalRecipients = Number(countResult[0]?.count ?? 0);
    if (totalRecipients === 0) {
      throw new BadRequestError("No active subscribers to send to");
    }
    const activeSubscribers = await db2.select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
    const existingSends = await db2.select({ subscriberId: newsletterSends.subscriberId }).from(newsletterSends).where(eq(newsletterSends.campaignId, id));
    const existingSubscriberIds = new Set(existingSends.map((s) => s.subscriberId));
    const newSubscribers = activeSubscribers.filter((s) => !existingSubscriberIds.has(s.id));
    if (newSubscribers.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < newSubscribers.length; i += batchSize) {
        const batch = newSubscribers.slice(i, i + batchSize);
        await db2.insert(newsletterSends).values(
          batch.map((s) => ({
            campaignId: id,
            subscriberId: s.id,
            email: s.email,
            status: "pending"
          }))
        );
      }
    }
    const [updated] = await db2.update(newsletterCampaigns).set({
      status: "sending",
      totalRecipients,
      startedAt: campaign.startedAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(newsletterCampaigns.id, id)).returning();
    sendSuccess(res, {
      message: "Campaign started",
      campaign: updated,
      pendingSends: newSubscribers.length
    });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post("/campaigns/:id/pause", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [campaign] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    if (campaign.status !== "sending") {
      throw new BadRequestError("Can only pause campaigns that are sending");
    }
    const [updated] = await db2.update(newsletterCampaigns).set({
      status: "paused",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(newsletterCampaigns.id, id)).returning();
    sendSuccess(res, { message: "Campaign paused", campaign: updated });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post("/campaigns/:id/cancel", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const [campaign] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    if (["completed", "cancelled"].includes(campaign.status)) {
      throw new BadRequestError("Campaign cannot be cancelled in its current state");
    }
    await db2.delete(newsletterSends).where(
      and(
        eq(newsletterSends.campaignId, id),
        eq(newsletterSends.status, "pending")
      )
    );
    const [updated] = await db2.update(newsletterCampaigns).set({
      status: "cancelled",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(newsletterCampaigns.id, id)).returning();
    sendSuccess(res, { message: "Campaign cancelled", campaign: updated });
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.get("/campaigns/:id/sends", async (req, res, next) => {
  try {
    const db2 = getDb();
    const id = req.params["id"];
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { status } = req.query;
    const conditions = [eq(newsletterSends.campaignId, id)];
    if (status) {
      conditions.push(eq(newsletterSends.status, status));
    }
    const whereClause = and(...conditions);
    const countResult = await db2.select({ count: sql`count(*)` }).from(newsletterSends).where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);
    const sends = await db2.select().from(newsletterSends).where(whereClause).orderBy(asc(newsletterSends.createdAt)).limit(limit).offset(offset);
    sendSuccess(res, sends, 200, createPaginationMeta(page, limit, total));
  } catch (error) {
    next(error);
  }
});
newsletterRoutes.post(
  "/campaigns/:id/test",
  validateBody(import_zod25.z.object({ email: import_zod25.z.string().email() })),
  async (req, res, next) => {
    try {
      const db2 = getDb();
      const id = req.params["id"];
      const { email } = req.body;
      const [campaign] = await db2.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
      if (!campaign) {
        throw new NotFoundError("Campaign not found");
      }
      const websiteUrl = process.env["WEBSITE_URL"] || "https://lab404.com";
      const unsubscribeUrl = `${websiteUrl}/newsletter/unsubscribe?token=test-preview`;
      const unsubscribeFooter = `
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is a test email preview.<br>
          <a href="${unsubscribeUrl}">Unsubscribe</a>
        </p>
      `;
      const contentWithFooter = campaign.content + unsubscribeFooter;
      const inlinedHtml = (0, import_juice2.default)(contentWithFooter, {
        removeStyleTags: true,
        preserveMediaQueries: true,
        preserveFontFaces: true
      });
      const success = await mailerService.sendEmail({
        to: email,
        subject: `[TEST] ${campaign.subject}`,
        html: inlinedHtml
      });
      if (!success) {
        throw new BadRequestError("Failed to send test email. Check SMTP configuration.");
      }
      sendSuccess(res, {
        message: `Test email sent to ${email}`,
        campaign: {
          id: campaign.id,
          subject: campaign.subject
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/index.ts
var router2 = (0, import_express26.Router)();
router2.use("/health", healthRoutes);
router2.use("/auth", authRoutes);
router2.use("/auth/sessions", sessionsRoutes);
router2.use("/products", productsRoutes);
router2.use("/search", searchRoutes);
router2.use("/categories", categoriesRoutes);
router2.use("/cart", cartRoutes);
router2.use("/orders", ordersRoutes);
router2.use("/blogs", blogsRoutes);
router2.use("/settings", settingsRoutes);
router2.use("/promo-codes", promoCodesRoutes);
router2.use("/contact", contactRoutes);
router2.use("/customers", customersRoutes);
router2.use("/quotations", quotationsRoutes);
router2.use("/quotation-templates", quotationTemplatesRoutes);
router2.use("/analytics", analyticsRoutes);
router2.use("/export", exportRoutes);
router2.use("/import", importRoutes);
router2.use("/upload", uploadRoutes);
router2.use("/notifications", notifications_routes_default);
router2.use("/google-images", googleImagesRoutes);
router2.use("/pdf-templates", pdfTemplatesRoutes);
router2.use("/admin", adminRoutes);
router2.use("/newsletter", newsletterRoutes);
router2.use("/cron", cronRoutes);
router2.get("/", (_req, res) => {
  res.json({
    name: "Lab404Electronics API",
    version: "1.0.0",
    documentation: "/api/docs",
    endpoints: {
      // Public
      auth: "/api/auth",
      products: "/api/products",
      search: "/api/search",
      categories: "/api/categories",
      cart: "/api/cart",
      orders: "/api/orders",
      blogs: "/api/blogs",
      contact: "/api/contact",
      health: "/api/health",
      // Authenticated
      customers: "/api/customers",
      // Admin
      promoCodes: "/api/promo-codes",
      quotations: "/api/quotations",
      settings: "/api/settings",
      analytics: "/api/analytics",
      export: "/api/export",
      import: "/api/import",
      upload: "/api/upload",
      notifications: "/api/notifications",
      googleImages: "/api/google-images",
      newsletter: "/api/newsletter"
    }
  });
});

// src/app.ts
function createApp() {
  const app2 = (0, import_express27.default)();
  app2.set("trust proxy", 1);
  app2.use(requestIdMiddleware);
  app2.use((0, import_helmet.default)());
  app2.use(
    (0, import_cors.default)({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (config.corsOrigins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Session-ID", "X-CSRF-Token"]
    })
  );
  app2.use(defaultLimiter);
  app2.use((0, import_compression.default)());
  app2.use((0, import_cookie_parser.default)());
  app2.use(import_express27.default.json({ limit: "10mb" }));
  app2.use(import_express27.default.urlencoded({ extended: true, limit: "10mb" }));
  app2.use(xssSanitize);
  app2.use((req, res, next) => {
    const publicAuthPaths = [
      "/api/auth/login",
      "/api/auth/admin/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/verify-reset-code",
      "/api/auth/reset-password",
      "/api/auth/verify-email"
    ];
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path === "/health" || req.path === "/api/health" || publicAuthPaths.includes(req.path)) {
      return next();
    }
    doubleCsrfProtection(req, res, next);
  });
  if (config.isDev) {
    app2.use((0, import_morgan.default)("dev"));
  } else {
    app2.use(
      (0, import_morgan.default)("combined", {
        stream: { write: (message) => logger.http(message.trim()) }
      })
    );
  }
  app2.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: config.env
    });
  });
  app2.get("/api/csrf-token", (req, res) => {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  });
  app2.use("/api", router2);
  app2.use(notFoundHandler);
  app2.use(errorHandler);
  return app2;
}

// api/index.ts
var app = createApp();
var index_default = app;
//# sourceMappingURL=index.js.map