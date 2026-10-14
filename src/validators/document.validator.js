const Joi = require('joi');

const documentValidator = {
  createRequest: Joi.object({
    auditId: Joi.number().integer().optional(),
    audit_id: Joi.number().integer().optional(),
    name: Joi.string().required().messages({
      'string.empty': 'Document request name is required',
      'any.required': 'Document request name is required',
    }),
    description: Joi.string().optional().allow(null, ''),
    dueDate: Joi.date().optional().allow(null),
  }).or('auditId', 'audit_id').unknown(false),

  review: Joi.object({
    status: Joi.string().valid('Accepted', 'Rejected').required().messages({
      'any.only': 'Review status must be Accepted or Rejected',
      'any.required': 'Review status is required',
    }),
    reviewComment: Joi.string().optional().allow(null, ''),
    comment: Joi.string().optional().allow(null, ''),
  }).unknown(false),
};

module.exports = documentValidator;