const { Router } = require('express');
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = Router();

router.use(auth);

router.post('/classify', aiController.classify);
router.post('/analyze', aiController.analyzeSpending);
router.get('/anomalies', aiController.detectAnomalies);
router.get('/predict', aiController.predictBudget);
router.get('/tips', aiController.tips);
router.post('/chat', aiController.chat);

module.exports = router;
