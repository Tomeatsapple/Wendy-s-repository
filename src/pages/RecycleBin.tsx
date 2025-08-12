 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { SampleService } from "@/api/sampleService";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
 
 export default function RecycleBin() {
   const navigate = useNavigate();
   const [deletedSamples, setDeletedSamples] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   
  // 获取已删除样品数据
  useEffect(() => {
    const fetchDeletedSamples = async () => {
      try {
        // 从服务器获取已删除的样品
        const data = await SampleService.getDeletedSamples();
        setDeletedSamples(data);
        setLoading(false);
      } catch (error) {
        toast.error("获取回收箱数据失败");
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchDeletedSamples();
    
    // 添加刷新按钮点击事件监听器
    const refreshButton = document.getElementById('refresh-recycle-bin');
    if (refreshButton) {
      refreshButton.addEventListener('click', fetchDeletedSamples);
    }
    
    return () => {
      if (refreshButton) {
        refreshButton.removeEventListener('click', fetchDeletedSamples);
      }
    };
  }, []);
  
     // 恢复样品
     const restoreSample = async (sampleId: string) => {
       try {
         // 显示加载状态
         toast.loading("正在恢复样品...");
         
         await SampleService.restoreSampleFromRecycleBin(sampleId);
         // 更新本地状态
         setDeletedSamples(deletedSamples.filter(sample => sample.id !== sampleId));
         
         // 触发storage事件，通知其他页面数据已更新
         window.dispatchEvent(new Event('storage'));
         
         toast.success("样品已成功恢复到原数据表");
       } catch (error) {
         console.error("恢复样品时出错:", error);
         if (error instanceof Error) {
           toast.error(`恢复失败: ${error.message}`);
         } else {
           toast.error("恢复样品失败，请重试");
         }
       }
     };
   
    // 永久删除样品
    const permanentlyDeleteSample = async (sampleId: string) => {
      if (window.confirm("确定要永久删除此样品记录吗？此操作不可恢复。")) {
        try {
           // 先从数据库中删除记录
           await SampleService.permanentlyDeleteSample(sampleId);
           
          // 更新本地状态
          setDeletedSamples(deletedSamples.filter(sample => sample.id !== sampleId));
          toast.success("样品已永久删除");
        } catch (error) {
          toast.error("永久删除样品失败");
          console.error("永久删除样品时出错:", error);
        }
      }
    };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
         <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => navigate("/review-dashboard")}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回审核中心
          </button>
          <h1 className="text-xl font-bold text-gray-800">回收箱</h1>
          <button
            id="refresh-recycle-bin"
            onClick={() => {
              setLoading(true);
              SampleService.getDeletedSamples().then(data => {
                setDeletedSamples(data);
                setLoading(false);
              }).catch(error => {
                toast.error("刷新失败");
                console.error(error);
                setLoading(false);
              });
            }}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <i className="fa-solid fa-refresh mr-1"></i>
            刷新
          </button>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : deletedSamples.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fa-solid fa-trash-can text-gray-400 text-4xl mb-2"></i>
              <p className="text-gray-600">回收箱为空</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     样品编号
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     样品名称
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     送检时间
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     来源表
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     操作
                   </th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedSamples.map((sample) => (
                  <tr key={sample.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sample.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sample.name}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {new Date(sample.time).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {sample.sourceTable === 'samples' ? '样品表' : '已审核样品表'}
                     </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => restoreSample(sample.id)}
                        className="text-green-500 hover:text-green-700 mr-4"
                      >
                        <i className="fa-solid fa-arrow-rotate-left mr-1"></i>
                        恢复
                      </button>
                      <button
                        onClick={() => permanentlyDeleteSample(sample.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        永久删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}