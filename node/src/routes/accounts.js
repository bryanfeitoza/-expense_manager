const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');
const accountController = require('../controllers/accountController');

const router = Router();

router.use(auth);

router.get('/', accountController.index);
router.get('/:id', accountController.show);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('balance').optional().isDecimal().withMessage('Balance must be decimal'),
    validate,
  ],
  accountController.create
);

router.put('/:id', accountController.update);
router.delete('/:id', accountController.destroy);

module.exports = router;
