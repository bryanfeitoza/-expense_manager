const { Router } = require('express');
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = Router();

router.use(auth);

router.get('/summary', dashboardController.summary);
router.get('/monthly-evolution', dashboardController.monthlyEvolution);
router.get('/category-breakdown', dashboardController.categoryBreakdown);
router.get('/calendar', dashboardController.calendar);

module.exports = router;
