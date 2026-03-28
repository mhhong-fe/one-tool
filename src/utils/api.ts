import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { DataType } from '../types'

const API_BASE_URL = 'https://mhhong.com/api/taskApi/checkin'

interface ApiResponse<T> {
  message: string
  data: T
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    if (response.data?.message !== 'success') {
      throw new Error(response.data?.message || '请求失败')
    }
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)

export async function getConfig<T>(type: DataType): Promise<T | null> {
  try {
    const response = await apiClient.get<ApiResponse<T>>('/getConfig', { params: { type } })
    return (response as unknown as ApiResponse<T>).data ?? null
  } catch (error) {
    console.error(`获取 ${type} 失败:`, error)
    return null
  }
}

export async function saveConfig<T>(type: DataType, config: T): Promise<boolean> {
  try {
    await apiClient.post('/saveConfig', { type, config })
    return true
  } catch (error) {
    console.error(`保存 ${type} 失败:`, error)
    return false
  }
}

export { DataType }
export default apiClient
