const User = require('../models/User');
const logger = require('../utils/logger');

// Sprawdzanie uprawnień
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // req.user został już załadowany przez middleware authenticateToken
      const user = req.user;

      if (!user || !user.role) {
        logger.warn(`Access denied - no role assigned for user: ${user ? user._id : 'unknown'}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied - no role assigned'
        });
      }

      // Sprawdzanie, czy użytkownik ma wymagane uprawnienie lub uprawnienie administratora
      if (user.role.permissions.includes(permission) || 
          user.role.permissions.includes('admin:all')) {
        next();
      } else {
        logger.warn(`Access denied - missing permission: ${permission} for user: ${user._id}`);
        return res.status(403).json({
          success: false,
          message: `Access denied - missing permission: ${permission}`
        });
      }
    } catch (error) {
      logger.error(`RBAC error: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Sprawdzanie ról
const hasRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role.name;

    if (Array.isArray(roles)) {
      if (roles.includes(userRole)) {
        next();
      } else {
        logger.warn(`Access denied - insufficient role: ${userRole}, required one of: ${roles.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied - insufficient role'
        });
      }
    } else {
      if (userRole === roles) {
        next();
      } else {
        logger.warn(`Access denied - insufficient role: ${userRole}, required: ${roles}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied - insufficient role'
        });
      }
    }
  };
};

// Middleware do weryfikacji właściciela zasobu
const isResourceOwner = (modelName, idParam = 'id', ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resourceId = req.params[idParam];

      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admin ma dostęp do wszystkich zasobów
      if (req.user.role.permissions.includes('admin:all')) {
        return next();
      }

      // Sprawdź czy użytkownik jest właścicielem zasobu
      if (resource[ownerField] && 
          resource[ownerField].toString() === req.user._id.toString()) {
        return next();
      }

      logger.warn(`Resource ownership check failed for ${modelName}:${resourceId}, user: ${req.user._id}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not the owner of this resource'
      });
    } catch (error) {
      logger.error(`Resource ownership check error: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = {
  hasPermission,
  hasRole,
  isResourceOwner
};
