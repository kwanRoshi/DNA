import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createTask, getTasks, updateTaskResult, getTaskById } from '../controllers/taskController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', protect, upload.single('file'), createTask);
router.get('/', protect, getTasks);
router.get('/:taskId', protect, getTaskById);
router.patch('/:taskId/result', protect, updateTaskResult);

export default router;
