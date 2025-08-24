import jwt from "jsonwebtoken";

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
};

// Middleware to verify JWT tokens and check user roles
const authenticateRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token required",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: "error",
          message: "Invalid or expired token",
        });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          status: "error",
          message: "Insufficient permissions",
        });
      }

      req.user = user;
      next();
    });
  };
};

// Optional authentication - doesn't require token but adds user info if present
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

export { authenticateToken, authenticateRole, optionalAuth };
