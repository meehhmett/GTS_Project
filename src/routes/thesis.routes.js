const express = require("express");
const router = express.Router();
const controller = require("../controllers/thesis.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");


router.get("/", controller.search);        // /api/thesis
router.get("/:no", controller.getByNo);    // /api/thesis/1000001

module.exports = router;
router.post("/", requireAuth, requireRole("admin"), controller.create);
router.put("/:no", requireAuth, requireRole("admin"), controller.update);
router.delete("/:no", requireAuth, requireRole("admin"), controller.remove);


