import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // 如果用户未认证，重定向到登录页面
    return <Navigate to="/" replace />;
  }

  // 如果用户已认证，渲染子组件
  return children;
};

ProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;
