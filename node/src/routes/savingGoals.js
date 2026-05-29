const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');
const savingGoalController = require('../controllers/savingGoalController');

const router = Router();

router.use(auth);

router.get('/', savingGoalController.index);
router.get('/:id', savingGoalController.show);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('targetAmount').isDecimal({ min: 1 }).withMessage('Target amount must be greater than zero'),
    validate,
  ],
  savingGoalController.create
);

router.put('/:id', savingGoalController.update);
router.delete('/:id', savingGoalController.destroy);

module.exports = router;
