const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Authentication required.' });
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid token format.' });
    }
    token = parts[1];
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized! Token is invalid or expired.' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const isAdminOrGuru = (req, res, next) => {
  if (req.userRole === 'Admin' || req.userRole === 'Guru') {
    next();
    return;
  }
  res.status(403).json({ message: 'Require Admin or Guru Role!' });
};

module.exports = {
  verifyToken,
  isAdminOrGuru,
};
