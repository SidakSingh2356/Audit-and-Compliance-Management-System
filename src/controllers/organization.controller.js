const asyncHandler = require('../utils/asyncHandler');
const organizationService = require('../services/organization.service');

const organizationController = {
  getAll: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await organizationService.getAllOrganizations(
      parseInt(page, 10),
      parseInt(limit, 10),
      search
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await organizationService.getOrganizationById(id);

    res.status(200).json({
      success: true,
      data: organization,
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { name, contactInfo, industry } = req.body;

    const organization = await organizationService.createOrganization(name, contactInfo, industry);

    res.status(201).json({
      success: true,
      data: organization,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, contactInfo, industry } = req.body;

    const organization = await organizationService.updateOrganization(id, name, contactInfo, industry);

    res.status(200).json({
      success: true,
      data: organization,
    });
  }),

  deactivate: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await organizationService.deactivateOrganization(id);

    res.status(200).json({
      success: true,
      data: organization,
    });
  }),
};

module.exports = organizationController;
