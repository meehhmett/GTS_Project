const service = require("../services/person.service");

exports.list = async (req, res) => {
    try {
        const data = await service.list(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const data = await service.getById(id);
        if (!data) return res.status(404).json({ error: "not found" });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
