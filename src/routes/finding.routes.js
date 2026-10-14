const express = require('express');
const findingController = require('../controllers/finding.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateQuery } = validate;
const findingValidator = require('../validators/finding.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('auditor'), validate(findingValidator.create), findingController.create);
router.get('/', validateQuery(findingValidator.query), findingController.list);
router.post('/:id/comments', authorize('auditor', 'client'), validate(findingValidator.comment), findingController.addComment);
router.post('/:id/resolve', authorize('client'), findingController.resolve);
router.post('/:id/close', authorize('auditor'), findingController.close);

module.exports = router;