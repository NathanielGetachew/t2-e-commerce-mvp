"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, ShoppingCart, LogOut, User } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  cartCount?: number
  onCartClick?: () => void
}

export function Header({ activeTab, onTabChange, cartCount = 0, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsAdmin(user?.user_metadata?.is_admin === true)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.user_metadata?.is_admin === true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    onTabChange("home")
  }

  const navItems = [
    { id: "home", label: "Home", visible: true },
    { id: "shop", label: "Shop", visible: true },
    { id: "track", label: "Track Order", visible: true },
    { id: "admin", label: "Admin", visible: isAdmin },
  ].filter((item) => item.visible)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => onTabChange("home")} className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground font-bold text-2xl px-3 py-1.5 rounded-lg group-hover:scale-105 transition-transform shadow-md">
              {"T2"}
            </div>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{"Titu"}</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => {
                  onTabChange(item.id)
                  setMobileMenuOpen(false)
                }}
                className="text-sm font-medium"
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {!isAdmin && (
                  <Button variant="outline" size="icon" className="relative bg-transparent" onClick={onCartClick}>
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        variant="default"
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#F59E0B] hover:bg-[#F59E0B]/90"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                )}

                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </span>
                  {isAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      {"Admin"}
                    </Badge>
                  )}
                </Button>

                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login")}>
                  {"Login"}
                </Button>
                <Button size="sm" onClick={() => router.push("/auth/sign-up")}>
                  {"Sign Up"}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => {
                    onTabChange(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className="justify-start"
                >
                  {item.label}
                </Button>
              ))}
              {user && (
                <Button variant="ghost" onClick={handleSignOut} className="justify-start text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {"Sign Out"}
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
