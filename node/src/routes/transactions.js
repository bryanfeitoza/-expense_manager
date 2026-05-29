const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

const router = Router();

router.use(auth);

router.get('/', transactionController.index);
router.get('/:id', transactionController.show);

router.post(
  '/',
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isDecimal({ min: 0.01 }).withMessage('Amount must be a positive decimal'),
    body('type').isIn(['receita', 'despesa']).withMessage('Type must be receita or despesa'),
    body('transactionDate').optional().isDate().withMessage('Invalid date'),
    validate,
  ],
  transactionController.create
);

router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.destroy);

module.exports = router;
