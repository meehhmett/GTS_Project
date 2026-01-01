const service = require("../services/lookups.service");

exports.languages = async (req, res) => {
    try { res.json(await service.languages()); }
    catch (e) { res.status(500).json({ error: e.message }); }
};

exports.universities = async (req, res) => {
    try { res.json(await service.universities()); }
    catch (e) { res.status(500).json({ error: e.message }); }
};

exports.institutes = async (req, res) => {
    try {
        const universityId = req.query.university_id ? Number(req.query.university_id) : null;
        res.json(await service.institutes(universityId));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.topics = async (req, res) => {
    try { res.json(await service.topics()); }
    catch (e) { res.status(500).json({ error: e.message }); }
};

exports.keywords = async (req, res) => {
    try { res.json(await service.keywords()); }
    catch (e) { res.status(500).json({ error: e.message }); }
};

exports.thesisTypes = async (req, res) => {
    res.json(service.thesisTypes());
};

exports.years = async (req, res) => {
    try { res.json(await service.years()); }
    catch (e) { res.status(500).json({ error: e.message }); }
};
