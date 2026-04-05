export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
export const API_BASE_URL = `${API_URL}/api`

// Helper function to get full API endpoint
export const getApiUrl = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/${cleanPath}`
}
