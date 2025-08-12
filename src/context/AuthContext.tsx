import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

// 定义AuthContext类型
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  setIsAuthenticated: (value: boolean, role?: string) => void;
  logout: () => void;
}

// 创建AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider组件，提供认证状态管理
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 从localStorage加载认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });
  
  // 从localStorage加载用户角色
  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem('userRole');
  });

  // 当认证状态变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [isAuthenticated, userRole]);

  const setAuthStatus = (value: boolean, role?: string) => {
    setIsAuthenticated(value);
    setUserRole(value ? (role || 'user') : null);
  };

  const logout = () => {
    // 清除认证状态和用户信息
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, setIsAuthenticated: setAuthStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义hook，方便使用AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};