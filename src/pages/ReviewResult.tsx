import { useState, useEffect } from "react";
import { SampleService, getReview } from "@/api/sampleService";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


// 表单验证schema
const reviewSchema = z.object({
  testItem: z.string().min(1, "检验项目不能为空").max(100, "检验项目不能超过100字符"),
  testResult: z.string().min(1, "检验结果不能为空").max(100, "检验结果不能超过100字符"),
  standard: z.string().min(1, "标准规定不能为空").max(100, "标准规定不能超过100字符"),
  detectionLimit: z.string().min(1, "检出限不能为空").max(100, "检出限不能超过100字符"),
  department: z.string().min(1, "检验科室不能为空").max(100, "检验科室不能超过100字符"),
  responsiblePerson: z.string().min(1, "检验负责人不能为空").max(100, "检验负责人不能超过100字符"),
  notification: z.string().min(1, "结果告知情况不能为空").max(100, "结果告知情况不能超过100字符"),
});

export default function ReviewResult() {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<z.infer<typeof reviewSchema>>({
    testItem: "",
    testResult: "",
    standard: "",
    detectionLimit: "",
    department: "",
    responsiblePerson: "",
    notification: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // 加载待审核样品数据
  useEffect(() => {
    const fetchPendingSamples = async () => {
      try {
        const data = await SampleService.getSamples();
        // 过滤出待审核的样品
        const pendingSamples = data.filter((sample: any) => sample.status === 'pending');
        setSamples(pendingSamples);
      } catch (error) {
        toast.error("加载样品数据失败");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingSamples();
  }, []);

  const [currentSample, setCurrentSample] = useState<any>(null);
  
  // 打开填写表单
  const openReviewForm = async (sampleId: string) => {
    try {
      // 获取样品基本信息和审核信息
      const [sampleData, reviewData] = await Promise.all([
        SampleService.getSampleById(sampleId),
        getReview(sampleId)
      ]);
      
      // 保存当前样品信息
      setCurrentSample(sampleData);
      
      // 填充表单数据
      if (reviewData) {
        setFormData({
          testItem: reviewData.test_item,
          testResult: reviewData.test_result,
          standard: reviewData.standard,
          detectionLimit: reviewData.detection_limit,
          department: reviewData.department,
          responsiblePerson: reviewData.responsible_person,
          notification: reviewData.notification
        });
      } else {
        // 重置表单数据
        setFormData({
          testItem: "",
          testResult: "",
          standard: "",
          detectionLimit: "",
          department: "",
          responsiblePerson: "",
          notification: ""
        });
      }
      
      setEditingId(sampleId);
    } catch (error) {
      toast.error("获取审核数据失败");
      console.error(error);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除当前字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 提交审核结果
  const submitReview = async () => {
    try {
      // 验证表单
      reviewSchema.parse(formData);
      
      console.log('提交审核，sample_id:', editingId);
      // 保存到数据库
      await SampleService.saveReview(editingId!, formData);
      
      // 更新样品状态为已审核
      await SampleService.updateSampleStatus(editingId!, 'approved');
      
      // 更新本地状态
      setSamples(prev => 
        prev.map(s => 
          s.id === editingId 
            ? { ...s, reviewData: formData, status: 'approved' } 
            : s
        )
      );
      
      toast.success("审核结果已保存");
      setEditingId(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
        toast.error("请检查表单填写是否正确");
      } else if (err instanceof Error) {
        toast.error(err.message || "保存失败，请重试");
      } else {
        toast.error("保存失败，请重试");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回
          </button>
          <h1 className="text-xl font-bold text-gray-800">审核与结果反馈</h1>
          <div></div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i>
            <span className="ml-2">加载中...</span>
          </div>
        ) : samples.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <i className="fa-solid fa-inbox text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-600">暂无待审核的样品</p>
          </div>
        ) : (
          <>
            {/* 样品列表 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {samples.map((sample) => (
                    <tr key={sample.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sample.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sample.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          待审核
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openReviewForm(sample.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i>
                          填写结果
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

             {/* 审核表单 */}
             {editingId && currentSample && (
               <div className="mt-8 bg-white shadow-md rounded-lg p-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-6">
                   <i className="fa-solid fa-flask mr-2 text-blue-500"></i>
                   样品检验结果填写
                 </h2>
                 
                 <div className="space-y-6">
                   {/* 用户上传信息和审核表单分栏显示 */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* 用户上传信息 */}
                     <div className="bg-gray-50 p-5 rounded-lg">
                       <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                         <i className="fa-solid fa-user mr-2 text-gray-500"></i>
                         用户上传信息
                       </h3>
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             样品编号
                           </label>
                           <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                             {editingId}
                           </div>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             样品名称
                           </label>
                           <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                             {currentSample.name}
                           </div>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             送检时间
                           </label>
                           <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                             {new Date(currentSample.time).toLocaleString()}
                           </div>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             送检人
                           </label>
                           <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                             {currentSample.person}
                           </div>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             联系电话
                           </label>
                           <div className="px-4 py-2 bg-white rounded-md border border-gray-200">
                             {currentSample.phone}
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* 审核员填写表单 */}
                     <div>
                       <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                         <i className="fa-solid fa-pen-to-square mr-2 text-blue-500"></i>
                         检验结果填写
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {Object.entries(formData).map(([field, value]) => (
                           <div key={field}>
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                               {{
                                  testItem: "检验项目",
                                  testResult: "检验结果",
                                  standard: "标准规定",
                                  detectionLimit: "检出限或定量限",
                                  department: "检验科室",
                                  responsiblePerson: "检验负责人",
                                  notification: "结果告知情况"
                               }[field]}
                             </label>
                             <input
                               type="text"
                               name={field}
                               value={value}
                               onChange={handleInputChange}
                               className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                 errors[field] ? "border-red-500" : "border-gray-300"
                               }`}
                             />
                             {errors[field] && (
                               <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>

                   {/* 操作按钮 */}
                   <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                     <button
                       type="button"
                       onClick={() => setEditingId(null)}
                       className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                     >
                       取消
                     </button>
                     <button
                       type="button"
                       onClick={submitReview}
                       className="px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-600"
                     >
                       提交审核
                     </button>
                   </div>
                 </div>
               </div>
             )}
          </>
        )}
      </main>
    </div>
  );
}