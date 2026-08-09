const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing or invalid' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Replace or match with your app's secret key
    const verified = jwt.verify(token, secret);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
