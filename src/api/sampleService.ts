import axios from 'axios';
import { z } from 'zod';

// 定义错误类型接口
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// 定义与SpringMVC兼容的API接口
const API_BASE_URL = 'http://localhost:8080/api'; // 假设SpringMVC后端地址

// 样品数据类型
export interface Sample {
  id: string;
  name: string;
  time: string;
  person: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 真实数据库连接示例(需在后端实现):
/*
const response = await apiClient.post('/samples', {
  name: sample.name,
  time: sample.time,
  person: sample.person,
  phone: sample.phone
});
return response.data;
*/

  // 样品服务类
  export const SampleService = {
    // 提交样品
    async submitSample(sample: Omit<Sample, 'id' | 'status'>): Promise<Sample> {
        try {
          // 格式化时间为MySQL兼容的datetime格式 (YYYY-MM-DD HH:MM:SS)
          const formattedSample = {
            ...sample,
            time: new Date(sample.time).toISOString()
              .replace('T', ' ')       // 将T替换为空格
              .replace(/\.\d+Z$/, '')  // 移除毫秒和Z时区标识
          };
          const response = await apiClient.post('/samples', formattedSample);
          return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const apiError: ApiError = new Error(
            error.response?.data?.message || '提交样品失败，请稍后重试'
          );
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
          throw apiError;
        }
        const unknownError: ApiError = new Error('提交样品失败，请稍后重试');
        unknownError.code = 'UNKNOWN_ERROR';
        throw unknownError;
      }
    },

    // 获取样品列表（默认获取未删除的样品）
    async getSamples(includeDeleted: boolean = false): Promise<Sample[]> {
      try {
        const response = await apiClient.get('/samples', {
          params: { includeDeleted }
        });
        
        // 添加source_table字段到Sample类型
        return response.data.map((sample: any) => ({
          ...sample,
          sourceTable: sample.source_table || 'samples'
        }));
      } catch (error) {
        console.error('获取样品列表失败:', error);
        const apiError: ApiError = new Error('获取样品列表失败');
        if (axios.isAxiosError(error)) {
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
        } else {
          apiError.code = 'UNKNOWN_ERROR';
        }
        throw apiError;
      }
    },
    
     // 获取已删除的样品（所有表）
     async getDeletedSamples(): Promise<Sample[]> {
       try {
         const response = await apiClient.get('/recycle-bin');
         return response.data.map((item: any) => ({
           ...item,
           sourceTable: item.source_table
         }));
       } catch (error) {
         console.error('获取已删除样品失败:', error);
         const apiError: ApiError = new Error('获取已删除样品失败');
         if (axios.isAxiosError(error)) {
           apiError.status = error.response?.status;
           apiError.code = error.response?.data?.code;
           apiError.details = error.response?.data?.details;
         } else {
           apiError.code = 'UNKNOWN_ERROR';
         }
         throw apiError;
       }
     },

    // 获取单个样品详情
    async getSampleById(id: string): Promise<Sample> {
      try {
        const response = await apiClient.get(`/samples/${id}`);
        return response.data;
      } catch (error) {
        console.error('获取样品详情失败:', error);
        const apiError: ApiError = new Error('获取样品详情失败');
        if (axios.isAxiosError(error)) {
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
        } else {
          apiError.code = 'UNKNOWN_ERROR';
        }
        throw apiError;
      }
    },

    // 更新样品状态
    async updateSampleStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
      try {
        console.log('发起状态更新请求:', id, status);
        const response = await apiClient.patch(`/samples/${id}/status`, { status });
        console.log('状态更新响应:', response.data);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.error || '更新样品状态失败';
          const apiError: ApiError = new Error(message);
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
          throw apiError;
        }
        console.error('更新样品状态失败:', error);
        const unknownError: ApiError = new Error('更新样品状态失败');
        unknownError.code = 'UNKNOWN_ERROR';
        throw unknownError;
      }
    },

      // 软删除样品（将is_deleted设为1）
      async softDeleteSample(id: string): Promise<void> {
        try {
          // 使用DELETE请求触发软删除
          await apiClient.delete(`/samples/${id}`);
        } catch (error) {
          console.error('删除样品失败:', error);
          const apiError: ApiError = new Error('删除样品失败');
          if (axios.isAxiosError(error)) {
            apiError.status = error.response?.status;
            apiError.code = error.response?.data?.code;
            apiError.details = error.response?.data?.details;
          } else {
            apiError.code = 'UNKNOWN_ERROR';
          }
          throw apiError;
        }
      },
     
      // 从回收箱恢复样品（更新删除标记）
      async restoreSampleFromRecycleBin(id: string): Promise<void> {
        try {
          // 使用PATCH请求更新删除标记，恢复样品
          await apiClient.patch(`/samples/${id}/restore`);
        } catch (error) {
          console.error('恢复样品失败:', error);
          const apiError: ApiError = new Error('恢复样品失败');
          if (axios.isAxiosError(error)) {
            apiError.status = error.response?.status;
            apiError.code = error.response?.data?.code;
            apiError.details = error.response?.data?.details;
          } else {
            apiError.code = 'UNKNOWN_ERROR';
          }
          throw apiError;
        }
      },
     
      // 从回收箱永久删除样品（直接删除数据库记录）
      async permanentlyDeleteSample(id: string): Promise<void> {
        try {
          // 调用后端永久删除API
          await apiClient.delete(`/samples/${id}/permanent`);
          
          // 同时更新本地存储的回收箱
          const recycleBin = JSON.parse(localStorage.getItem('recycleBin') || '[]');
          const updatedRecycleBin = recycleBin.filter((item: any) => item.id !== id);
          localStorage.setItem('recycleBin', JSON.stringify(updatedRecycleBin));
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const apiError: ApiError = new Error(
              error.response?.data?.error || '永久删除样品失败'
            );
            apiError.status = error.response?.status;
            apiError.code = error.response?.data?.code;
            apiError.details = error.response?.data?.details;
            throw apiError;
          }
          console.error('永久删除样品失败:', error);
          const unknownError: ApiError = new Error('永久删除样品失败');
          unknownError.code = 'UNKNOWN_ERROR';
          throw unknownError;
        }
      },
     
     // 获取回收箱中的样品
     async getRecycleBinSamples(): Promise<any[]> {
       try {
         // 从本地存储获取回收箱样品
         const recycleBin = JSON.parse(localStorage.getItem('recycleBin') || '[]');
         return recycleBin;
       } catch (error) {
         console.error('获取回收箱样品失败:', error);
         const apiError: ApiError = new Error('获取回收箱样品失败');
         apiError.code = 'UNKNOWN_ERROR';
         throw apiError;
       }
     },

    // 保存review数据
    async saveReview(sampleId: string, reviewData: any): Promise<void> {
      try {
        const response = await apiClient.post('/review', {
          sample_id: sampleId,
          ...reviewData
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          let message = error.response?.data?.error || '保存Review数据失败';
          if (error.response?.status === 404) {
            message = '关联的样品不存在，请检查样品ID';
          } else if (error.response?.status === 400) {
            message = '关联的样品不存在，请检查样品ID';
          }
          const apiError: ApiError = new Error(message);
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
          throw apiError;
        }
        const unknownError: ApiError = new Error('保存Review数据失败');
        unknownError.code = 'UNKNOWN_ERROR';
        throw unknownError;
      }
    }
  }

  // 定义Review数据类型
  export interface ReviewData {
    id?: number;
    sample_id: string;
    test_item: string;
    test_result: string;
    standard: string;
    detection_limit: string;
    department: string;
    responsible_person: string;
    notification: string;
    created_at?: string;
    updated_at?: string;
  }

  // 获取review数据
  export async function getReview(sampleId: string): Promise<ReviewData | null> {
    try {
      const response = await apiClient.get('/review', {
        params: { sample_id: sampleId }
      });
      
      if (!response.data) {
        return null;
      }
      
      // 确保返回的数据符合ReviewData结构
      const reviewData: ReviewData = {
        sample_id: response.data.sample_id,
        test_item: response.data.test_item || '',
        test_result: response.data.test_result || '',
        standard: response.data.standard || '',
        detection_limit: response.data.detection_limit || '',
        department: response.data.department || '',
        responsible_person: response.data.responsible_person || '',
        notification: response.data.notification || ''
      };
      
      return reviewData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || '获取Review数据失败';
        if (error.response?.status === 404) {
          return null;
        }
          const apiError: ApiError = new Error(message);
          apiError.status = error.response?.status;
          apiError.code = error.response?.data?.code;
          apiError.details = error.response?.data?.details;
          throw apiError;
        }
        const unknownError: ApiError = new Error('获取Review数据失败');
        unknownError.code = 'UNKNOWN_ERROR';
        throw unknownError;
    }
  }