import Task from '../models/Task.js';
import { protect } from '../middleware/authMiddleware.js';

export const createTask = async (req, res) => {
  try {
    const { fileType } = req.body;
    const task = await Task.create({
      userId: req.user._id,
      fileName: req.file?.originalname || req.body.fileName,
      fileType,
      status: 'pending'
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateTaskResult = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { analysisResult } = req.body;
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.user._id },
      { 
        analysisResult,
        status: 'completed',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务未找到' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, userId: req.user._id });
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务未找到' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
