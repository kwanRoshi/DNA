import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useStore from './store';

const ProtectedRoute = ({ children }) => {
  const { token } = useStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;
