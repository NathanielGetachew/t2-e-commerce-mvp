"use client"

import { useState, createContext, useContext, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Storefront } from "@/components/storefront"
import { ProductDetails } from "@/components/product-details"
import { TrackingView } from "@/components/tracking-view"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ElevenLabsWidget } from "@/components/elevenlabs-widget"
import { ShoppingCart } from "@/components/shopping-cart"
import { Checkout } from "@/components/checkout"

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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "P001",
    name: "Industrial Sewing Machine",
    price: 45000,
    originalPrice: 52000,
    category: "Machinery",
    image: "/industrial-sewing-machine.png",
    description:
      "High-speed industrial sewing machine perfect for textile manufacturing. Features automatic thread trimmer and adjustable presser foot.",
    specifications: {
      "Max Speed": "5000 SPM",
      "Motor Power": "550W",
      Warranty: "2 Years",
    },
    rating: 4.5,
    reviewCount: 23,
    inStock: true,
    tags: ["Popular", "Textile"],
  },
  {
    id: "P002",
    name: "Lenovo ThinkPad X1",
    price: 85000,
    originalPrice: 95000,
    category: "Electronics",
    image: "/lenovo-thinkpad-laptop.jpg",
    description: "Premium business laptop with Intel i7 processor, 16GB RAM, and 512GB SSD. Perfect for professionals.",
    specifications: {
      Processor: "Intel Core i7",
      RAM: "16GB",
      Storage: "512GB SSD",
      Display: "14-inch FHD",
    },
    rating: 4.8,
    reviewCount: 45,
    inStock: true,
    tags: ["Best Seller", "Professional"],
  },
  {
    id: "P003",
    name: "Solar Inverter 5KW",
    price: 15000,
    category: "Energy",
    image: "/solar-inverter-equipment.jpg",
    description:
      "Pure sine wave solar inverter with MPPT controller. Ideal for residential and commercial applications.",
    specifications: {
      Capacity: "5000W",
      "Input Voltage": "DC 48V",
      Output: "AC 220V",
      Efficiency: "95%",
    },
    rating: 4.3,
    reviewCount: 18,
    inStock: true,
    tags: ["Eco-Friendly"],
  },
  {
    id: "P004",
    name: "Commercial Food Mixer",
    price: 32000,
    category: "Kitchen Equipment",
    image: "/commercial-food-mixer.jpg",
    description: "Heavy-duty commercial food mixer with 20L capacity. Stainless steel construction.",
    specifications: {
      Capacity: "20 Liters",
      Power: "1200W",
      Material: "Stainless Steel",
      Speeds: "6 Variable",
    },
    rating: 4.6,
    reviewCount: 31,
    inStock: true,
    tags: ["Commercial"],
  },
  {
    id: "P005",
    name: "LED Display Screen 4K",
    price: 125000,
    originalPrice: 145000,
    category: "Electronics",
    image: "/led-display-screen-4k.jpg",
    description: "Ultra HD 4K LED display screen, 55-inch, perfect for digital signage and presentations.",
    specifications: {
      Resolution: "3840 x 2160",
      Size: "55 inches",
      Brightness: "500 nits",
      "Refresh Rate": "60Hz",
    },
    rating: 4.7,
    reviewCount: 27,
    inStock: false,
    tags: ["Premium", "4K"],
  },
  {
    id: "P006",
    name: "Hydraulic Press Machine",
    price: 78000,
    category: "Machinery",
    image: "/hydraulic-press-machine.jpg",
    description: "Industrial hydraulic press with 100-ton capacity. Built for heavy-duty metalworking.",
    specifications: {
      Capacity: "100 Tons",
      "Working Area": "600 x 800mm",
      Motor: "7.5KW",
      Control: "Manual/Auto",
    },
    rating: 4.4,
    reviewCount: 15,
    inStock: true,
    tags: ["Industrial"],
  },
  {
    id: "P007",
    name: "Coffee Roasting Machine",
    price: 56000,
    category: "Kitchen Equipment",
    image: "/coffee-roaster.jpg",
    description: "Professional coffee roasting machine with 5kg capacity per batch.",
    specifications: {
      "Batch Size": "5kg",
      "Heat Source": "Gas/Electric",
      "Drum Material": "Stainless Steel",
      "Cooling System": "Air Cooled",
    },
    rating: 4.5,
    reviewCount: 19,
    inStock: true,
    tags: ["Popular", "Coffee"],
  },
  {
    id: "P008",
    name: "CNC Router Machine",
    price: 185000,
    category: "Machinery",
    image: "/cnc-router.jpg",
    description: "3-axis CNC router for woodworking and plastic processing with 1325 work area.",
    specifications: {
      "Work Area": "1300 x 2500mm",
      Spindle: "3.2KW Water Cooled",
      Control: "DSP",
      "Z-Axis Travel": "200mm",
    },
    rating: 4.6,
    reviewCount: 12,
    inStock: true,
    tags: ["Professional", "CNC"],
  },
]

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
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [searchOrderId, setSearchOrderId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

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
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

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

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["all", ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)))]

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
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsAdmin(user?.user_metadata?.is_admin === true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.user_metadata?.is_admin === true)
    })

    return () => subscription.unsubscribe()
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
        />

        <main>
          {activeTab === "home" && (
            <>
              <Hero
                onStartShopping={() => setActiveTab("shop")}
              />

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
                  <Storefront products={MOCK_PRODUCTS.slice(0, 6)} onProductClick={handleProductClick} />
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
                <AdminDashboard orders={orders} onStatusUpdate={handleStatusUpdate} />
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
        </main>

        <footer className="bg-card border-t mt-20">
          <div className="container mx-auto max-w-7xl px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="bg-primary text-primary-foreground font-bold text-2xl px-3 py-1 rounded-md inline-block mb-4">
                  {"T2"}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {"Your trusted partner for importing quality products from China to Ethiopia."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{"Quick Links"}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <button onClick={() => setActiveTab("home")} className="hover:text-primary transition-colors">
                      {"Home"}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab("shop")} className="hover:text-primary transition-colors">
                      {"Shop"}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab("track")} className="hover:text-primary transition-colors">
                      {"Track Order"}
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{"Categories"}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-primary transition-colors">
                      {"Machinery"}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors">
                      {"Electronics"}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors">
                      {"Kitchen Equipment"}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{"Contact"}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{"Email: info@t2.et"}</li>
                  <li>{"Phone: +251 911 234 567"}</li>
                  <li>{"Addis Ababa, Ethiopia"}</li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">{"© 2025 T2 (Titu). All rights reserved."}</p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">
                  {"Privacy Policy"}
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  {"Terms of Service"}
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  {"Contact Us"}
                </a>
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
