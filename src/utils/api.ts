import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ApiConfigResponse } from '../types'

const API_BASE_URL = 'https://mhhong.com/api/taskApi/checkin'

/**
 * 创建 axios 实例
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiConfigResponse>) => {
    // 如果返回的 message 不是 success，抛出错误
    if (response.data?.message !== 'success') {
      throw new Error(response.data?.message || '请求失败')
    }
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 获取配置数据
 */
export async function getConfig(): Promise<{ CATEGORIES: any[], RECORDS: any[] }> {
  try {
    const response = await apiClient.get<ApiConfigResponse>('/getConfig')
    // 响应拦截器已经返回了 response.data，这里 response 就是 { message: "success", data: {...} }
    return response.data || { CATEGORIES: [], RECORDS: [] }
  } catch (error) {
    console.error('获取配置失败:', error)
    // 返回默认值，避免应用崩溃
    return { CATEGORIES: [], RECORDS: [] }
  }
}

/**
 * 保存配置数据
 * @param config - 配置对象，包含 CATEGORIES 和 RECORDS
 */
export async function saveConfig(config: { CATEGORIES: any[], RECORDS: any[] }): Promise<boolean> {
  try {
    await apiClient.post('/saveConfig', { config })
    return true
  } catch (error) {
    console.error('保存配置失败:', error)
    return false
  }
}

export default apiClient
