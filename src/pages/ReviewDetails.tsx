import { useState, useEffect } from "react";
import { SampleService } from "@/api/sampleService";
import { useNavigate, useLocation } from "react-router-dom";
import { getReview } from "@/api/sampleService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReviewDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<{
    id?: string;
    name?: string;
    time?: string;
    person?: string;
    phone?: string;
    status?: string;
    test_item?: string;
    test_result?: string;
    standard?: string;
    detection_limit?: string;
    department?: string;
    responsible_person?: string;
    notification?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 从URL参数获取样品ID
  const sampleId = new URLSearchParams(location.search).get('id');

  useEffect(() => {
    const fetchReviewData = async () => {
      if (!sampleId) return;
      
      try {
        // 同时获取样品基本信息和审核信息
        const [sampleData, reviewData] = await Promise.all([
          SampleService.getSampleById(sampleId),
          getReview(sampleId)
        ]);
        setReviewData({
          ...sampleData,
          ...reviewData
        });
      } catch (error) {
        toast.error("获取详情失败");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [sampleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-center items-center h-screen">
          <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i>
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-600">未找到审核信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回
          </button>
          <h1 className="text-xl font-bold text-gray-800">样品详情</h1>
          <div></div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* 样品基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  样品编号
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-md">
                  {sampleId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  样品名称
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-md">
                  {reviewData?.name || '无'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  送检时间
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-md">
                  {reviewData?.time || '无'}
                </div>
              </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   送检人
                 </label>
                 <div className="px-4 py-2 bg-gray-100 rounded-md">
                   {reviewData?.person || '无'}
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   联系电话
                 </label>
                 <div className="px-4 py-2 bg-gray-100 rounded-md">
                   {reviewData?.phone || '无'}
                 </div>
               </div>
            </div>

            {/* 审核信息 - 仅当样品已审核时显示 */}
            {reviewData?.status === 'approved' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  <i className="fa-solid fa-clipboard-check mr-2 text-blue-500"></i>
                  检验信息
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      检验项目
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.test_item || '无'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      检验结果
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.test_result || '无'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标准规定
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.standard || '无'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      检出限或定量限
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.detection_limit || '无'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      检验科室
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.department || '无'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结果告知情况
                    </label>
                    <div className="px-4 py-2 bg-gray-100 rounded-md">
                      {reviewData.notification || '无'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}