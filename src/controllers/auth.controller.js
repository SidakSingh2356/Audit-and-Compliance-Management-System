const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.refresh(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await authService.logout(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    const result = await authService.resetPassword(resetToken, newPassword);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};

module.exports = authController;
