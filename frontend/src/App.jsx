import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginComponent from './components/LoginComponent';
import DataFormComponent from './components/DataFormComponent';
import AIResponseComponent from './components/AIResponseComponent';
import ImageAnalysisComponent from './components/ImageAnalysisComponent';
import ImageAnalysisHistory from './components/ImageAnalysisHistory';
import ProtectedRoute from './utils/ProtectedRoute';
import { StoreProvider, useStore, actions } from './utils/store.jsx';
import { auth } from './services/api';
import './App.css';

const AppContent = () => {
  const { state, dispatch } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await auth.getUserData();
          dispatch(actions.login(
            token,
            localStorage.getItem('walletAddress'),
            userData.user
          ));
        } catch (error) {
          console.error('认证检查失败:', error);
          dispatch(actions.logout());
        }
      }
    };

    checkAuth();
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(actions.logout());
  };

  return (
    <div className="app">
      {state.isAuthenticated && (
        <nav className="app-nav">
          <div className="nav-content">
            <span className="wallet-address">
              钱包地址: {state.walletAddress}
            </span>
            <button onClick={handleLogout} className="logout-button">
              退出登录
            </button>
          </div>
        </nav>
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            state.isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginComponent />
            )
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={state.isAuthenticated}>
              <div className="dashboard">
                <div className="dashboard-grid">
                  <div className="analysis-section">
                    <DataFormComponent />
                    <AIResponseComponent />
                  </div>
                  <div className="image-section">
                    <ImageAnalysisComponent />
                    <ImageAnalysisHistory />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
};

export default App;
