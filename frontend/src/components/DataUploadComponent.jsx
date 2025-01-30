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
  const [provider, setProvider] = useState('deepseek');

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

    let sequenceData = sequence;
    
    if (file) {
      const text = await file.text();
      sequenceData = text;
    }

    if (!sequenceData) {
      setError('Please provide sequence data or upload a file');
      setIsLoading(false);
      return;
    }

    const requestData = {
      sequence: sequenceData,
      provider: provider
    };

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const requestUrl = `${API_URL}/api/analyze`;
      console.log('[REQUEST] API URL:', API_URL);
      console.log('[REQUEST] Full URL:', requestUrl);
      console.log('[REQUEST] Data:', JSON.stringify(requestData, null, 2));

      console.log('[REQUEST] Initiating fetch...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(requestUrl, {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('[RESPONSE] Status:', response.status);
      console.log('[RESPONSE] Headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('[RESPONSE] Data:', JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        console.error('[ERROR] Response not OK:', response.status);
        throw new Error(
          result.error || 
          result.detail || 
          `Failed to analyze sequence (Status: ${response.status})`
        );
      }

      if (result.success || result.analysis) {
        console.log('[SUCCESS] Processing analysis result');
        const analysis = result.analysis;
        if (!analysis) {
          console.error('[ERROR] Missing analysis data in response');
          throw new Error('Missing analysis data in response');
        }

        const summaryText = analysis.summary || '';
        const recommendations = analysis.recommendations || [];
        const riskFactors = analysis.riskFactors || [];
        const metrics = analysis.metrics || {};

        const formattedAnalysis = {
          summary: summaryText,
          recommendations: recommendations.length > 0 ? recommendations : summaryText.split('\n').filter(line => line.includes('建议') || line.includes('推荐')),
          riskFactors: riskFactors.length > 0 ? riskFactors : summaryText.split('\n').filter(line => line.includes('风险') || line.includes('警告')),
          metrics: {
            healthScore: metrics.healthScore || parseFloat(summaryText.match(/健康评分[：:]\s*(\d+)/)?.[1]),
            stressLevel: metrics.stressLevel || parseFloat(summaryText.match(/压力水平[：:]\s*(\d+)/)?.[1]),
            sleepQuality: metrics.sleepQuality || parseFloat(summaryText.match(/睡眠质量[：:]\s*(\d+)/)?.[1])
          }
        };

        const isRealAnalysis = summaryText && !summaryText.includes('Test analysis result');

        setSuccess(isRealAnalysis ? 
          'Analysis completed successfully' : 
          'Analysis completed with fallback data (AI service temporarily unavailable)'
        );

        onAnalysisComplete({
          success: true,
          analysis: formattedAnalysis
        });

        setSequence('');
        setFile(null);
        console.log('Analysis Results:', formattedAnalysis);
      } else {
        throw new Error(result.error || 'Analysis failed to complete');
      }
    } catch (error) {
      console.error('API Error:', error);
      setError(error.message);
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
            Health Data Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload a sequence file or paste your sequence below for health analysis
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel>Analysis Provider</InputLabel>
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
          Upload Sequence File
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
          inputProps={{ 'data-devinid': 'sequence-input' }}
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
          data-devinid="analyze-button"
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Analyze Sequence'
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default DataUploadComponent;                                          