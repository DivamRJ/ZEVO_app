const express = require('express');
const turfController = require('../controllers/turf.controller');

const router = express.Router();

router.get('/', turfController.listTurfs);

module.exports = router;
