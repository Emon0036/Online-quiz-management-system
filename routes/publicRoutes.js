const express = require('express');
const publicController = require('../controllers/publicController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(publicController.home));
router.get('/home', asyncHandler(publicController.home));
router.get('/about', publicController.about);

module.exports = router;
