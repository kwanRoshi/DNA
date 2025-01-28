import React from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Tab, Tabs } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import TaskSystemComponent from './components/TaskSystemComponent';
import AnalysisResultComponent from './components/AnalysisResultComponent';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600
    },
    subtitle1: {
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    }
  }
});

function App() {
  const [currentTab, setCurrentTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="数据分析任务" />
            <Tab label="分析历史" />
          </Tabs>

          {currentTab === 0 && <TaskSystemComponent />}
          {currentTab === 1 && <AnalysisResultComponent />}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
