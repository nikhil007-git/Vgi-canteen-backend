// Lightweight Schema-Based Input Validator Middleware
// Provides strict type, length, format, and range checks without external dependencies

export const sanitizeString = (val) => {
  if (typeof val !== 'string') return val;
  // Strip null bytes and non-printable control characters (except common whitespace)
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
};

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-()+]/g, '');
  return /^[0-9]{10,15}$/.test(clean);
};

export const isValidSafeUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) {
    // Only accept valid image data URIs (jpeg, png, webp)
    return /^data:image\/(jpeg|png|webp|jpg);base64,[A-Za-z0-9+/=]+$/.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidUUIDOrId = (id) => {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id.trim());
};

/**
 * Validate an object against a declarative field schema
 * @param {Object} data - req.body, req.query, or req.params
 * @param {Object} schema - Field definitions
 * @param {Object} options - { allowUnknown: boolean }
 */
export const validateData = (data, schema, options = { allowUnknown: false }) => {
  const errors = [];
  const sanitized = {};

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request payload must be a valid JSON object.'] };
  }

  // Check for unknown keys if disallowed
  if (!options.allowUnknown) {
    for (const key of Object.keys(data)) {
      if (!schema[key]) {
        errors.push(`Field '${key}' is not allowed.`);
      }
    }
  }

  for (const [field, rules] of Object.entries(schema)) {
    let val = data[field];

    // Check required
    if (val === undefined || val === null || val === '') {
      if (rules.required) {
        errors.push(`Field '${field}' is required.`);
      }
      continue;
    }

    // Type validation
    if (rules.type === 'string') {
      if (typeof val !== 'string') {
        errors.push(`Field '${field}' must be a string.`);
        continue;
      }
      val = sanitizeString(val);
      if (rules.minLength !== undefined && val.length < rules.minLength) {
        errors.push(`Field '${field}' must be at least ${rules.minLength} characters.`);
      }
      if (rules.maxLength !== undefined && val.length > rules.maxLength) {
        errors.push(`Field '${field}' cannot exceed ${rules.maxLength} characters.`);
      }
      if (rules.isEmail && !isValidEmail(val)) {
        errors.push(`Field '${field}' must be a valid email address.`);
      }
      if (rules.isPhone && !isValidPhone(val)) {
        errors.push(`Field '${field}' must be a valid phone number (10-15 digits).`);
      }
      if (rules.isUrl && !isValidSafeUrl(val)) {
        errors.push(`Field '${field}' must be a valid HTTP, HTTPS, or image data URL.`);
      }
      if (rules.regex && !rules.regex.test(val)) {
        errors.push(rules.regexMessage || `Field '${field}' format is invalid.`);
      }
      if (rules.enum && !rules.enum.includes(val)) {
        errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}.`);
      }
      sanitized[field] = val;
    } else if (rules.type === 'number') {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push(`Field '${field}' must be a valid number.`);
        continue;
      }
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min}.`);
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`Field '${field}' cannot exceed ${rules.max}.`);
      }
      if (rules.integer && !Number.isInteger(num)) {
        errors.push(`Field '${field}' must be an integer.`);
      }
      sanitized[field] = num;
    } else if (rules.type === 'boolean') {
      if (typeof val === 'boolean') {
        sanitized[field] = val;
      } else if (val === 'true' || val === '1') {
        sanitized[field] = true;
      } else if (val === 'false' || val === '0') {
        sanitized[field] = false;
      } else {
        errors.push(`Field '${field}' must be a boolean.`);
      }
    } else if (rules.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`Field '${field}' must be an array.`);
        continue;
      }
      if (rules.minItems !== undefined && val.length < rules.minItems) {
        errors.push(`Field '${field}' must contain at least ${rules.minItems} item(s).`);
      }
      if (rules.maxItems !== undefined && val.length > rules.maxItems) {
        errors.push(`Field '${field}' cannot contain more than ${rules.maxItems} item(s).`);
      }
      if (rules.itemValidator) {
        for (let i = 0; i < val.length; i++) {
          const itemRes = rules.itemValidator(val[i], i);
          if (!itemRes.isValid) {
            errors.push(...itemRes.errors.map(e => `${field}[${i}]: ${e}`));
          }
        }
      }
      sanitized[field] = val;
    } else if (rules.type === 'object') {
      if (typeof val !== 'object' || Array.isArray(val) || val === null) {
        errors.push(`Field '${field}' must be an object.`);
      } else {
        sanitized[field] = val;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: sanitized
  };
};

/**
 * Express middleware generator for request body validation
 */
export const validateBody = (schema, options = { allowUnknown: false }) => {
  return (req, res, next) => {
    const result = validateData(req.body, schema, options);
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.errors[0],
        errors: result.errors
      });
    }
    req.validatedBody = result.data;
    next();
  };
};

/**
 * Express middleware generator for request params validation
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = validateData(req.params, schema, { allowUnknown: true });
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.errors[0],
        errors: result.errors
      });
    }
    next();
  };
};
