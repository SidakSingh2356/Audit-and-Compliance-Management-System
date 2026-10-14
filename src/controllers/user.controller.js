const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const userController = {
  getAll: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, organizationId, role } = req.query;

    const result = await userService.getAllUsers(
      parseInt(page, 10),
      parseInt(limit, 10),
      organizationId ? parseInt(organizationId, 10) : null,
      role
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { email, password, role, organizationId, fullName } = req.body;

    const user = await userService.createUser(email, password, role, organizationId, fullName);

    res.status(201).json({
      success: true,
      data: user,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, role, fullName } = req.body;

    const user = await userService.updateUser(
      id,
      email,
      role,
      fullName,
      req.user.role,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  deactivate: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.deactivateUser(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};

module.exports = userController;
