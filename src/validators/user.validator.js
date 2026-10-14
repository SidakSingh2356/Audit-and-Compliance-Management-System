const Joi = require('joi');

const userValidator = {
  create: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('admin', 'auditor', 'client').required().messages({
      'any.only': 'Role must be admin, auditor, or client',
      'any.required': 'Role is required',
    }),
    organizationId: Joi.number().integer().required().messages({
      'number.base': 'Organization ID must be a number',
      'any.required': 'Organization ID is required',
    }),
    fullName: Joi.string().trim().min(1).required().messages({
      'any.required': 'Full name is required',
    }),
  })
    .rename('organization_id', 'organizationId', { override: false })
    .rename('full_name', 'fullName', { override: false }),

  update: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string().valid('admin', 'auditor', 'client').required().messages({
      'any.only': 'Role must be admin, auditor, or client',
      'any.required': 'Role is required',
    }),
    fullName: Joi.string().trim().min(1).required().messages({
      'any.required': 'Full name is required',
    }),
  }).rename('full_name', 'fullName', { override: false }),
};

module.exports = userValidator;
