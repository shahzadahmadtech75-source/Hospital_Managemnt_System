/**
 * Role-based authorization middleware factory
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


