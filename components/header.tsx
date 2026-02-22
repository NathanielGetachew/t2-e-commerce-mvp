"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, ShoppingCart, LogOut, User as UserIcon, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { User } from "@/app/auth/actions"
import { cn } from "@/lib/utils"
import { useCart } from "@/components/providers/cart-provider"

interface HeaderProps {
  cartCount?: number // Keeping for backwards compatibility, but will use context primarily
  onCartClick?: () => void
  user: User | null
  isAdmin: boolean
}

export function Header({ cartCount: propCartCount, onCartClick, user, isAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Conditionally use cart context if we're inside a provider
  let contextCartCount = 0;
  try {
    const cart = useCart();
    contextCartCount = cart.totalItems;
  } catch (e) {
    // Ignore error if used outside CartProvider (e.g., admin pages without provider)
  }

  const displayCartCount = contextCartCount > 0 ? contextCartCount : propCartCount || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: "Home", visible: true },
    { href: "/shop", label: "Shop", visible: !isAdmin },
    { href: "/track", label: "Track Order", visible: !isAdmin },
    { href: "/admin/dashboard", label: "Admin", visible: isAdmin },
  ].filter((item) => item.visible)

  const isHome = pathname === "/"
  const useTransparentHomeStyle = isHome && !isScrolled && !!user

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        (isScrolled || !isHome || !useTransparentHomeStyle) ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className={cn(
              "font-bold text-2xl px-3 py-1.5 rounded-lg group-hover:scale-105 transition-transform shadow-md",
              (isScrolled || !isHome || !useTransparentHomeStyle) ? "bg-primary text-primary-foreground" : "bg-white text-black"
            )}>
              {"T2"}
            </div>
            <span className={cn(
              "text-sm font-medium hidden sm:inline",
              (isScrolled || !isHome || !useTransparentHomeStyle) ? "text-muted-foreground" : "text-white/90"
            )}>{"Titu"}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "text-sm font-medium hover:text-primary hover:bg-primary/10",
                    pathname === item.href && ((isScrolled || !isHome || !useTransparentHomeStyle) ? "bg-primary/10 text-primary" : "bg-white/20 text-white"),
                    !(isScrolled || !isHome || !useTransparentHomeStyle) && pathname !== item.href && "text-white hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <UserNav
                user={user}
                isAdmin={isAdmin}
                cartCount={displayCartCount}
                onCartClick={onCartClick}
              />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className={cn(useTransparentHomeStyle ? "text-white hover:text-white hover:bg-white/10" : "")}
                    size="sm"
                  >
                    {"Login"}
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button
                    size="sm"
                    className={cn(useTransparentHomeStyle ? "bg-white text-black hover:bg-white/90" : "")}
                  >
                    {"Sign Up"}
                  </Button>
                </Link>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={cn("md:hidden", useTransparentHomeStyle ? "text-white" : "")}
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
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    className="justify-start w-full"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              {user && (
                <MobileUserNav
                  user={user}
                  isAdmin={isAdmin}
                  onMenuClose={() => setMobileMenuOpen(false)}
                />
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

/**
 * Sign out helper — calls Server Action
 */
import { signOut } from "@/app/auth/actions"

async function performSignOut() {
  await signOut()
  window.location.href = '/auth/login'
}

function UserNav({ user, isAdmin, cartCount, onCartClick }: {
  user: User,
  isAdmin: boolean,
  cartCount: number,
  onCartClick?: () => void,
}) {
  return (
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
        <UserIcon className="h-4 w-4" />
        <span className="text-sm">
          {user.fullName || user.email?.split("@")[0] || "User"}
        </span>
        {isAdmin && (
          <Badge variant="secondary" className="text-xs">
            {"Admin"}
          </Badge>
        )}
      </Button>

      {!isAdmin && (
        <Link href="/dashboard/ambassador">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary"
            title="Be an Ambassador"
          >
            <Users className="h-4 w-4" />
            <span>Be an Ambassador</span>
          </Button>
        </Link>
      )}

      <Button variant="ghost" size="icon" onClick={performSignOut} title="Sign Out">
        <LogOut className="h-5 w-5" />
      </Button>
    </>
  )
}

function MobileUserNav({ user, isAdmin, onMenuClose }: {
  user: User,
  isAdmin: boolean,
  onMenuClose: () => void,
}) {
  return (
    <>
      {!isAdmin && (
        <Link href="/dashboard/ambassador" onClick={onMenuClose}>
          <Button variant="ghost" className="justify-start w-full">
            <Users className="mr-2 h-4 w-4" />
            Be an Ambassador
          </Button>
        </Link>
      )}
      <Button
        variant="ghost"
        onClick={() => {
          onMenuClose()
          performSignOut()
        }}
        className="justify-start text-red-600 w-full"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {"Sign Out"}
      </Button>
    </>
  )
}
