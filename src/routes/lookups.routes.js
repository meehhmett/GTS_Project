const router = require("express").Router();
const service = require("../services/lookups.service");
const {requireAuth, requireRole} = require("../middlewares/auth");

router.get("/years", async (req, res) => {
    res.json(await service.years());
});
router.get("/thesis-types", async (req, res) => {
    res.json(await service.types());
});
router.get("/languages", async (req, res) => {
    res.json(await service.languages());
});
router.get("/universities", async (req, res) => {
    res.json(await service.universities());
});
router.get("/institutes", async (req, res) => {
    res.json(await service.institutes());
});
router.get("/persons", async (req, res) => {
    res.json(await service.persons());
});
router.get("/topics", async (req, res) => {
    res.json(await service.topics());
});
router.get("/keywords", async (req, res) => {
    res.json(await service.keywords());
});
//admin panel icin
router.post("/persons", requireAuth, requireRole("admin"), async (req, res) => {
    const row = await service.createPerson(req.body);
    res.status(201).json(row);
});
router.post("/keywords", requireAuth, requireRole("admin"), async (req, res) => {
    const row = await service.createKeyword(req.body);
    res.status(201).json(row);
});
router.post("/topics", requireAuth, requireRole("admin"), async (req, res) => {
    const row = await service.createTopic(req.body);
    res.status(201).json(row);
});

module.exports = router;
