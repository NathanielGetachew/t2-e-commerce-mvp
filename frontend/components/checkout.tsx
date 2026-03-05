"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, CheckCircle } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"

import { recordCommission } from "@/app/actions/affiliate-actions"

interface CheckoutProps {
  onClose: () => void
  onSuccess: () => void
}

export function Checkout({ onClose, onSuccess }: CheckoutProps) {
  const { cart, totalPrice, couponCode } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "Addis Ababa",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const payload = {
        cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city
        },
        couponCode: couponCode || undefined
      }

      console.log("[v0] Submitting order payload:", payload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real app, you'd ensure the user's JWT is passed automatically via cookies
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.message || 'Failed to initialize payment');
      }

      console.log("[v0] Checkout URL received:", result.data.checkoutUrl)

      // Record commission if referral code is present 
      // Note: Ideal architectural place for this is the backend webhook, but keeping it here for MVP parity.
      if (couponCode) {
        await recordCommission(couponCode, totalPrice)
      }

      // Redirect user to Chapa
      window.location.href = result.data.checkoutUrl;

    } catch (error: any) {
      console.error("Payment initialization error:", error);
      alert(`Payment failed: ${error.message}`);
      setIsProcessing(false);
    }
  }

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{"Payment Successful!"}</h2>
            <p className="text-muted-foreground mb-6">
              {"Your order has been placed successfully. You'll receive a confirmation email shortly."}
            </p>
            <Button onClick={onSuccess} size="lg">
              {"Track My Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-4xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{"Checkout"}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{"Complete your order securely with Chapa"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{"Customer Information"}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">{"First Name"}</label>
                        <Input
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Abebe"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">{"Last Name"}</label>
                        <Input
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Kebede"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{"Email"}</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="abebe@email.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{"Phone Number"}</label>
                      <Input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0911234567"
                        pattern="[0-9]{10}"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{"Format: 09xxxxxxxx or 07xxxxxxxx"}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{"Delivery Address"}</label>
                      <Input
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Bole, Addis Ababa"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{"City"}</label>
                      <Input
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>

                    <div className="pt-4">
                      <div className="bg-muted/50 rounded-lg p-4 mb-4 flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-[#F59E0B] mt-0.5" />
                        <div>
                          <p className="font-medium text-sm mb-1">{"Secure Payment with Chapa"}</p>
                          <p className="text-xs text-muted-foreground">
                            {"You'll be redirected to Chapa's secure payment page to complete your transaction."}
                          </p>
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                        {isProcessing ? "Processing..." : `Pay ${totalPrice.toLocaleString()} ETB with Chapa`}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{"Order Summary"}</h3>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {"Qty: "}
                          {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {(item.product.price * item.quantity).toLocaleString()} {"ETB"}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{"Subtotal"}</span>
                      <span>
                        {totalPrice.toLocaleString()} {"ETB"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{"Shipping"}</span>
                      <span>{"Calculated after purchase"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{"Import Duty"}</span>
                      <span>{"Included"}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>{"Total"}</span>
                      <span className="text-primary">
                        {totalPrice.toLocaleString()} {"ETB"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-sm mb-2">{"What happens next?"}</h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          {"1"}
                        </Badge>
                        <span>{"Complete payment securely through Chapa"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          {"2"}
                        </Badge>
                        <span>{"We'll source your products from China"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          {"3"}
                        </Badge>
                        <span>{"Track your shipment in real-time"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          {"4"}
                        </Badge>
                        <span>{"Receive your order at your doorstep"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
