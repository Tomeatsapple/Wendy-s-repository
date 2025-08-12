import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import ReviewResult from "@/pages/ReviewResult";
import Result from "@/pages/Result";
import Submissions from "@/pages/Submissions";
import ReviewDetails from "@/pages/ReviewDetails";
import ReviewDashboard from "@/pages/ReviewDashboard";
import { useAuth } from "@/context/AuthContext";
import RecycleBin from "@/pages/RecycleBin";
import axios from "axios";

// 配置API基础URL
axios.defaults.baseURL = "http://localhost:8080/api";

// 保护路由组件 - 统一处理路由权限
const ProtectedRoute = ({ children, requiredRole }: { 
  children: React.ReactNode, 
  requiredRole?: string 
}) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  // 如果未认证，重定向到登录页并记录当前位置
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // 如果需要特定角色且当前用户角色不匹配
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * 应用路由配置
 * 此文件定义了所有地址栏URL路径与对应页面组件的映射关系
 * 例如: path="/report" 对应 Report 组件，在地址栏显示为 http://domain/report
 */
export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 已认证用户访问登录页时重定向到工作台
  if (isAuthenticated && location.pathname === "/") {
    return <Navigate to="/review-dashboard" replace />;
  }

  return (
  <>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Home />} /> {/* 首页 - 地址栏显示: / */}
        <Route path="/report" element={<Report />} /> {/* 样品上报 - 地址栏显示: /report */}
        <Route path="/result" element={<Result />} /> {/* 提交结果 - 地址栏显示: /result */}
        <Route path="/submissions" element={<Submissions />} /> {/* 我的提交 - 地址栏显示: /submissions */}
        <Route path="/review-details" element={<ReviewDetails />} /> {/* 详情页面 - 地址栏显示: /review-details */}
        
        {/* 受保护的检验员路由 */}
        <Route 
          path="/review-dashboard" 
          element={
            <ProtectedRoute requiredRole="inspector">
              <ReviewDashboard />
            </ProtectedRoute>
          } 
        /> {/* 检验员工作台 - 地址栏显示: /review-dashboard */}
        
        <Route 
          path="/review-result" 
          element={
            <ProtectedRoute requiredRole="inspector">
              <ReviewResult />
            </ProtectedRoute>
          } 
        /> {/* 审核结果 - 地址栏显示: /review-result */}
        
        <Route 
          path="/recycle-bin" 
          element={
            <ProtectedRoute requiredRole="inspector">
              <RecycleBin />
            </ProtectedRoute>
          } 
        /> {/* 回收箱 - 地址栏显示: /recycle-bin */}
        
        <Route 
          path="/inspector-submissions" 
          element={
            <ProtectedRoute requiredRole="inspector">
              <Submissions isInspectorView={true} />
            </ProtectedRoute>
          } 
        /> {/* 检验员查看提交 - 地址栏显示: /inspector-submissions */}
      </Routes>
  </>
  );
}