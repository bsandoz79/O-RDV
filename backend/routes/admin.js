const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { getUsers, toggleBan, deleteUser, getStats, getProviders, updateProvider, getUserAppointments, getProviderAppointments, impersonate } = require('../controllers/adminController');
const { validateToggleBan, validateUpdateProvider } = require('../middlewares/validate');

const adminOnly = [auth, checkRole(['admin'])];

router.get('/users',                        ...adminOnly, getUsers);
router.patch('/users/:id/ban',              ...adminOnly, validateToggleBan,      toggleBan);
router.delete('/users/:id',                 ...adminOnly, deleteUser);
router.get('/stats',                        ...adminOnly, getStats);
router.get('/providers',                    ...adminOnly, getProviders);
router.patch('/providers/:id',              ...adminOnly, validateUpdateProvider, updateProvider);
router.get('/users/:id/appointments',       ...adminOnly, getUserAppointments);
router.get('/providers/:id/appointments',   ...adminOnly, getProviderAppointments);
router.post('/impersonate/:userId',         ...adminOnly, impersonate);

module.exports = router;
