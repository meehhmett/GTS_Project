const service = require("../services/auth.service");

exports.register = async (req, res) => {
    try {
        const data = await service.register(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const data = await service.login(req.body);
        res.json(data);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};
exports.me = async (req, res) => {
    res.json({ user: req.user });
};

