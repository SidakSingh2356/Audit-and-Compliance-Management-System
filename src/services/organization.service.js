const organizationRepository = require('../repositories/organization.repository');
const ApiError = require('../utils/ApiError');

const organizationService = {
  async getAllOrganizations(page = 1, limit = 10, searchName = null) {
    const offset = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      organizationRepository.findAll(limit, offset, searchName),
      organizationRepository.count(searchName),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOrganizationById(id) {
    const organization = await organizationRepository.findById(id);
    if (!organization) {
      throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }
    return organization;
  },

  async createOrganization(name, contactInfo, industry) {
    if (!name || name.trim() === '') {
      throw new ApiError('Organization name is required', 400, 'INVALID_INPUT');
    }

    try {
      return await organizationRepository.create(name, contactInfo, industry);
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError('Organization name already exists', 409, 'ORGANIZATION_ALREADY_EXISTS');
      }
      throw err;
    }
  },

  async updateOrganization(id, name, contactInfo, industry) {
    const organization = await organizationRepository.findById(id);
    if (!organization) {
      throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }

    if (!name || name.trim() === '') {
      throw new ApiError('Organization name is required', 400, 'INVALID_INPUT');
    }

    return organizationRepository.update(id, name, contactInfo, industry);
  },

  async deactivateOrganization(id) {
    const organization = await organizationRepository.findById(id);
    if (!organization) {
      throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }

    if (!organization.is_active) {
      throw new ApiError('Organization is already deactivated', 400, 'ALREADY_DEACTIVATED');
    }

    const updated = await organizationRepository.deactivate(id);
    return updated;
  },
};

module.exports = organizationService;
