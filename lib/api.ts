const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      credentials: 'include', // Include cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Try to get auth token from cookie and add to Authorization header
    try {
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';')
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))
        if (authCookie) {
          const token = authCookie.split('=')[1]
          if (token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          }
        }
      }
    } catch (e) {
      // Ignore cookie access errors (e.g., in server environment)
    }

    // If body is FormData, remove forced Content-Type so browser can set multipart boundary
    try {
      // runtime check for FormData (browser)
      // @ts-ignore
      if (config.body && typeof FormData !== 'undefined' && config.body instanceof FormData) {
        const headers = config.headers as Record<string, any>
        if (headers && headers['Content-Type']) delete headers['Content-Type']
      }
    } catch (e) {
      // ignore (FormData may not be available in some runtimes)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Normalize backend error shape to a readable string.
        // Backend returns { error: { code, message, details? }, message? }
        let errorMessage = `HTTP error! status: ${response.status}`

        if (data) {
          if (data.error) {
            if (typeof data.error === 'string') {
              errorMessage = data.error
            } else if (data.error.message) {
              errorMessage = data.error.message
            } else if (data.error.details) {
              try {
                if (Array.isArray(data.error.details)) {
                  errorMessage = data.error.details.map((d: any) => d.message || JSON.stringify(d)).join(', ')
                } else {
                  errorMessage = JSON.stringify(data.error.details)
                }
              } catch (e) {
                errorMessage = String(data.error.details)
              }
            }
          } else if (data.message) {
            errorMessage = data.message
          }
        }

        throw new Error(errorMessage);
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Auth endpoints
  async signup(email: string, password: string, fullName: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    })
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Product endpoints
  async getProducts(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.search) query.set('search', params.search)

    return this.request(`/products?${query.toString()}`)
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`)
  }

  async getProductBySlug(slug: string) {
    return this.request(`/products/slug/${slug}`)
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    })
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  async uploadImage(fileOrForm: File | FormData) {
    let body: FormData
    if (fileOrForm instanceof FormData) {
      body = fileOrForm
    } else {
      body = new FormData()
      body.append('file', fileOrForm)
    }

    return this.request('/products/upload-image', {
      method: 'POST',
      body,
      headers: {}, // Let browser set content-type for FormData
    })
  }

  // Admin endpoints
  async getAdminAnalytics(token?: string) {
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return this.request('/admin/analytics', { headers })
  }

  async getAdminOrders(token?: string) {
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return this.request('/admin/orders', { headers })
  }

  async updateOrderStatus(orderId: string, status: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers,
    })
  }

  // Affiliate endpoints
  async getAffiliateStats() {
    return this.request('/affiliate/stats')
  }

  async getAffiliateLinks() {
    return this.request('/affiliate/links')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)