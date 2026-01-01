const express = require("express");
const router = express.Router();
const controller = require("../controllers/thesis.controller");

router.get("/", controller.search);        // /api/thesis
router.get("/:no", controller.getByNo);    // /api/thesis/1000001

module.exports = router;
router.post("/", controller.create);
router.put("/:no", controller.update);
router.delete("/:no", controller.remove);

