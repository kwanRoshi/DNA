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
      console.log('API URL:', API_URL);
      console.log('Request URL:', requestUrl);
      console.log('Request data:', requestData);

      const response = await fetch(requestUrl, {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Analysis Result:', result);
      
      if (!response.ok) {
        throw new Error(result.error || result.detail || 'Failed to analyze sequence');
      }

      if (result.success) {
        const analysis = result.analysis;
        if (!analysis) {
          throw new Error('Missing analysis data in response');
        }

        // Format the analysis data for display
        const formattedAnalysis = {
          summary: analysis.summary || 'No summary available',
          recommendations: analysis.recommendations || [],
          riskFactors: analysis.riskFactors || [],
          metrics: analysis.metrics || {}
        };

        // Only show fallback message if we detect mock data
        const isRealAnalysis = !analysis.summary?.includes('Test analysis result') && 
                             analysis.recommendations?.length > 0 &&
                             analysis.recommendations[0] !== 'Based on DeepSeek analysis';

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