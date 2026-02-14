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

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details 
          ? data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          : data.error || `HTTP error! status: ${response.status}`;
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

  // Admin endpoints
  async getAdminAnalytics() {
    return this.request('/admin/analytics')
  }

  async getAdminOrders() {
    return this.request('/admin/orders')
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