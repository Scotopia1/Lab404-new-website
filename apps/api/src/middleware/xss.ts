import createDOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

const DOMPurify = createDOMPurify();

/**
 * Sanitize function - recursively sanitizes strings in objects
 */
const sanitize = (obj: any): any => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip all HTML by default
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitize(obj[key]);
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
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

/**
 * Sanitize rich content (blogs) - allow safe HTML
 * Use this function explicitly for fields that should allow HTML formatting
 */
export const sanitizeRichContent = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'img', 'span', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
  });
};
