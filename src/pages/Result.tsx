import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Result() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-800">样品检验提交结果</h1>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-6">
            <i className="fa-solid fa-circle-check text-green-500 text-5xl mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h2>
            <p className="text-gray-600 mb-6">您的样品检验申请已成功提交，请等待审核结果。</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-600"
            >
              返回首页
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}