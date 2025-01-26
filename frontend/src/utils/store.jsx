import { createContext, useContext, useReducer } from 'react';

// 初始状态
const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token') || null,
  walletAddress: localStorage.getItem('walletAddress') || null
};

// Action 类型
const ActionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN:
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('walletAddress', action.payload.walletAddress);
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        walletAddress: action.payload.walletAddress,
        user: action.payload.user
      };

    case ActionTypes.LOGOUT:
      localStorage.removeItem('token');
      localStorage.removeItem('walletAddress');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        walletAddress: null,
        user: null
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };

    default:
      return state;
  }
};

// 创建 Context
const StoreContext = createContext();

// Provider 组件
export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

// 自定义 Hook
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// Action 创建器
export const actions = {
  login: (token, walletAddress, user) => ({
    type: ActionTypes.LOGIN,
    payload: { token, walletAddress, user }
  }),

  logout: () => ({
    type: ActionTypes.LOGOUT
  }),

  updateUser: (user) => ({
    type: ActionTypes.UPDATE_USER,
    payload: user
  })
};

export default {
  StoreProvider,
  useStore,
  actions
};
