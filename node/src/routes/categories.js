const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = Router();

router.use(auth);

router.get('/', categoryController.index);
router.get('/:id', categoryController.show);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(['receita', 'despesa']).withMessage('Type must be receita or despesa'),
    validate,
  ],
  categoryController.create
);

router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.destroy);

module.exports = router;
