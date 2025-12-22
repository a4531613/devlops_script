import axios from 'axios'
import { ElMessage } from 'element-plus'

export const api = axios.create({
  baseURL: '/api',
  timeout: 20_000,
})

api.interceptors.request.use((config) => {
  config.headers['x-role-code'] = localStorage.getItem('roleCode') || 'admin'
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.error || err.message || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

