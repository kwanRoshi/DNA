import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { auth } from '../services/api';
import { useStore, actions } from '../utils/store.jsx';
import './LoginComponent.css';

const LoginComponent = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useStore();

  // 检查MetaMask是否安装
  useEffect(() => {
    const checkMetaMask = async () => {
      const { ethereum } = window;
      setHasMetaMask(!!ethereum && ethereum.isMetaMask);
    };
    checkMetaMask();
  }, []);

  // 连接MetaMask钱包
  const connectWallet = async () => {
    try {
      setError('');
      setIsLoading(true);

      // 请求用户连接钱包
      const { ethereum } = window;
      if (!ethereum) {
        throw new Error('请先安装MetaMask钱包');
      }

      // 请求账户连接
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      // 创建签名消息
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const message = `登录DNA数据分析平台\n\n时间戳: ${Date.now()}`;
      
      // 请求用户签名
      const signature = await signer.signMessage(message);

      // 调用后端API进行登录验证
      const response = await auth.login({
        walletAddress,
        signature,
        message
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
          {!hasMetaMask ? (
            <div className="metamask-notice">
              <p>请先安装MetaMask钱包</p>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="button install-button"
              >
                安装MetaMask
              </a>
            </div>
          ) : (
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
                  '连接MetaMask钱包'
                )}
              </button>
              {error && <div className="error">{error}</div>}
            </>
          )}
        </div>
        <div className="login-footer">
          <p>使用MetaMask钱包安全登录，您的私钥永远不会离开您的设备</p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
