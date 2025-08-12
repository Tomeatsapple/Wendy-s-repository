import { useState } from "react";
import { SampleService } from "@/api/sampleService";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";


// 表单验证schema
const sampleSchema = z.object({
  name: z.string().min(1, "样品名称不能为空"),
  time: z.string().min(1, "请选择送检时间"),
});

const contactSchema = z.object({
  person: z.string().min(1, "送检人不能为空"),
  phone: z.string().min(11, "请输入正确的手机号"),
});

// 生成唯一ID
const generateId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SP-${random}`;
};

export default function Report() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sampleData, setSampleData] = useState({
    name: "",
    time: "",
  });
  const [contactData, setContactData] = useState({
    person: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [id] = useState(generateId());

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    try {
      if (step === 1) {
        sampleSchema.parse(sampleData);
        setStep(2);
      } else {
        contactSchema.parse(contactData);
        setIsSubmitting(true);
        // 提交到后端API (兼容SpringMVC)
        await SampleService.submitSample({
          ...sampleData,
          ...contactData
        });
        // 提交成功后跳转
        navigate("/result");
        toast.success("样品信息提交成功");
      }
      setErrors({});
    } catch (err) {
      // 增强错误处理，区分验证错误和API错误
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0]] = error.message;
          toast.error(error.message);
        });
        setErrors(newErrors);
      } else if (err instanceof Error) {
        toast.error(err.message || "提交失败，请检查网络连接或联系管理员");
      } else {
        toast.error("发生未知错误");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSampleData({
      ...sampleData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactData({
      ...contactData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-800">样品检验信息上报</h1>
        </div>
      </header>

      {/* 进度条 */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <div className={`ml-2 text-sm ${step >= 1 ? "text-blue-500" : "text-gray-500"}`}>
                  样品信息
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center">
                <div className="h-px bg-gray-300 w-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-end">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <div className={`ml-2 text-sm ${step >= 2 ? "text-blue-500" : "text-gray-500"}`}>
                  联系方式
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 样品编号 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">样品编号</label>
            <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-800">{id}</div>
          </div>

          {step === 1 ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-flask mr-2 text-blue-500"></i>
                  样品名称
                </label>
                <input
                  type="text"
                  name="name"
                  value={sampleData.name}
                  onChange={handleSampleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-calendar mr-2 text-blue-500"></i>
                  送检时间
                </label>
              <input
                type="datetime-local"
                name="time"
                value={sampleData.time}
                onChange={handleSampleChange}
                 className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 datetime-input ${
                   errors.time ? "border-red-500" : "border-gray-300"
                 }`}
                placeholder=" "
              />
              {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}

              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-user mr-2 text-blue-500"></i>
                  送检人
                </label>
                <input
                  type="text"
                  name="person"
                  value={contactData.person}
                  onChange={handleContactChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.person ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.person && <p className="mt-1 text-sm text-red-600">{errors.person}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-phone mr-2 text-blue-500"></i>
                  联系电话
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={contactData.phone}
                  onChange={handleContactChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              上一步
            </button>
          )}
          {step === 1 && <div></div>}
           <button
             onClick={handleNext}
             disabled={isSubmitting}
             className={cn(
               "ml-auto px-6 py-2 rounded-md text-white",
               isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
             )}
           >
             {isSubmitting ? (
               <>
                 <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                 提交中...
               </>
             ) : step === 1 ? "下一步" : "提交"}
           </button>
        </div>
      </div>
    </div>
  );
}
