// ===========================================
// Lab404Electronics Database Package
// ===========================================

// Database client
export { createDb, getDb, db, type Database } from './client';

// Re-export schema
export * from './schema';

// Re-export drizzle-orm utilities to ensure consistent version usage
export {
  sql,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  like,
  ilike,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  between,
  desc,
  asc,
  count,
  sum,
  avg,
  min,
  max,
} from 'drizzle-orm';
