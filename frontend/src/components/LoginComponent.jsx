import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { useStore, actions } from '../utils/store.jsx';
import okxService from '../services/okxService';
import './LoginComponent.css';

const LoginComponent = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useStore();

  // 连接OKX钱包
  const connectWallet = async () => {
    try {
      setError('');
      setIsLoading(true);

      // 请求OKX钱包连接
      const walletData = await okxService.requestWalletConnection();
      const walletAddress = walletData.address;

      // 创建签名消息
      const message = `登录DNA数据分析平台\n\n时间戳: ${Date.now()}`;
      
      // 请求OKX钱包签名
      const signatureData = await okxService.signMessage(message, walletAddress);
      const signature = signatureData.signature;

      // 调用后端API进行登录验证
      const response = await auth.login({
        walletAddress,
        signature,
        message,
        walletType: 'okx'
      });
      
      // 获取用户数据
      const userData = await auth.getUserData();
      
      // 更新全局状态
      dispatch(actions.login(
        response.token,
        walletAddress,
        userData.user
      ));

      navigate('/dashboard');
    } catch (err) {
      console.error('登录失败:', err);
      if (err.code === 4001) {
        setError('用户拒绝了连接请求');
      } else {
        setError(err.message || '登录失败，请重试');
      }
      
      // 清理任何可能存在的无效认证状态
      dispatch(actions.logout());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>DNA数据分析平台</h2>
        <div className="wallet-connect">
          {
            <>
              <button 
                onClick={connectWallet} 
                className="button connect-button" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading"></span>
                    <span>连接中...</span>
                  </>
                ) : (
                  '使用OKX钱包登录'
                )}
              </button>
              {error && <div className="error">{error}</div>}
            </>
          )}
        </div>
        <div className="login-footer">
          <p>使用OKX钱包安全登录，您的私钥永远不会离开您的设备</p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
