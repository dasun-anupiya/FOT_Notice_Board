import express from 'express';
import {
    getUsersByType,
    getRecentUsers,
    getInactiveUsers,
    getNoticeStats,
    getActiveNotices,
    getNoticesByCreator,
    getEngagementStats,
    getPollReport,
    getSystemSummary
} from '../controllers/reportsController.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Middleware to protect all report routes
router.use(requireAuth);
// Add requireAdmin if distinct middleware exists, otherwise assume logic in controller or shared middleware
// Based on typical setup, requireAuth might just check token. 
// Ideally we should have a requireAdmin middleware.
// For now, I'll assume requireAuth populates req.user, and I'll add a quick inline check or reuse if available.

// Inline admin check helper
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.userType === 'Admin' || req.user.usertype === 'Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

router.use(isAdmin);

router.get('/users/by-type', getUsersByType);
router.get('/users/recent', getRecentUsers);
router.get('/users/inactive', getInactiveUsers);

router.get('/notices/stats', getNoticeStats);
router.get('/notices/active', getActiveNotices);
router.get('/notices/by-creator', getNoticesByCreator);
router.get('/notices/engagement', getEngagementStats);

router.get('/polls/report', getPollReport);

router.get('/system/summary', getSystemSummary);

export default router;
