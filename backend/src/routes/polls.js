import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { createPoll, getPolls, getPoll, votePoll, getPollResults, updatePoll, updatePollStatus, deletePoll } from '../controllers/pollsController.js';

const router = express.Router();

router.get('/', requireAuth, getPolls);
router.get('/:id/results', requireAuth, getPollResults);
router.get('/:id', requireAuth, getPoll);
router.post('/', requireAuth, createPoll);
router.post('/:id/vote', requireAuth, votePoll);
router.put('/:id', requireAuth, updatePoll);
router.delete('/:id', requireAuth, deletePoll);
router.post('/:id/action', requireAuth, requireAdmin, updatePollStatus);

export default router;
