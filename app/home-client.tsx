"use client"

import { useState, createContext, useContext, useEffect, Suspense } from "react"
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
import { ReferralTracker } from "@/components/referral-tracker"
import { Facebook, Twitter, Instagram, Linkedin, Search, ShoppingBag } from "lucide-react"
import { getUser } from "@/app/auth/actions"
import type { User } from "@/app/auth/actions"
import { useCart } from "@/components/providers/cart-provider"
import type { Product } from "@/app/actions/product-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"


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

// CartContext and useCart removed - using global provider

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

import { useSearchParams } from "next/navigation"

// ... imports

export default function HomeClient() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "home"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Sync state with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  // const supabase = createClient() // Removed
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [searchOrderId, setSearchOrderId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // UI State that belongs in Page, not CartProvider
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { totalItems, clearCart } = useCart()

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
    if (!user) {
      // Redirect to login if user is not authenticated
      // We can pass a redirect param to handle returning after login
      window.location.href = "/auth/login?redirect=/"
      return
    }
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

  // Derive categories from products
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]

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
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>
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
            <section className="bg-background pt-24 pb-8 space-y-6">
              {/* Amazon Style Search Bar & Header */}
              <div className="container mx-auto max-w-7xl px-4">
                <div className="bg-primary/5 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-primary/10">
                  <div className="flex-1 w-full">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500 mb-2">T2 Marketplace</h1>
                    <div className="relative flex w-full max-w-3xl items-center">
                      <Input
                        className="pr-12 h-12 text-lg border-primary/20 focus-visible:ring-primary/30"
                        placeholder="Search for products, bulk items, machinery..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          if (e.target.value) setActiveTab("shop")
                        }}
                      />
                      <Button size="icon" className="absolute right-0 h-12 w-12 rounded-l-none" onClick={() => setActiveTab("shop")}>
                        <Search className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg border">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span>Bulk Pricing Available</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg border">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span>Direct from China</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Quick Links */}
              <div className="container mx-auto max-w-7xl px-4 overflow-x-auto pb-2">
                <div className="flex gap-4">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={categoryFilter === cat ? "default" : "outline"}
                      onClick={() => {
                        setCategoryFilter(cat)
                        setActiveTab("shop")
                      }}
                      className="whitespace-nowrap rounded-full"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Hero Product Showcase (Immediate Action) */}
              <div className="container mx-auto max-w-7xl px-4">
                <h2 className="text-xl font-bold mb-4">Trending Now</h2>
                <Storefront products={filteredProducts.slice(0, 4)} onProductClick={handleProductClick} />
                <div className="mt-6 text-center">
                  <Button variant="link" onClick={() => setActiveTab("shop")}>View All Products &rarr;</Button>
                </div>
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
              <div className="py-24 px-4">
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
              <div className="pt-28 pb-16 px-4">
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

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          user={user}
          onBuyNow={() => {
            setSelectedProduct(null)
            handleCheckout()
          }}
        />
      )}

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
  )
}
