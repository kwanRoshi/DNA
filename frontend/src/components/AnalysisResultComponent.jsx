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
          暂无分析结果
        </Typography>
      </Box>
    );
  }

  const sections = [
    {
      title: '健康分析摘要',
      icon: <AssessmentIcon />,
      content: analysis.summary || 'No summary available'
    },
    {
      title: '健康影响',
      icon: <HealthAndSafetyIcon />,
      content: analysis.implications || 'No health implications available'
    },
    {
      title: '建议',
      icon: <RecommendIcon />,
      content: analysis.recommendations || 'No recommendations available'
    },
    {
      title: '风险因素',
      icon: <WarningIcon />,
      content: analysis.risks || 'No risk factors identified'
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
            健康分析结果
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