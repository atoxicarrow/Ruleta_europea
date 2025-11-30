const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const gameRoutes = require('./game');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/game', gameRoutes);

module.exports = router;