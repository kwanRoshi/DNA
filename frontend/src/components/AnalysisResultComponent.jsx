import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RecommendIcon from '@mui/icons-material/Recommend';
import WarningIcon from '@mui/icons-material/Warning';

const AnalysisResultComponent = ({ analysis }) => {
  if (!analysis) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '200px'
        }}
      >
        <Typography color="text.secondary">
          No analysis results to display
        </Typography>
      </Box>
    );
  }

  const sections = [
    {
      title: 'Health Analysis Summary',
      icon: <AssessmentIcon />,
      content: analysis.summary || 'No summary available'
    },
    {
      title: 'Risk Factors',
      icon: <WarningIcon />,
      content: Array.isArray(analysis.riskFactors) && analysis.riskFactors.length > 0
        ? analysis.riskFactors.map((risk, i) => `${i + 1}. ${risk}`).join('\n')
        : analysis.summary?.includes('### Risk Factors')
          ? analysis.summary.split('### Risk Factors')[1].split('###')[0].trim()
          : 'No risk factors identified'
    },
    {
      title: 'Recommendations',
      icon: <RecommendIcon />,
      content: Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0
        ? analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
        : analysis.summary?.includes('### Recommendations')
          ? analysis.summary.split('### Recommendations')[1].split('###')[0].trim()
          : 'No recommendations available'
    },
    {
      title: 'Health Metrics',
      icon: <HealthAndSafetyIcon />,
      content: analysis.metrics && Object.values(analysis.metrics).some(v => v !== null)
        ? [
            `Health Score: ${analysis.metrics.healthScore || 'N/A'}`,
            `Stress Level: ${analysis.metrics.stressLevel || 'N/A'}`,
            `Sleep Quality: ${analysis.metrics.sleepQuality || 'N/A'}`
          ].join('\n')
        : analysis.summary?.includes('生理指标')
          ? analysis.summary.split('生理指标')[1].split('---')[0].trim()
          : 'No health metrics available'
    }
  ];

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        maxWidth: 800,
        mx: 'auto',
        mt: 4,
        backgroundColor: 'background.paper'
      }}
    >
      <Stack spacing={3}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <HealthAndSafetyIcon 
            sx={{ 
              fontSize: 40, 
              color: 'primary.main',
              mb: 2 
            }} 
          />
          <Typography variant="h5" component="h2" gutterBottom>
            Health Analysis Results
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        {sections.map((section, index) => (
          <Accordion 
            key={index}
            defaultExpanded={index === 0}
            sx={{
              backgroundColor: 'background.default',
              '&:before': {
                display: 'none',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'background.paper',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {section.icon}
                <Typography variant="subtitle1">
                  {section.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography 
                variant="body1" 
                component="div" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  color: 'text.primary' 
                }}
              >
                {section.content}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Paper>
  );
};

export default AnalysisResultComponent;      