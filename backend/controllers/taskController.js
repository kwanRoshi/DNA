import Task from '../models/Task.js';

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export const createTask = async (req, res) => {
  try {
    const { fileType } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供文件' });
    }

    // Create task first
    const task = await Task.create({
      userId: null,
      fileName: req.file.originalname,
      fileType,
      status: 'processing'
    });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Save file content to a temporary file
    const tempFile = path.join(uploadsDir, `datadna_${task._id}.txt`);
    await fs.writeFile(tempFile, req.file.buffer.toString('utf-8'));

    // Run Python analysis script
    const pythonScript = path.join(process.cwd(), 'analyze_dna.py');
    const pythonProcess = spawn('python3', [pythonScript, tempFile], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'app')
      }
    });

    let analysisOutput = '';
    let analysisError = '';

    pythonProcess.stdout.on('data', (data) => {
      analysisOutput += data.toString();
      console.log('Python output:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      analysisError += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on('close', async (code) => {
      try {
        if (code !== 0) {
          await Task.findByIdAndUpdate(task._id, {
            status: 'error',
            error: analysisError || '分析过程中出现错误',
            updatedAt: new Date()
          });
          return;
        }

        try {
          // Read analysis results
          const resultsPath = path.join(process.cwd(), 'analysis_results.json');
          const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));

          // Extract and validate results
          const claudeResults = results.analyses.claude || {};
          const deepseekResults = results.analyses.deepseek || {};

          // Check for analysis errors
          if (claudeResults.error || deepseekResults.error) {
            await Task.findByIdAndUpdate(task._id, {
              status: 'error',
              error: claudeResults.error || deepseekResults.error,
              updatedAt: new Date()
            });
            return;
          }

          // Combine Claude and DeepSeek results
          const combinedResults = {
            summary: claudeResults.summary || '分析完成',
            recommendations: claudeResults.recommendations || [],
            risks: claudeResults.risks || [],
            sequence_analysis: {
              gc_content: deepseekResults.gc_content || 0,
              mutations: deepseekResults.mutations || [],
              health_implications: deepseekResults.health_implications || []
            },
            sequence_length: results.sequence_length,
            timestamp: results.timestamp
          };

          // Update task with results
          await Task.findByIdAndUpdate(task._id, {
            status: 'completed',
            analysisResult: combinedResults,
            updatedAt: new Date()
          });

          console.log('Task updated successfully:', task._id);
          
          // Clean up results file
          await fs.unlink(resultsPath);
        } catch (parseError) {
          console.error('Error parsing analysis results:', parseError);
          await Task.findByIdAndUpdate(task._id, {
            status: 'error',
            error: '解析分析结果时出错',
            updatedAt: new Date()
          });
        }
      } finally {
        // Clean up temp files
        try {
          await Promise.all([
            fs.unlink(tempFile).catch(() => {}),
            fs.unlink(path.join(process.cwd(), 'analysis_results.json')).catch(() => {})
          ]);
        } catch (error) {
          console.error('Error cleaning up files:', error);
        }
      }
    });

    // Send initial response
    res.status(201).json({ success: true, data: task });

    // Process analysis in background
    pythonProcess.on('error', async (error) => {
      console.error('Python process error:', error);
      await Task.findByIdAndUpdate(task._id, {
        status: 'error',
        error: error.message,
        updatedAt: new Date()
      });
      
      // Clean up temp file on error
      await fs.unlink(tempFile).catch(() => {});
    });

  } catch (error) {
    console.error('Task creation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
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
      { _id: taskId },
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
    const task = await Task.findOne({ _id: taskId });
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务未找到' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
