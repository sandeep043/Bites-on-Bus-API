const jwt = require('jsonwebtoken');

// Basic authentication middleware: verifies JWT and attaches user to req
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const decoded = jwt.verify(token, "mysecretkey");
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate', error: error.message });
    }
};

module.exports = authenticate;
