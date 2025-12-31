"use client"

import { useState, createContext, useContext, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client" // Removed Supabase client
// import type { User } from "@supabase/supabase-js" // Removed Supabase User
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Storefront } from "@/components/storefront"
import { ProductDetails } from "@/components/product-details"
import { TrackingView } from "@/components/tracking-view"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ElevenLabsWidget } from "@/components/elevenlabs-widget"
import { ShoppingCart } from "@/components/shopping-cart"
import { Checkout } from "@/components/checkout"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { getUser } from "@/app/auth/actions"
import type { User } from "@/app/auth/actions" // Imported Mock User as User
import { validateCoupon } from "@/app/actions/coupon-actions"


const TikTok = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

export type OrderStatus = "ordered" | "warehouse_china" | "shipped" | "customs_addis" | "delivered"

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  product: string
  quantity: number
  status: OrderStatus
  timestamp: string
  totalAmount: number
}

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image: string
  description?: string
  specifications?: Record<string, string>
  rating?: number
  reviewCount?: number
  inStock?: boolean
  tags?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Review {
  id: string
  productId: string
  userName: string
  rating: number
  comment: string
  date: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  wishlist: string[]
  toggleWishlist: (productId: string) => void
  discount: number
  couponCode: string | null
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}

// MOCK_PRODUCTS removed - fetched dynamically

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-2025-001",
    customerName: "Abebe Kebede",
    customerEmail: "abebe.k@email.com",
    customerPhone: "0911234567",
    product: "Industrial Sewing Machine",
    quantity: 2,
    status: "shipped",
    timestamp: "2025-01-15T10:30:00Z",
    totalAmount: 90000,
  },
  {
    id: "ORD-2025-002",
    customerName: "Marta Tadesse",
    customerEmail: "marta.t@email.com",
    customerPhone: "0922345678",
    product: "Lenovo ThinkPad X1",
    quantity: 1,
    status: "customs_addis",
    timestamp: "2025-01-18T14:20:00Z",
    totalAmount: 85000,
  },
  {
    id: "ORD-2025-003",
    customerName: "Solomon Gebre",
    customerEmail: "solomon.g@email.com",
    customerPhone: "0933456789",
    product: "Solar Inverter 5KW",
    quantity: 3,
    status: "warehouse_china",
    timestamp: "2025-01-20T09:00:00Z",
    totalAmount: 45000,
  },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home")
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  // const supabase = createClient() // Removed
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [searchOrderId, setSearchOrderId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [discount, setDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState<string | null>(null)

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prevCart, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCart([])
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalPrice = subtotal * (1 - discount / 100)

  const applyCoupon = async (code: string) => {
    // Validate against the first product for now, or generally. 
    // The action expects a productId if specific, but we'll use a generic check or check cart items.
    // For simplicity, we just pass an empty string for productId if generic, or check explicitly.
    // Our action validation: if coupon has targetProductId, it checks it.

    // Check if any item in cart matches target product? 
    // For this MVP, we'll assume global coupons or just validate against first item if needed.
    // Actually, let's just pass "" as productId for now to check validity code-wise.
    // If we want item-specific, we'd need more complex logic.

    const result = await validateCoupon(code, "")
    if (result.error) {
      return { success: false, message: result.error }
    }

    setDiscount(result.discountPercentage || 0)
    setCouponCode(code)
    return { success: true }
  }

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus, timestamp: new Date().toISOString() } : order,
      ),
    )
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]

  const cartContextValue: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    wishlist,
    toggleWishlist,
    discount,
    couponCode,
    applyCoupon
  }

  useEffect(() => {
    getUser().then((user) => {
      setUser(user)
      setIsAdmin(user?.role === "admin" || user?.role === "super-admin")
    })

    // Fetch products
    import("@/app/actions/product-actions").then(({ getProducts }) => {
      getProducts().then(setProducts)
    })
  }, [])

  useEffect(() => {
    if (isAdmin && activeTab === "home") {
      setActiveTab("admin")
    }
  }, [isAdmin])

  return (
    <CartContext.Provider value={cartContextValue}>
      <div className="min-h-screen bg-background">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cartCount={totalItems}
          onCartClick={() => setShowCart(true)}
          user={user}
          isAdmin={isAdmin}
        />

        <main>
          {!user ? (
            // Guest View
            <>
              <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-20 pb-10">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="container px-4 relative z-10 space-y-8 animate-in fade-in zoom-in duration-1000">
                  <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                    Global Trade, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400">Simplified.</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light drop-shadow-md">
                    Your trusted partner for seamless sourcing and logistics from China to Ethiopia.
                    <br className="hidden md:block" />
                    We handle the complexity, so you can focus on growth.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <a
                      href="/auth/sign-up"
                      className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90"
                    >
                      Get Started
                    </a>
                    <a
                      href="/auth/login"
                      className="inline-flex h-14 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-10 text-lg font-bold text-white shadow-sm transition-all hover:bg-white/20 hover:scale-105"
                    >
                      Member Login
                    </a>
                  </div>

                  <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white/80">
                    <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="font-bold text-3xl text-white mb-1">5K+</div>
                      <div className="text-sm font-medium">Successful Orders</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="font-bold text-3xl text-white mb-1">98%</div>
                      <div className="text-sm font-medium">On-Time Delivery</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="font-bold text-3xl text-white mb-1">24/7</div>
                      <div className="text-sm font-medium">Customer Support</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="font-bold text-3xl text-white mb-1">100%</div>
                      <div className="text-sm font-medium">Secure Payment</div>
                    </div>
                  </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                </div>
              </section>

              <section className="py-24 bg-gradient-to-b from-background to-muted/30">
                <div className="container mx-auto max-w-7xl px-4">
                  <div className="text-center mb-16 space-y-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Why T2?</div>
                    <h2 className="text-4xl font-bold tracking-tight">The Future of Import Logistics</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                      Experience the difference of a professional logistics partner committed to your success.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      {
                        title: "Live Tracking",
                        desc: "Monitor your shipments in real-time from our warehouse in China to your doorstep in Addis.",
                        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z" /><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /><path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" /><path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" /></svg>
                      },
                      {
                        title: "Fast Delivery",
                        desc: "Optimized logistics routes ensure your goods arrive faster and safer than ever before.",
                        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      },
                      {
                        title: "Best Prices",
                        desc: "Direct access to manufacturers means you save more on every order without compromising quality.",
                        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      }
                    ].map((feature, i) => (
                      <div key={i} className="group relative bg-card p-8 rounded-2xl border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform scale-150 text-foreground">
                          {feature.icon}
                        </div>
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            // Logged-in User View
            <>
              {activeTab === "home" && (
                <>
                  <Hero
                    onStartShopping={() => setActiveTab("shop")}
                  />
                  {/* ... existing home content ... */}
                  <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
                    <div className="container mx-auto max-w-7xl">
                      <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">{"Why Choose T2?"}</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                          {"We combine Time and Trust to deliver exceptional import services from China to Ethiopia."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-xl mb-3 text-foreground text-center">{"Fast Delivery"}</h3>
                          <p className="text-muted-foreground text-center leading-relaxed">
                            {"Track your shipment in real-time from China to your doorstep. Transparency at every stage."}
                          </p>
                        </div>

                        <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <path d="m9 12 2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-xl mb-3 text-foreground text-center">{"Quality Assured"}</h3>
                          <p className="text-muted-foreground text-center leading-relaxed">
                            {
                              "Secure handling, quality assurance, and reliable delivery. Your business partner you can count on."
                            }
                          </p>
                        </div>

                        <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                          <div className="bg-[#F59E0B]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-xl mb-3 text-foreground text-center">{"Best Prices"}</h3>
                          <p className="text-muted-foreground text-center leading-relaxed">
                            {
                              "Direct sourcing from manufacturers. Competitive rates and transparent pricing on all products."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="py-20 px-4">
                    <div className="container mx-auto max-w-7xl">
                      <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-foreground mb-4">{"Featured Products"}</h2>
                        <p className="text-muted-foreground text-lg">
                          {"Explore our curated selection of quality products from China"}
                        </p>
                      </div>
                      <Storefront products={products.slice(0, 6)} onProductClick={handleProductClick} />
                    </div>
                  </section>
                </>
              )}

              {activeTab === "track" && (
                <div className="py-16 px-4">
                  <div className="container mx-auto max-w-5xl">
                    <TrackingView orders={orders} initialSearchId={searchOrderId} onSearchIdChange={setSearchOrderId} />
                  </div>
                </div>
              )}

              {activeTab === "shop" && (
                <div className="py-16 px-4">
                  <div className="container mx-auto max-w-7xl">
                    <Storefront
                      products={filteredProducts}
                      onProductClick={handleProductClick}
                      categories={categories}
                      selectedCategory={categoryFilter}
                      onCategoryChange={setCategoryFilter}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                    />
                  </div>
                </div>
              )}

              {activeTab === "admin" && isAdmin && (
                <div className="py-16 px-4">
                  <div className="container mx-auto max-w-6xl">
                    <AdminDashboard orders={orders} onStatusUpdate={handleStatusUpdate} user={user} />
                  </div>
                </div>
              )}

              {activeTab === "admin" && !isAdmin && (
                <div className="py-16 px-4">
                  <div className="container mx-auto max-w-2xl text-center">
                    <div className="bg-card border rounded-xl p-12">
                      <h2 className="text-2xl font-bold mb-4">{"Access Denied"}</h2>
                      <p className="text-muted-foreground mb-6">{"You need admin privileges to access this section."}</p>
                      <button
                        onClick={() => setActiveTab("home")}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      >
                        {"Go to Home"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="bg-zinc-950 text-white border-t border-white/10 mt-20">
          <div className="container mx-auto max-w-7xl px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-6">
                <div className="bg-primary text-black font-extrabold text-2xl px-4 py-1.5 rounded-lg inline-block">
                  {"T2"}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {"Titu (T2) is your premier gateway for importing quality goods from China to Ethiopia. Bridging markets with trust and efficiency since 2020."}
                </p>
                <div className="flex gap-4">
                  {[Facebook, Twitter, Instagram, Linkedin, TikTok].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-primary hover:text-black transition-all">
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-6">{"Company"}</h3>
                <ul className="space-y-4 text-sm text-zinc-400">
                  {['About Us', 'Careers', 'Blog', 'Press'].map(item => (
                    <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-6">{"Services"}</h3>
                <ul className="space-y-4 text-sm text-zinc-400">
                  {['Product Sourcing', 'Logistics & Shipping', 'Customs Clearance', 'Warehousing'].map(item => (
                    <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-6">{"Contact"}</h3>
                <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-semibold">Email:</span>
                    <a href="mailto:info@t2.et" className="hover:text-white transition-colors">info@t2.et</a>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-semibold">Phone:</span>
                    <span>+251 911 234 567</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-semibold">Addr:</span>
                    <span>Bole Road, Addis Ababa, Ethiopia</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
              <p>{"© 2025 T2 (Titu). All rights reserved."}</p>
              <div className="flex gap-8">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>

        {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

        {showCart && <ShoppingCart onClose={() => setShowCart(false)} onCheckout={handleCheckout} />}

        {showCheckout && (
          <Checkout
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              clearCart()
              setShowCheckout(false)
              setActiveTab("track")
            }}
          />
        )}

        <ElevenLabsWidget />
      </div>
    </CartContext.Provider>
  )
}
