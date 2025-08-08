// Usage: roleMiddleware('owner'), roleMiddleware(['user', 'agent'])
const roleMiddleware = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (roles.length > 0) {
            if (!req.user.role || !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Forbidden: Insufficient role' });
            }
        }
        next();
    };
};

module.exports = roleMiddleware;