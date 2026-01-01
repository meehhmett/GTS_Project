const express = require("express");
const router = express.Router();
const controller = require("../controllers/lookups.controller");

router.get("/languages", controller.languages);
router.get("/universities", controller.universities);
router.get("/institutes", controller.institutes);
router.get("/topics", controller.topics);
router.get("/keywords", controller.keywords);
router.get("/thesis-types", controller.thesisTypes);
router.get("/years", controller.years);

module.exports = router;
