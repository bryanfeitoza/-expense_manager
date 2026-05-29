const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

const router = Router();

router.use(authMiddleware);

router.get('/', budgetController.index);
router.get('/:id', budgetController.show);
router.post('/', [
  body('limitAmount').isFloat({ min: 0.01 }).withMessage('Limit must be greater than zero'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Invalid year'),
], budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.destroy);

module.exports = router;
