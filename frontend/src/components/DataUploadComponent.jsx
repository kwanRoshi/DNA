import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

const DataUploadComponent = ({ onAnalysisComplete }) => {
  const [sequence, setSequence] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [provider, setProvider] = useState('claude');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['.txt', '.fasta', '.fa', '.seq'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('不支持的文件类型');
        return;
      }
      
      if (selectedFile.size > 1000000) {
        setError('文件大小不能超过1MB');
        return;
      }
      
      setFile(selectedFile);
      setSuccess(`已选择文件: ${selectedFile.name}`);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sequence) {
      setError('请输入DNA序列');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('Sending request to:', apiUrl, {
        sequence: sequence,
        provider: provider.toLowerCase()
      });
      
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sequence: sequence,
          provider: provider.toLowerCase()
        })
      });

      console.log('Response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || '分析失败，请重试');
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      setSuccess('分析完成');
      onAnalysisComplete(result);
      setSequence('');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || '请求失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        maxWidth: 800, 
        mx: 'auto', 
        mt: 4,
        backgroundColor: 'background.paper'
      }}
    >
      <Stack spacing={3}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <HealthAndSafetyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            健康数据分析
          </Typography>
          <Typography variant="body1" color="text.secondary">
            上传序列文件或在下方粘贴您的序列进行健康分析
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel>分析提供者</InputLabel>
          <Select
            value={provider}
            label="Analysis Provider"
            onChange={(e) => setProvider(e.target.value)}
          >
            <MenuItem value="claude">Claude</MenuItem>
            <MenuItem value="deepseek">DeepSeek</MenuItem>
          </Select>
        </FormControl>

        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ mt: 2 }}
        >
          上传序列文件
          <input
            type="file"
            hidden
            accept=".txt,.fasta,.fa,.seq"
            onChange={handleFileChange}
          />
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          or
        </Typography>

        <TextField
          multiline
          rows={4}
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder="Paste your sequence here..."
          variant="outlined"
          fullWidth
        />

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error">{error}</Alert>
          </Fade>
        )}

        {success && (
          <Fade in={Boolean(success)}>
            <Alert severity="success">{success}</Alert>
          </Fade>
        )}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || (!sequence && !file)}
          sx={{ 
            mt: 2,
            height: 48,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            '开始分析'
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default DataUploadComponent;                