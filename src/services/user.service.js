const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const organizationRepository = require('../repositories/organization.repository');
const ApiError = require('../utils/ApiError');

const validRoles = ['admin', 'auditor', 'client'];
const roleRank = { client: 1, auditor: 2, admin: 3 };

const withoutPassword = (user) => {
  if (!user) return user;
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const userService = {
  async getAllUsers(page = 1, limit = 10, organizationId = null, role = null) {
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      userRepository.findAll(limit, offset, organizationId, role),
      userRepository.count(organizationId, role),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }
    return withoutPassword(user);
  },

  async createUser(email, password, role, organizationId, fullName) {
    if (!email || !password || !role || !organizationId || !fullName) {
      throw new ApiError('All fields are required', 400, 'INVALID_INPUT');
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
    }

    if (!validRoles.includes(role)) {
      throw new ApiError('Invalid role', 400, 'INVALID_ROLE');
    }

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await userRepository.create(email, hashedPassword, role, organizationId, fullName);
      return withoutPassword(user);
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
      }
      if (err.code === '23503') {
        throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }
      throw err;
    }
  },

  async updateUser(id, email, role, fullName, currentUserRole, currentUserId) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!validRoles.includes(role)) {
      throw new ApiError('Invalid role', 400, 'INVALID_ROLE');
    }

    if (String(currentUserId) === String(id) && roleRank[role] > roleRank[currentUserRole]) {
      throw new ApiError('Cannot escalate your own role', 403, 'CANNOT_CHANGE_OWN_ROLE');
    }

    // Check if new email is already in use by another user
    if (email !== user.email) {
      const emailExists = await userRepository.findByEmail(email);
      if (emailExists) {
        throw new ApiError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
      }
    }

    try {
      const updated = await userRepository.update(id, email, role, fullName);
      return withoutPassword(updated);
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw err;
    }
  },

  async deactivateUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new ApiError('User is already deactivated', 400, 'ALREADY_DEACTIVATED');
    }

    const updated = await userRepository.deactivate(id);
    return updated;
  },
};

module.exports = userService;
