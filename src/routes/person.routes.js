const express = require('express');
const router = express.Router();
const controller = require('../controllers/person.controller');

router.get("/",controller.list);
router.get("/:id",controller.getById);

module.exports = router;