const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/postgres/UserRepository');
const logger = require('../utils/logger');

const getUserId = (user) => user?.id ?? user?._id;

const auth = async (req, res, next) => {
  try {
    // Try to get token from HTTP-only cookies in order of priority
    const cookieNames = ['pos_token', 'store_token', 'token'];
    let token = null;
    let decoded = null;
    let tokenType = null;
    
    for (const name of cookieNames) {
      const t = req.cookies?.[name];
      if (t) {
        try {
          decoded = jwt.verify(t, process.env.JWT_SECRET);
          token = t;
          tokenType = name;
          break; // Found a valid token
        } catch (err) {
          // Token invalid or expired, try the next one
          continue;
        }
      }
    }

    if (!token) {
      // Fallback to Authorization header for backward compatibility
      const authHeader = req.header('Authorization')?.replace('Bearer ', '');
      if (authHeader) {
        try {
          decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
          token = authHeader;
          tokenType = 'header';
        } catch (err) {
          token = null;
        }
      }
    }

    if (!token || !decoded) {
      return res.status(401).json({ message: 'No valid token, authorization denied' });
    }

    // Single tenant authentication
    // Finds user in the default connected database
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const status = user.status || (user.isActive ? 'active' : 'inactive');
    if (status !== 'active') {
      return res.status(401).json({ message: 'User account is not active' });
    }

    req.user = user;
    req.userType = 'user';
    req.role = user.role;
    req.tokenType = tokenType; // Store which token was used for context-aware authorization
    return next();

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireStaff = (req, res, next) => {
  const staffRoles = ['admin', 'manager', 'cashier', 'employee', 'inventory', 'viewer', 'sales_person'];
  
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Strictly deny customers from POS-related APIs
  if (req.user.role?.toLowerCase() === 'customer') {
    return res.status(403).json({ message: 'Access denied: Customers cannot access POS system' });
  }

  // Also verify they are using a POS token if available (additional security)
  if (req.tokenType === 'store_token' && req.user.role?.toLowerCase() !== 'admin') {
     // Optional: allow admins to use storefront tokens for POS if needed, 
     // but generally staff should use pos_token
  }

  if (!staffRoles.includes(req.user.role?.toLowerCase())) {
    return res.status(403).json({ message: 'Access denied: Staff privileges required' });
  }

  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    // Check permission for admin/user
    if (!req.user || !req.user.hasPermission) {
      return res.status(403).json({
        message: 'Access denied. User model does not support permissions.'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Accepts one or more permission names; passes if the user has ANY of them
const requireAnyPermission = (permissions) => {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return (req, res, next) => {
    const allowed = list.some((p) => req.user.hasPermission(p));
    if (!allowed) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const userRole = req.user?.role?.toUpperCase() || req.role;
    if (!roleArray.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient role privileges.'
      });
    }
    next();
  };
};

/**
 * Middleware to mask sensitive fields in the response body based on user permissions.
 * @param {string} permission - The permission required to see the unmasked data
 * @param {string|string[]} fields - The field path(s) to mask (e.g., 'pricing.cost')
 */
const maskSensitiveData = (permission, fields) => {
  return (req, res, next) => {
    // If user has permission, don't mask anything
    if (req.user && req.user.hasPermission(permission)) {
      return next();
    }

    const fieldList = Array.isArray(fields) ? fields : [fields];

    // Intercept the response send method
    const originalSend = res.send;
    res.send = function (body) {
      try {
        let data = typeof body === 'string' ? JSON.parse(body) : body;

        const maskObject = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;

          if (Array.isArray(obj)) {
            return obj.map(maskObject);
          }

          fieldList.forEach(fieldPath => {
            const pathParts = fieldPath.split('.');
            let current = obj;
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (current[pathParts[i]]) {
                current = current[pathParts[i]];
              } else {
                return;
              }
            }
            
            const lastPart = pathParts[pathParts.length - 1];
            if (current[lastPart] !== undefined) {
              current[lastPart] = null; // Or delete current[lastPart];
            }
          });

          // Recursively check for nested objects/arrays (e.g. products in list)
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') {
              obj[key] = maskObject(obj[key]);
            }
          });

          return obj;
        };

        const maskedData = maskObject(data);
        return originalSend.call(this, JSON.stringify(maskedData));
      } catch (e) {
        // If parsing fails, just send original body
        return originalSend.call(this, body);
      }
    };

    next();
  };
};

module.exports = {
  auth,
  getUserId,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireStaff,
  maskSensitiveData
};
