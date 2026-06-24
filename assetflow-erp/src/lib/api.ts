import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("af-token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("af-token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
