import xss, { IFilterXSSOptions, escapeAttrValue } from 'xss';
import { Request, Response, NextFunction } from 'express';

/**
 * XSS filter options for strict sanitization (strips all HTML)
 */
const strictOptions: IFilterXSSOptions = {
  whiteList: {}, // No tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * XSS filter options for rich content (allows safe HTML for blogs)
 */
const richContentOptions: IFilterXSSOptions = {
  whiteList: {
    // Text formatting
    p: ['style', 'class'], br: [], b: [], i: [], u: [], strong: [], em: [], span: ['style', 'class'],
    // Links
    a: ['href', 'title', 'target', 'style', 'class'],
    // Lists
    ul: ['style', 'class'], ol: ['style', 'class'], li: ['style', 'class'],
    // Headings
    h1: ['style', 'class'], h2: ['style', 'class'], h3: ['style', 'class'],
    h4: ['style', 'class'], h5: ['style', 'class'], h6: ['style', 'class'],
    // Block elements
    blockquote: ['style', 'class'], code: ['class'], pre: ['style', 'class'],
    div: ['style', 'class', 'id'],
    // Media
    img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class'],
    // Layout
    hr: ['style'],
    // Tables
    table: ['style', 'class', 'border', 'cellpadding', 'cellspacing', 'width', 'align'],
    thead: ['style'], tbody: ['style'], tfoot: ['style'],
    tr: ['style', 'class'], th: ['style', 'class', 'colspan', 'rowspan', 'align', 'valign'],
    td: ['style', 'class', 'colspan', 'rowspan', 'align', 'valign', 'width', 'height'],
    caption: ['style'],
  },
  stripIgnoreTag: false,
  stripIgnoreTagBody: ['script'],
  onIgnoreTagAttr: function(tag, name, value, isWhiteAttr) {
    if (name.startsWith('data-')) {
      return `${name}="${escapeAttrValue(value)}"`;
    }
  },
};

/**
 * Fields that should NOT be sanitized at all (raw HTML preserved)
 * These are admin-only fields for HTML email content
 */
const rawHtmlFields = ['content'];

/**
 * Sanitize function - recursively sanitizes strings in objects
 * Skips sanitization entirely for rawHtmlFields (newsletter content)
 */
const sanitize = (obj: any, options: IFilterXSSOptions = strictOptions, fieldName?: string): any => {
  if (typeof obj === 'string') {
    // Skip sanitization entirely for raw HTML fields (newsletter content)
    // These are admin-only and need full HTML support (doctype, link, style, etc.)
    if (fieldName && rawHtmlFields.includes(fieldName)) {
      return obj; // Return as-is, no sanitization
    }
    return xss(obj, options);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, options, fieldName));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitize(obj[key], options, key);
    }
    return sanitized;
  }
  return obj;
};

/**
 * XSS Sanitization Middleware
 * Sanitizes all user input by default (strips all HTML)
 * EXCEPTION: 'content' field is NOT sanitized (for newsletter HTML emails)
 */
export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query params
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    for (const key in sanitizedQuery) {
      req.query[key] = sanitizedQuery[key];
    }
  }

  // Sanitize route params
  if (req.params) {
    const sanitizedParams = sanitize(req.params);
    for (const key in sanitizedParams) {
      req.params[key] = sanitizedParams[key];
    }
  }

  next();
};

/**
 * Sanitize rich content (blogs) - allow safe HTML
 * Use this function explicitly for fields that should allow HTML formatting
 */
export const sanitizeRichContent = (html: string): string => {
  return xss(html, richContentOptions);
};
