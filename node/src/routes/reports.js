const { Router } = require('express');
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = Router();

router.use(auth);

router.get('/by-category', reportController.byCategory);
router.get('/monthly', reportController.monthly);
router.get('/export/csv', reportController.exportCSV);
router.get('/export/pdf', reportController.exportPDF);

module.exports = router;
