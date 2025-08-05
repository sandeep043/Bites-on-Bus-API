const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
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

module.exports = authMiddleware;