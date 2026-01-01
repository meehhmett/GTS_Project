const express = require("express");
const router = express.Router();
const controller = require("../controllers/test.controller");

router.get("/db-test", controller.testDb);

module.exports = router;
