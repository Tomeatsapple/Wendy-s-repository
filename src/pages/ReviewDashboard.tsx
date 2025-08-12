import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReviewDashboard() {
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  
  const reviewFeatures = [
    {
      title: "审核与结果反馈",
      description: "处理样品检验并反馈结果",
      icon: "fa-solid fa-clipboard-check",
      path: "/review-result",
      color: "bg-blue-500",
    },
    {
      title: "用户提交信息",
      description: "查看所有用户提交的样品信息",
      icon: "fa-solid fa-list-check",
      path: "/inspector-submissions",
      color: "bg-green-500",
    },
    {
      title: "回收箱",
      description: "查看已删除的提交记录",
      icon: "fa-solid fa-trash",
      path: "/recycle-bin",
      color: "bg-amber-500",
    },
  ];
  
  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      logout();
      toast.success("已退出登录");
      navigate("/");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">检验员工作平台</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              <i className="fa-solid fa-user mr-1"></i>
              {userRole === "inspector" ? "检验员" : "管理员"}
            </span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 flex items-center"
            >
              <i className="fa-solid fa-sign-out-alt mr-1"></i>
              退出登录
            </button>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">审核管理</h2>
          <p className="text-lg text-gray-600">请选择需要进行的操作</p>
        </div>
        
        {/* 功能卡片区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviewFeatures.map((feature, index) => (
            <div
              key={index}
              onClick={() => navigate(feature.path)}
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
      </main>
    </div>
  );
}