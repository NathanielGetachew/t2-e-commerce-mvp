"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, ShoppingCart, LogOut, User as UserIcon, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { User } from "@/app/auth/actions"
import { cn } from "@/lib/utils"

interface HeaderProps {
  cartCount?: number
  onCartClick?: () => void
  user: User | null
  isAdmin: boolean
}

export function Header({ cartCount = 0, onCartClick, user, isAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: "Home", visible: true },
    { href: "/shop", label: "Shop", visible: true },
    { href: "/track", label: "Track Order", visible: true },
    { href: "/admin", label: "Admin", visible: isAdmin },
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
              <MockUserNav
                user={user}
                isAdmin={isAdmin}
                cartCount={cartCount}
                onCartClick={onCartClick}
                signOutCallback={() => setMobileMenuOpen(false)}
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
              {user && <MockMobileUserNav user={user} onSignOut={() => setMobileMenuOpen(false)} />}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

function MockUserNav({ user, isAdmin, cartCount, onCartClick, signOutCallback }: {
  user: User,
  isAdmin: boolean,
  cartCount: number,
  onCartClick?: () => void,
  signOutCallback?: () => void
}) {
  const router = useRouter()

  const handleSignOut = async () => {
    // Call server action to clear cookie
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => { })
    // Also clear via client side js-cookie if needed, but simple refresh/redirect should work if server action clears it.
    // But we can't call server action from here easily without importing. 
    // For now, let's just assume we redirect to a logout route or just refresh.
    // Actually, we can use the signOut action we created if it's imported? 
    // actions are server actions, so yes.
    // But let's keep it simple: redirect to homepage and refresh.
    // For a proper fix, we should import signOut from actions.

    // Since we can't easily import server action here without 'use server' context or passing it down
    // Let's try to just redirect to homepage.
    // Wait, we need to clear the cookie.
    // Let's implement a quick client-side cookie clear for 'mock-session'
    document.cookie = "mock-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    if (signOutCallback) signOutCallback()
    router.push("/")
    router.refresh()
  }

  return (
    <UserNavContent
      user={user}
      isAdmin={isAdmin}
      cartCount={cartCount}
      onCartClick={onCartClick}
      onSignOut={handleSignOut}
    />
  )
}

function UserNavContent({ user, isAdmin, cartCount, onCartClick, onSignOut }: {
  user: User,
  isAdmin: boolean,
  cartCount: number,
  onCartClick?: () => void,
  onSignOut: () => void
}) {
  const router = useRouter()
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

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/ambassador")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary"
        title="Be an Ambassador"
      >
        <Users className="h-4 w-4" />
        <span>Be an Ambassador</span>
      </Button>

      <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign Out">
        <LogOut className="h-5 w-5" />
      </Button>
    </>
  )
}

function MobileUserNavContent({ user, onSignOut, onMenuClose }: { user: User, onSignOut: () => void, onMenuClose: () => void }) {
  const router = useRouter()

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          router.push("/dashboard/ambassador")
          onMenuClose()
        }}
        className="justify-start"
      >
        <Users className="mr-2 h-4 w-4" />
        Be an Ambassador
      </Button>
      <Button variant="ghost" onClick={onSignOut} className="justify-start text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        {"Sign Out"}
      </Button>
    </>
  )
}

function ClerkMobileUserNav({ user, onSignOut }: { user: User, onSignOut: () => void }) {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
    router.push("/")
  }

  return <MobileUserNavContent user={user} onSignOut={handleSignOut} onMenuClose={onSignOut} />
}

function MockMobileUserNav({ user, onSignOut }: { user: User, onSignOut: () => void }) {
  const router = useRouter()

  const handleSignOut = async () => {
    document.cookie = "mock-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    onSignOut()
    router.push("/")
    router.refresh()
  }

  return <MobileUserNavContent user={user} onSignOut={handleSignOut} onMenuClose={onSignOut} />
}
