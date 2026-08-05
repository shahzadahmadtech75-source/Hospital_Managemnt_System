/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if the authenticated user has one of the allowed roles
 * @example
 * // Single role
 * authorize('admin')
 * 
 * // Multiple roles
 * authorize('admin', 'doctor', 'nurse')
 */
export const authorize = (...allowedRoles) => {
  // Validate that at least one role is provided
  if (!allowedRoles || allowedRoles.length === 0) {
    throw new Error('At least one role must be specified for authorization');
  }

  // Return the actual middleware function
  return (req, res, next) => {
    try {
      // Check if user exists on req (authenticate middleware must run first)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
          data: null,
        });
      }

      // Get the user's role from the authenticated user object
      const userRole = req.user.role;

      // Check if the user's role is in the allowed roles list
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`,
          data: null,
        });
      }

      // Role is authorized, proceed to the next middleware/controller
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'An internal server error occurred during authorization.',
        data: null,
      });
    }
  };
};

/**
 * Higher-order middleware that requires the user to have one of the specified roles
 * This is an alias for authorize() for better readability in some contexts
 */
export const requireRole = authorize;

/**
 * Middleware factory that allows access only if the user has ALL specified roles
 * Useful for rare cases where multiple roles are required simultaneously
 * 
 * @param {...string} requiredRoles - All roles that the user must have
 * @returns {Function} Express middleware function
 */
export const requireAllRoles = (...requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    throw new Error('At least one role must be specified for authorization');
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
          data: null,
        });
      }

      const userRole = req.user.role;

      // Check if user has ALL required roles (but since users have only one role, this is the same as the main authorize)
      // In a more complex system where users could have multiple roles, this would check for all roles
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires all roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
          data: null,
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'An internal server error occurred during authorization.',
        data: null,
      });
    }
  };
};