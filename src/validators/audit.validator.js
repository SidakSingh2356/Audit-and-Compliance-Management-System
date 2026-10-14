const Joi = require('joi');

const auditValidator = {
  create: Joi.object({
    title: Joi.string().trim().min(1).required().messages({
      'string.empty': 'Audit title is required',
      'any.required': 'Audit title is required',
    }),
    description: Joi.string().optional().allow(null, ''),
    organizationId: Joi.number().integer().required().messages({
      'number.base': 'Organization ID must be a number',
      'any.required': 'Organization ID is required',
    }),
    startDate: Joi.date().optional().allow(null),
    dueDate: Joi.date().optional().allow(null),
  })
    .rename('organization_id', 'organizationId', { override: false })
    .rename('start_date', 'startDate', { override: false })
    .rename('due_date', 'dueDate', { override: false })
    .unknown(false),

  update: Joi.object({
    title: Joi.string().trim().min(1).optional().messages({
      'string.empty': 'Audit title is required',
    }),
    description: Joi.string().optional().allow(null, ''),
    status: Joi.string()
      .valid('Draft', 'Pending', 'In Progress', 'Under Review', 'Completed', 'Cancelled', 'Overdue')
      .optional()
      .messages({
        'any.only': 'Status must be one of: Draft, Pending, In Progress, Under Review, Completed, Cancelled, Overdue',
      }),
    startDate: Joi.date().optional().allow(null),
    dueDate: Joi.date().optional().allow(null),
  })
    .rename('start_date', 'startDate', { override: false })
    .rename('due_date', 'dueDate', { override: false })
    .min(1)
    .unknown(false),

  assign: Joi.object({
    auditorId: Joi.number().integer().required().messages({
      'number.base': 'Auditor ID must be a number',
      'any.required': 'Auditor ID is required',
    }),
  }).rename('auditor_id', 'auditorId', { override: false }).unknown(false),

  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    status: Joi.string().optional(),
    organizationId: Joi.number().integer().optional(),
    search: Joi.string().optional(),
  }).unknown(true), // Allow extra query params
};

module.exports = auditValidator;
