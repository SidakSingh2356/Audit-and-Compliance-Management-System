const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

const authService = {
  async login(email, password) {
    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError('User account is inactive', 401, 'USER_INACTIVE');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    // Return user data without password hash
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      fullName: user.full_name,
    };

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Fetch user to ensure they still exist and are active
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.is_active) {
        throw new ApiError('User not found or inactive', 401, 'USER_NOT_FOUND');
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
      );

      return { accessToken: newAccessToken };
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err.name === 'TokenExpiredError') {
        throw new ApiError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  },

  async logout(userId) {
    // In a production system, you'd invalidate the refresh token
    // For now, logout is handled on the client side (token deletion)
    return { message: 'Logged out successfully' };
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If email exists, a reset link has been sent' };
    }

    // Generate password reset token (short-lived)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // In production, send email with reset link
    // For now, return token (should be sent via email in real app)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      message: 'Password reset link sent to email',
      resetToken, // Remove this in production - send via email instead
    };
  },

  async resetPassword(resetToken, newPassword) {
    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET);

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      const user = await userRepository.updatePassword(decoded.id, hashedPassword);
      if (!user) {
        throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      return { message: 'Password reset successfully', user };
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err.name === 'TokenExpiredError') {
        throw new ApiError('Reset token expired', 401, 'RESET_TOKEN_EXPIRED');
      }
      throw new ApiError('Invalid reset token', 401, 'INVALID_RESET_TOKEN');
    }
  },
};

module.exports = authService;
