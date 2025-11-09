import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Ensure JWT_SECRET is set in the environment
    if (!process.env.JWT_SECRET) {
      console.error('❌ Missing JWT_SECRET environment variable');
      return res.status(500).json({ error: 'Server misconfiguration: Missing JWT secret' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    // Attach user info to the request object
    req.user = { userId: user._id };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export default requireAuth;