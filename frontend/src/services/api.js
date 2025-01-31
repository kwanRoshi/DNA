import axios from 'axios';

const API_URL = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')
  ? 'http://localhost:8000'
  : (import.meta?.env?.VITE_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// 重试配置
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // 处理网络错误
    if (!error.response) {
      throw {
        status: 'network_error',
        message: '网络连接失败，请检查网络设置'
      };
    }

    // 处理401错误
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      throw {
        status: 'unauthorized',
        message: '登录已过期，请重新登录'
      };
    }

    // 重试逻辑
    if (originalRequest && !originalRequest._retry && originalRequest.retryCount < MAX_RETRIES) {
      originalRequest._retry = true;
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return api(originalRequest);
    }

    throw error.response?.data || {
      status: error.response?.status,
      message: '请求失败，请稍后重试'
    };
  }
);

// 认证相关API
export const auth = {
  login: (data) => api.post('/login', data),
  getUserData: () => api.get('/user')
};

// 健康数据分析API
export const healthData = {
  analyze: (formData) => api.post('/api/analyze', formData, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000,
    transformResponse: [(data) => {
      const response = JSON.parse(data);
      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }
      return response;
    }]
  }),
  getHistory: () => api.get('/analysis-history')
};

// 图片分析API
export const imageAnalysis = {
  analyze: (formData) => api.post('/image-analysis', formData),
  getHistory: () => api.get('/image-analysis-history'),
  deleteAnalysis: (analysisId) => api.delete(`/image-analysis/${analysisId}`),
  updateNote: (analysisId, note) => api.patch(`/image-analysis/${analysisId}/note`, { note })
};

// 文件上传API
export const upload = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000 // 上传文件给30秒超时
  })
};

export default api;
