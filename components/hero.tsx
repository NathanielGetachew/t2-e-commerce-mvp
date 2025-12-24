import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Clock, ShoppingCart, Plane, Package } from "lucide-react"
import { useState, useEffect } from "react"

interface HeroProps {
  onStartShopping: () => void
}

function FlippingBadge() {
  const [index, setIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  const messages = [
    { icon: <ShoppingCart className="w-5 h-5" />, text: "Seamless E-Commerce" },
    { icon: <Plane className="w-5 h-5" />, text: "China to Ethiopia" },
    { icon: <Package className="w-5 h-5" />, text: "Fast Delivery" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length)
        setIsFlipping(false)
      }, 300) // Half of the transition time to switch content while invisible/flipping
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary text-base sm:text-lg font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm border border-primary/20">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
      </span>
      <div className="relative h-7 w-64 sm:w-72 overflow-hidden flex items-center justify-start"> {/* Increased width further for mobile text */}
        <div
          className={`flex items-center gap-2.5 transition-all duration-500 transform ${isFlipping ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          {messages[index].icon}
          <span className="whitespace-nowrap">{messages[index].text}</span>
        </div>
      </div>
    </div>
  )
}

export function Hero({ onStartShopping }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-20 lg:pt-28 pb-16 md:pb-24 border-b">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-30">
        <div className="absolute top-20 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 flex flex-col items-center text-center">

        <FlippingBadge />

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 text-balance max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Where <span className="text-primary">Time</span> Meets <span className="text-primary">Trust</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl text-pretty leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Experience the T2 standard. Fast, reliable, and transparent import services designed for your peace of mind.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Button size="lg" onClick={onStartShopping} className="h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            Start Shopping <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg gap-2">
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 md:mt-28 w-full max-w-4xl border-t pt-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">Optimized logistics for speed</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Trusted Service</h3>
              <p className="text-sm text-muted-foreground">Secure handling & payments</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <span className="font-bold text-xl">T2</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">The T2 Promise</h3>
              <p className="text-sm text-muted-foreground">Reliability you can count on</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
