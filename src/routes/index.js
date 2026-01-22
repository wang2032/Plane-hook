const express = require('express');
const router = express.Router();
const planeRouter = require('./planeRouter');

// plane 模块路由
router.use('/plane', planeRouter);

module.exports = router;
