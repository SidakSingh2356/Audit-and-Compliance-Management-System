const Joi = require('joi');

const findingValidator = {
  create: Joi.object({
    auditId: Joi.number().integer().required().messages({
      'number.base': 'Audit ID must be a number',
      'any.required': 'Audit ID is required',
    }),
    title: Joi.string().required().messages({
      'string.empty': 'Finding title is required',
      'any.required': 'Finding title is required',
    }),
    description: Joi.string().optional().allow(null, ''),
    severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required().messages({
      'any.only': 'Severity must be one of: Critical, High, Medium, Low',
      'any.required': 'Severity is required',
    }),
    assignedTo: Joi.number().integer().optional().allow(null),
    dueDate: Joi.date().optional().allow(null),
  }).unknown(false),

  query: Joi.object({
    auditId: Joi.number().integer().required().messages({
      'number.base': 'auditId must be a number',
      'any.required': 'auditId query parameter is required',
    }),
    severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').optional(),
    status: Joi.string().valid('Open', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed').optional(),
  }).unknown(false),

  comment: Joi.object({
    commentText: Joi.string().required().messages({
      'string.empty': 'Comment text is required',
      'any.required': 'Comment text is required',
    }),
  }).unknown(false),
};

module.exports = findingValidator;