const userRepository = require('../repositories/postgres/UserRepository');
const jwt = require('jsonwebtoken');
const ipaddr = require('ipaddr.js');
const logger = require('../utils/logger');
const { sendTwoFactorCodeEmail } = require('../utils/emailService');
const { sendTwoFactorCodeSms } = require('../utils/smsService');

class AuthService {
  createAccessToken(user) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      throw new Error('Server configuration error: JWT_SECRET is missing');
    }
    const payload = {
      userId: user.id || user._id,
      email: user.email,
      role: user.role
    };
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  createRefreshToken(user) {
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.trim() === '') {
      // Fallback to JWT_SECRET if REFRESH_SECRET is not set, but it's better to have a separate one
      process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';
    }
    const payload = {
      userId: user.id || user._id,
      type: 'refresh'
    };
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });
  }

  /**
   * Legacy method kept for compatibility
   */
  createAuthToken(user) {
    return this.createAccessToken(user);
  }

  /**
   * Refresh an expired (or valid) JWT. Decodes without expiration check,
   * verifies the user still exists and is active, then issues a new token.
   * Returns null if the token is structurally invalid or the user is gone/inactive.
   */
  async verifyRefreshToken(token) {
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.trim() === '') {
      process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      if (decoded.type !== 'refresh' || !decoded.userId) return null;

      const user = await userRepository.findById(decoded.userId);
      if (!user) return null;

      const status = user.status || (user.isActive ? 'active' : 'inactive');
      if (status !== 'active') return null;

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh an expired (or valid) JWT. Legacy method.
   */
  async refreshToken(token) {
    const user = await this.verifyRefreshToken(token);
    if (!user) {
      // Fallback to legacy behavior if the token is an access token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        if (decoded?.userId) {
          const u = await userRepository.findById(decoded.userId);
          if (u && (u.status === 'active' || u.isActive)) {
            return { token: this.createAccessToken(u), user: u };
          }
        }
      } catch { }
      return null;
    }

    const newToken = this.createAccessToken(user);
    const newRefreshToken = this.createRefreshToken(user);
    return { token: newToken, refreshToken: newRefreshToken, user };
  }

  createTwoFactorChallengeToken(userId) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      throw new Error('Server configuration error: JWT_SECRET is missing');
    }
    return jwt.sign({ userId, type: '2fa_challenge' }, process.env.JWT_SECRET, { expiresIn: '10m' });
  }

  createTwoFactorCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Generate OTP, deliver it by channel, return temp JWT for /verify-2fa.
   */
  async createAndDeliverTwoFactorChallenge(user, ipAddress, userAgent, deliveryChannel = 'email') {
    const otpCode = this.createTwoFactorCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await userRepository.setTwoFactorCode(user.id, otpCode, expiresAt);
    let delivered = false;

    try {
      if (deliveryChannel === 'sms') {
        await sendTwoFactorCodeSms({
          toPhone: user.phone,
          code: otpCode
        });
      } else {
        await sendTwoFactorCodeEmail({
          toEmail: user.email,
          code: otpCode
        });
      }
      delivered = true;
    } catch (deliveryError) {
      logger.error(`2FA ${deliveryChannel} delivery failed for user ${user.id}: ${deliveryError.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Unable to deliver two-factor code. Please contact administrator.');
      }
      logger.warn(`2FA dev fallback code for user ${user.id}: ${otpCode}`);
    }

    const challengeToken = this.createTwoFactorChallengeToken(user.id);

    logger.info('2FA challenge created', {
      userId: user.id,
      channel: deliveryChannel,
      destination: deliveryChannel === 'sms' ? user.phone : user.email,
      ipAddress,
      userAgent
    });

    return {
      twoFactorRequired: true,
      tempToken: challengeToken,
      message: delivered
        ? `Two-factor authentication code sent to your ${deliveryChannel === 'sms' ? 'mobile number' : 'email'}`
        : 'Two-factor authentication code required (development fallback active)'
    };
  }

  /**
   * Send a 2FA code to a registered email/mobile (no password). User must have 2FA enabled.
   */
  async requestTwoFactorCode(payload, ipAddress, userAgent) {
    const channel = payload?.channel === 'sms' ? 'sms' : 'email';
    const email = String(payload?.email || '').trim();
    const phone = String(payload?.phone || '').trim();

    if (channel === 'sms' && !phone) throw new Error('Mobile number is required');
    if (channel === 'email' && !email) throw new Error('Email is required');

    const user = channel === 'sms'
      ? await userRepository.findByPhone(phone)
      : await userRepository.findByEmail(email);
    if (!user) {
      throw new Error(
        channel === 'sms'
          ? 'No account found with this mobile number'
          : 'No account found with this email address'
      );
    }

    if (channel === 'sms' && !user.phone) {
      throw new Error('No mobile number is saved for this account');
    }

    if (!user.isActive) {
      throw new Error('This account is inactive');
    }

    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    if (!user?.preferences?.twoFactorEnabled) {
      throw new Error(
        'Two-factor is not enabled for this account. Enable it in Settings after signing in with email and password, or use the Email & password tab.'
      );
    }

    return this.createAndDeliverTwoFactorChallenge(user, ipAddress, userAgent, channel);
  }

  /**
   * Register a new user
   * @param {object} userData - User data
   * @param {User} createdBy - User creating the account
   * @returns {Promise<{user: User, message: string}>}
   */
  async register(userData, createdBy) {
    const { firstName, lastName, email, password, role, phone, department, permissions, status } = userData;

    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await userRepository.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      department,
      permissions: permissions || [],
      status: status || 'active'
    });

    // Track permission change
    if (createdBy) {
      await userRepository.trackPermissionChange(
        user.id,
        createdBy,
        'created',
        {},
        { role: user.role, permissions: user.permissions },
        'User account created'
      );
    }

    const safeUser = user.toSafeObject();
    await this._attachCustomerData(safeUser);

    return {
      user: safeUser,
      message: 'User created successfully'
    };
  }

  /**
   * Login user by identifier (email or phone)
   * @param {string} identifier - User email or phone
   * @param {string} password - User password
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<{user: User, token: string, message: string}>}
   */
  async login(identifier, password, ipAddress, userAgent) {
    if (!identifier) {
      throw new Error('Email or phone number is required');
    }

    // Find user with password
    let user = null;

    // Check if identifier is email
    if (identifier.includes('@')) {
      user = await userRepository.findByEmailWithPassword(identifier);
    } else {
      // Try phone
      user = await userRepository.findByPhone(identifier, { includePassword: true });

      // Fallback to email if phone search returns nothing (some users might use phone-like emails)
      if (!user) {
        user = await userRepository.findByEmailWithPassword(identifier);
      }
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await userRepository.incrementLoginAttempts(user.id);
      throw new Error('Invalid credentials');
    }


    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await userRepository.resetLoginAttempts(user.id);
    }

    // Track login activity
    await userRepository.trackLogin(user.id, ipAddress, userAgent);

    const token = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);

    const safeUser = user.toSafeObject();
    await this._attachCustomerData(safeUser);

    return {
      user: safeUser,
      token,
      refreshToken,
      message: 'Login successful'
    };
  }

  /**
   * Specialized login for POS (Staff only)
   */
  async loginPOS(identifier, password, ipAddress, userAgent) {
    const result = await this.login(identifier, password, ipAddress, userAgent);
    const user = result.user;

    const staffRoles = ['admin', 'manager', 'cashier', 'employee', 'inventory', 'viewer', 'sales_person'];
    
    // Strictly forbid customers from logging into the POS
    if (user.role?.toLowerCase() === 'customer') {
      throw new Error('Access denied: Customers cannot login to the POS system.');
    }

    if (!staffRoles.includes(user.role?.toLowerCase())) {
      throw new Error('Access denied: Unauthorized role for POS system. Only staff/admin can login here.');
    }

    return result;
  }

  /**
   * Specialized login for Storefront (Customers and shopping staff)
   */
  async loginCustomer(identifier, password, ipAddress, userAgent) {
    try {
      const result = await this.login(identifier, password, ipAddress, userAgent);
      
      // Optional: If we want to strictly ONLY allow customers in storefront
      // if (result.user.role?.toLowerCase() !== 'customer') {
      //   throw new Error('Access denied: Please use the staff portal.');
      // }
      
      return result;
    } catch (error) {
      if (error.message === 'Invalid credentials' || error.message.includes('No account found')) {
        // Try to find in customers table and auto-provision user if they exist there
        const customerRepository = require('../repositories/postgres/CustomerRepository');
        const customer = await customerRepository.findByPhone(identifier) || await customerRepository.findByEmail(identifier);

        if (customer) {
          // Auto-create user record for this existing customer
          const newUser = await userRepository.create({
            firstName: customer.name?.split(' ')[0] || 'Customer',
            lastName: customer.name?.split(' ').slice(1).join(' ') || (customer.business_name || 'Account'),
            email: customer.email || `${customer.phone}@pos-customer.com`,
            phone: customer.phone,
            password: 'VIRTUAL_PASSWORD_MANAGED_BY_ENV', // Dummy password, will be bypassed by virtual auth logic
            role: 'customer',
            status: 'active'
          });

          // Retry login after auto-provisioning
          return await this.login(identifier, password, ipAddress, userAgent);
        }
      }
      throw error;
    }
  }

  async verifyTwoFactor(tempToken, code, ipAddress, userAgent) {
    if (!tempToken || !code) {
      throw new Error('Two-factor token and code are required');
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired two-factor token');
    }

    if (payload?.type !== '2fa_challenge' || !payload?.userId) {
      throw new Error('Invalid two-factor challenge');
    }

    const user = await userRepository.findByIdWithPassword(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidCode = userRepository.verifyTwoFactorCode(user, code);
    if (!isValidCode) {
      throw new Error('Invalid or expired two-factor code');
    }

    await userRepository.clearTwoFactorCode(user.id);
    await userRepository.trackLogin(user.id, ipAddress, userAgent);
    const token = this.createAuthToken(user);

    return {
      user: user.toSafeObject(),
      token,
      message: 'Login successful'
    };
  }

  /**
   * Get current user
   * @param {string} userId - User ID
   * @returns {Promise<User>}
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const safeUser = user.toSafeObject();
    await this._attachCustomerData(safeUser);
    return safeUser;
  }

  /**
   * Update user profile (firstName, lastName, email, phone). Password must be changed via changePassword().
   * @param {string} userId - User ID
   * @param {object} updateData - Data to update
   * @returns {Promise<{user: User, message: string}>}
   */
  async updateProfile(userId, updateData) {
    const { firstName, lastName, email, phone } = updateData;

    const emailVal = email !== undefined && email !== null ? String(email).trim() : '';
    if (emailVal) {
      const taken = await userRepository.emailExists(emailVal, userId);
      if (taken) {
        throw new Error('Email already exists');
      }
    }

    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (emailVal) updateFields.email = emailVal.toLowerCase();
    if (phone !== undefined) updateFields.phone = phone;

    const user = await userRepository.updateProfile(userId, updateFields);
    if (!user) {
      throw new Error('User not found');
    }

    // Sync back to Customer record if this is a customer
    if (user.role === 'customer') {
      try {
        const customerRepository = require('../repositories/postgres/CustomerRepository');
        const customer = await customerRepository.findByPhone(user.phone);
        if (customer) {
          const customerUpdate = {};
          if (updateData.businessName) customerUpdate.business_name = updateData.businessName;

          // Merge address fields (handle array format)
          let addresses = Array.isArray(customer.address) ? [...customer.address] : [customer.address];
          let primaryIndex = addresses.findIndex(a => a && a.isDefault);
          if (primaryIndex === -1) primaryIndex = 0;

          if (!addresses[primaryIndex] || typeof addresses[primaryIndex] !== 'object') {
            addresses[primaryIndex] = { isDefault: true };
          }

          if (updateData.address) addresses[primaryIndex].street = updateData.address;
          if (updateData.city) addresses[primaryIndex].city = updateData.city;

          customerUpdate.address = addresses;

          if (Object.keys(customerUpdate).length > 0) {
            await customerRepository.update(customer.id, customerUpdate);
          }
        }
      } catch (syncError) {
        console.error('Error syncing profile update to customer record:', syncError);
      }
    }

    const safeUser = user.toSafeObject();
    await this._attachCustomerData(safeUser);

    return {
      user: safeUser,
      message: 'Profile updated successfully'
    };
  }

  /**
   * Helper to merge customer-specific data (address, city, business name) 
   * from the customers table into the user object.
   */
  async _attachCustomerData(safeUser) {
    if (!safeUser || safeUser.role !== 'customer') return safeUser;

    try {
      const customerRepository = require('../repositories/postgres/CustomerRepository');
      const customer = await customerRepository.findByPhone(safeUser.phone);
      if (customer) {
        // Map customer fields to user object for storefront display
        safeUser.businessName = customer.business_name || '';
        safeUser.name = customer.name || safeUser.name;
        safeUser.username = customer.phone; // Use phone as username for customers

        // Handle address fields (customers table stores address as an array of objects)
        const addresses = Array.isArray(customer.address) ? customer.address : [customer.address];
        const primaryAddress = addresses.find(a => a && a.isDefault) || addresses[0];

        if (primaryAddress && typeof primaryAddress === 'object') {
          safeUser.city = primaryAddress.city || '';
          safeUser.address = primaryAddress.street || primaryAddress.address || '';
        } else if (typeof customer.address === 'string') {
          safeUser.address = customer.address;
        }
      }
    } catch (err) {
      console.error('Error attaching customer data to user:', err);
    }
    return safeUser;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    await userRepository.updatePassword(userId, newPassword);

    return {
      message: 'Password changed successfully'
    };
  }
}

module.exports = new AuthService();

