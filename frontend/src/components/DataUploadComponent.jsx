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
      if (selectedFile.size > 1000000) {
        setError('File size should not exceed 1MB');
        return;
      }
      setFile(selectedFile);
      setSuccess(`File selected: ${selectedFile.name}`);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (sequence) {
      formData.append('sequence', sequence);
    }
    formData.append('provider', provider);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze sequence');
      }

      const result = await response.json();
      setSuccess('Analysis completed successfully');
      onAnalysisComplete(result);
      setSequence('');
      setFile(null);
    } catch (err) {
      setError(err.message);
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