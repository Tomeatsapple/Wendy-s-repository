import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SampleService } from "@/api/sampleService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function Submissions({ isInspectorView = false }: { isInspectorView?: boolean }) {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const navigate = useNavigate();

  // 获取样品数据的函数
  const fetchSamples = async () => {
    try {
      const data = await SampleService.getSamples();
      
      // 如果是检验员视角，显示所有提交记录；否则只显示当前用户的提交记录
      // 在实际应用中，这里应该根据登录用户ID筛选
      setSamples(data);
    } catch (error) {
      toast.error("获取提交记录失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初始加载数据
    fetchSamples();
    
    // 监听storage事件，当数据恢复时刷新
    const handleStorageChange = () => {
      // 添加短暂延迟确保数据已更新
      setTimeout(() => fetchSamples(), 300);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isInspectorView, fetchSamples]);

  // 删除样品
   const deleteSample = async (sampleId: string) => {
     if (window.confirm("确定要删除此样品记录吗？删除后将移至回收箱。")) {
       try {
         await SampleService.softDeleteSample(sampleId);
         // 从本地状态中移除删除的样品
         setSamples(samples.filter(sample => sample.id !== sampleId));
         toast.success("样品记录已移至回收箱");
       } catch (error) {
         toast.error("删除样品失败");
         console.error("删除样品时出错:", error);
       }
     }
   };

  const filteredSamples = samples.filter(sample => 
    filter === 'all' || sample.status === filter
  );

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => isInspectorView ? navigate("/review-dashboard") : navigate("/")}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            {isInspectorView ? "返回审核中心" : "返回"}
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {isInspectorView ? "用户提交信息" : "我的提交记录"}
          </h1>
          <div></div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
         {/* 筛选控件和刷新按钮 */}
         <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center space-x-4">
             <span className="text-sm font-medium text-gray-700">状态筛选:</span>
             {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
               <button
                 key={status}
                 onClick={() => setFilter(status)}
                 className={cn(
                   "px-3 py-1 rounded-full text-sm",
                   filter === status 
                     ? "bg-blue-500 text-white" 
                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                 )}
               >
                 {status === 'all' ? '全部' : 
                  status === 'pending' ? '待审核' : 
                  status === 'approved' ? '已通过' : '已拒绝'}
               </button>
             ))}
           </div>
           
           <button 
             id="refresh-submissions"
             onClick={() => fetchSamples()}
             className="flex items-center text-sm text-blue-500 hover:text-blue-700"
           >
             <i className="fa-solid fa-refresh mr-1"></i>
             刷新数据
           </button>
         </div>

        {/* 提交列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : filteredSamples.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fa-solid fa-inbox text-gray-400 text-4xl mb-2"></i>
              <p className="text-gray-600">暂无提交记录</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    样品名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送检时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSamples.map((sample) => (
                  <tr key={sample.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sample.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sample.time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        sample.status === 'approved' 
                          ? "bg-green-100 text-green-800"
                          : sample.status === 'rejected'
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      )}>
                        {sample.status === 'approved' ? '已通过' : 
                         sample.status === 'rejected' ? '已拒绝' : '待审核'}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => navigate(`/review-details?id=${sample.id}`)}
                          className="text-blue-500 hover:text-blue-700 mr-4"
                        >
                          <i className="fa-solid fa-eye mr-1"></i>
                          查看详情
                        </button>
                        {isInspectorView && (
                          <button
                            onClick={() => deleteSample(sample.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fa-solid fa-trash mr-1"></i>
                            删除
                          </button>
                        )}
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}