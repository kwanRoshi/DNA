import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, actions } from '../utils/store';
import './LoginComponent.css';

const LoginComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { dispatch } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For now, we'll just simulate a successful login
      setTimeout(() => {
        dispatch(actions.login(
          'dummy-token',
          'guest-user',
          { name: 'Guest User' }
        ));
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome to DNA Analysis</h2>
        <p>Please log in to continue</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Continue as Guest'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginComponent;
