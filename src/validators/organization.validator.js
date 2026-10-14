const Joi = require('joi');

const organizationValidator = {
  create: Joi.object({
    name: Joi.string().trim().min(1).required().messages({
      'any.required': 'Organization name is required',
    }),
    contactInfo: Joi.alternatives().try(Joi.object(), Joi.string().trim().min(1)).optional(),
    industry: Joi.string().optional(),
  }).rename('contact_info', 'contactInfo', { override: false }),

  update: Joi.object({
    name: Joi.string().trim().min(1).required().messages({
      'any.required': 'Organization name is required',
    }),
    contactInfo: Joi.alternatives().try(Joi.object(), Joi.string().trim().min(1)).optional(),
    industry: Joi.string().optional(),
  }).rename('contact_info', 'contactInfo', { override: false }),
};

module.exports = organizationValidator;
