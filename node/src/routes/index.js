const { Router } = require('express');
const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');
const categoryRoutes = require('./categories');
const accountRoutes = require('./accounts');
const dashboardRoutes = require('./dashboard');
const aiRoutes = require('./ai');
const reportRoutes = require('./reports');
const savingGoalRoutes = require('./savingGoals');
const budgetRoutes = require('./budgets');

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/accounts', accountRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/ai', aiRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/saving-goals', savingGoalRoutes);
router.use('/api/budgets', budgetRoutes);

module.exports = router;
