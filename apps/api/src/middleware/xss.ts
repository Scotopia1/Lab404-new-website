import xss, { IFilterXSSOptions } from 'xss';
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
 * XSS filter options for rich content (allows safe HTML)
 */
const richContentOptions: IFilterXSSOptions = {
  whiteList: {
    p: [], br: [], b: [], i: [], u: [], strong: [], em: [],
    a: ['href', 'title', 'target'],
    ul: [], ol: [], li: [],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    blockquote: [], code: [], pre: [],
    img: ['src', 'alt', 'title'],
    span: ['class'], div: ['class'],
    hr: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
  },
  stripIgnoreTag: false,
  stripIgnoreTagBody: ['script'],
};

/**
 * Sanitize function - recursively sanitizes strings in objects
 */
const sanitize = (obj: any, options: IFilterXSSOptions = strictOptions): any => {
  if (typeof obj === 'string') {
    return xss(obj, options);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, options));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitize(obj[key], options);
    }
    return sanitized;
  }
  return obj;
};

/**
 * XSS Sanitization Middleware
 * Sanitizes all user input by default (strips all HTML)
 */
export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query params - need to copy properties individually
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    for (const key in sanitizedQuery) {
      req.query[key] = sanitizedQuery[key];
    }
  }

  // Sanitize route params - need to copy properties individually
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
