const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { getUsers, toggleBan, deleteUser, getStats, getProviders, updateProvider } = require('../controllers/adminController');

const adminOnly = [auth, checkRole(['admin'])];

router.get('/users', ...adminOnly, getUsers);
router.patch('/users/:id/ban', ...adminOnly, toggleBan);
router.delete('/users/:id', ...adminOnly, deleteUser);
router.get('/stats', ...adminOnly, getStats);
router.get('/providers', ...adminOnly, getProviders);
router.patch('/providers/:id', ...adminOnly, updateProvider);

module.exports = router;
