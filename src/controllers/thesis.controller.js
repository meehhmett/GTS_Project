const service = require("../services/thesis.service");

exports.search = async (req, res) => {
    try {
        const data = await service.search(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getByNo = async (req, res) => {
    try {
        const no = Number(req.params.no);
        const data = await service.getByNo(no);
        if (!data) return res.status(404).json({ error: "not found" });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.create = async (req, res) => {
    try {
        const data = await service.create(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.update = async (req, res) => {
    try {
        const no = Number(req.params.no);
        const data = await service.update(no, req.body);
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.remove = async (req, res) => {
    try {
        const no = Number(req.params.no);
        const data = await service.remove(no);
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
