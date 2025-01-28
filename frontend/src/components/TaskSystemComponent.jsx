import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Card, CardContent, Button, Alert } from '@mui/material';
import { tasks } from '../services/api';
import DataFormComponent from './DataFormComponent';
import AnalysisResultComponent from './AnalysisResultComponent';

const TaskSystemComponent = () => {
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasks.getAll();
      setTaskList(response.data);
    } catch (err) {
      setError('加载任务列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>数据分析任务</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <DataFormComponent />
      </Box>

      <Typography variant="h5" gutterBottom>任务列表</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {taskList.map((task) => (
            <Card key={task._id}>
              <CardContent>
                <Typography variant="h6">{task.fileName}</Typography>
                <Typography color="textSecondary">
                  状态: {task.status === 'completed' ? '已完成' : '处理中'}
                </Typography>
                <Typography color="textSecondary">
                  创建时间: {new Date(task.createdAt).toLocaleString()}
                </Typography>
                
                {task.status === 'completed' && task.analysisResult && (
                  <Box sx={{ mt: 2 }}>
                    <AnalysisResultComponent result={task.analysisResult} />
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TaskSystemComponent;
