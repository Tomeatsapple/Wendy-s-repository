import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从URL状态获取重定向路径
  const fromPath = location.state?.from || "/review-dashboard";
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuthenticated, isAuthenticated } = useAuth();

  // 如果已认证，重定向到目标页面
  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath);
    }
  }, [isAuthenticated, navigate, fromPath]);

  const features = [
    {
      title: "用户上报",
      description: "提交实验室样品检验申请",
      icon: "fa-solid fa-flask",
      path: "/report",
      color: "bg-blue-500",
    },
    {
      title: "检验员登录",
      description: "检验员登录后进行审核操作",
      icon: "fa-solid fa-user-shield",
      action: () => setShowLogin(true),
      color: "bg-green-500",
    },
  ];

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    
    try {
      // 在实际应用中，这里应该调用后端API进行身份验证
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 验证凭据（实际应用中应替换为API调用）
      if (username === "admin" && password === "admin") {
        // 设置认证状态和用户角色
        setIsAuthenticated(true, "inspector");
        toast.success("登录成功");
        
        // 关闭登录模态框
        setShowLogin(false);
        
        // 导航到目标页面
        navigate(fromPath);
      } else {
        setLoginError("账号或密码错误，请重试");
        toast.error("登录失败");
      }
    } catch (error) {
      setLoginError("登录失败，请稍后重试");
      toast.error("登录失败，请稍后重试");
      console.error("登录错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘回车登录
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && showLogin) {
      handleLogin();
    }
  };

  useEffect(() => {
    // 添加键盘事件监听
    window.addEventListener("keypress", handleKeyPress);
    return () => {
      // 移除事件监听
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [showLogin, isLoading]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">便民服务检验信息管理系统</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fa-solid fa-user text-blue-500"></i>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎使用便民服务检验信息管理系统</h2>
          <p className="text-lg text-gray-600">请选择您需要的功能</p>
        </div>

        {/* 功能卡片区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => feature.path ? (feature.path.startsWith('http') ? window.open(feature.path, '_blank') : navigate(feature.path)) : feature.action?.()}
              className={cn(
                "bg-white rounded-xl shadow-md overflow-hidden cursor-pointer",
                "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                "flex flex-col items-center p-6 text-center"
              )}
            >
              <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mb-4`}>
                <i className={`${feature.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
         {/* 送检须知链接 */}
         <div className="mt-8 text-center">
           <a href="#" className="text-blue-500 hover:text-blue-700 text-sm" 
              onClick={(e) => {
                e.preventDefault();
                alert('送检须知内容即将上线，敬请期待！');
              }}>
             送检须知
           </a>
         </div>

         {/* 检验员登录模态框 */}
         {showLogin && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
               <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">检验员登录</h3>
               
               {loginError && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                   {loginError}
                 </div>
               )}
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
                   <input
                     type="text"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     disabled={isLoading}
                     className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                     placeholder="请输入账号"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                   <input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     disabled={isLoading}
                     className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                     placeholder="请输入密码"
                   />
                 </div>
               </div>
               
               <div className="mt-6 flex space-x-4">
                 <button
                   onClick={() => setShowLogin(false)}
                   disabled={isLoading}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                 >
                   取消
                 </button>
                 <button
                   onClick={handleLogin}
                   disabled={isLoading || !username || !password}
                   className="flex-1 px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-600 flex items-center justify-center"
                 >
                   {isLoading ? (
                     <>
                       <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                       登录中...
                     </>
                   ) : (
                     "登录"
                   )}
                 </button>
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}