import express from 'express';
import multer from 'multer';
import {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  approveNotice,
  createNoticeResponse,
  getNoticeResponses,
  getAllResponses,
  updateNoticeResponse,
  deleteNoticeResponse
} from '../controllers/noticesController.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// multer setup: temporary storage in uploads/
const uploadDir = path.join(process.cwd(), 'src', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const upload = multer({ storage });

// public endpoints
router.get('/', requireAuth, getNotices);
router.get('/responses/all', requireAuth, getAllResponses);
router.get('/:id/responses', requireAuth, getNoticeResponses);
router.get('/:id', requireAuth, getNotice);

// protected endpoints
router.post('/', requireAuth, upload.array('files'), createNotice);
router.post('/:id/responses', requireAuth, createNoticeResponse);
router.put('/:id', requireAuth, upload.array('files'), updateNotice);
router.put('/responses/:responseId', requireAuth, updateNoticeResponse);
router.delete('/responses/:responseId', requireAuth, deleteNoticeResponse);
router.delete('/:id', requireAuth, deleteNotice);

// admin/staff operations: approve/publish/reject/expire
// Allow both Staff and Admin to publish notices
router.post('/:id/action', requireAuth, approveNotice);

export default router;
