const jwt = require("jsonwebtoken");

exports.requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "missing bearer token" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // {sub, username, role}
        next();
    } catch {
        return res.status(401).json({ error: "invalid token" });
    }
};

exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: "unauthorized" });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "forbidden" });
        }
        next();
    };
};
