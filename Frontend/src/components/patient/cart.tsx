"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { ShoppingCart, Minus, Plus, ArrowLeft, ShoppingBag, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type CartItem = {
  medicament_id: number
  name: string
  description?: string
  dosage?: string
  quantity: number
  price?: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchCart = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:8000/cart")
      if (!res.ok) {
        throw new Error("Failed to fetch cart")
      }
      const data = await res.json()
      setCart(data)
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const updateQuantity = async (medicament_id: number, quantity: number) => {
    if (quantity < 0) return

    try {
      const response = await fetch("http://localhost:8000/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicament_id, quantity }),
      })

      if (!response.ok) {
        throw new Error("Failed to update cart")
      }

      fetchCart()
    } catch (error) {
      console.error("Error updating cart:", error)
      alert("Failed to update cart")
    }
  }

  const removeItem = async (medicament_id: number) => {
    try {
      const response = await fetch("http://localhost:8000/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicament_id }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item from cart")
      }

      fetchCart()
    } catch (error) {
      console.error("Error removing item from cart:", error)
      alert("Failed to remove item from cart")
    }
  }

  const calculateItemSubtotal = (item: CartItem) => {
    const price = item.price || 0
    return price * item.quantity
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.price || 0
      return total + price * item.quantity
    }, 0)
  }

  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A"
    return `${price.toFixed(2)} DT`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      <Header />

      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-12 left-1/3 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Your Shopping Cart</h1>
            <p className="text-primary-100 max-w-2xl mx-auto text-lg">
              Review your selected medications and proceed to checkout
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Cart Summary Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10 -mt-12 border border-primary-100 relative z-20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-primary-100 p-3 rounded-full mr-4">
                <ShoppingCart className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-800">Shopping Cart</h2>
                <p className="text-neutral-500">
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${calculateTotalItems()} item${calculateTotalItems() !== 1 ? "s" : ""} in your cart`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
              {!loading && cart.length > 0 && (
                <Button
                  onClick={() => {
                    const total = calculateTotal()
                    router.push(`/patient/payment?total=${total.toFixed(2)}`)
                  }}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Card key={index} className="overflow-hidden border border-primary-100">
                    <CardContent className="p-0">
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-6 w-1/6" />
                        </div>
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex justify-between items-center pt-4">
                          <Skeleton className="h-10 w-28" />
                          <Skeleton className="h-6 w-1/6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {cart.length === 0 ? (
                  <Card className="border border-primary-100 overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                      <div className="bg-primary-50 p-6 rounded-full mb-6">
                        <ShoppingCart className="h-12 w-12 text-primary-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-neutral-800 mb-2">Your cart is empty</h3>
                      <p className="text-neutral-500 text-center max-w-md mb-6">
                        Looks like you haven t added any medications to your cart yet.
                      </p>
                      <Button
                        onClick={() => window.history.back()}
                        className="bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        Browse Medications
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card
                        key={item.medicament_id}
                        className="overflow-hidden border border-primary-100 hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-0">
                          <div className="p-5">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="text-xl font-semibold text-neutral-800">{item.name}</h3>
                                {item.dosage && (
                                  <Badge className="bg-primary-100 text-primary-700 hover:bg-primary-200 font-normal">
                                    {item.dosage}
                                  </Badge>
                                )}
                                <p className="text-sm text-neutral-600 mt-2">
                                  {item.description || "No description available"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-primary-600">{formatPrice(item.price)}</p>
                                <p className="text-sm text-neutral-500">per unit</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-primary-100">
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full border-primary-200"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(item.medicament_id, item.quantity - 1)
                                    } else {
                                      removeItem(item.medicament_id)
                                    }
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-10 text-center font-medium text-neutral-800">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full border-primary-200"
                                  onClick={() => updateQuantity(item.medicament_id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex items-center space-x-4">
                                <p className="font-semibold text-lg text-neutral-800">
                                  {formatPrice(calculateItemSubtotal(item))}
                                </p>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => removeItem(item.medicament_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            <Card className="border border-primary-100 sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-800 mb-6">Order Summary</h3>

                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="pt-4 mt-4 border-t border-primary-100">
                      <Skeleton className="h-6 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full mt-6" />
                  </div>
                ) : (
                  <>
                    {cart.length === 0 ? (
                      <div className="bg-neutral-50 rounded-lg p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-neutral-400 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-neutral-600">Add items to your cart to see the order summary.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between text-neutral-600">
                            <span>Subtotal ({calculateTotalItems()} items)</span>
                            <span>{formatPrice(calculateTotal())}</span>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>Shipping</span>
                            <span className="text-primary-600">Free</span>
                          </div>

                          <div className="pt-4 mt-2 border-t border-primary-100">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-neutral-800">Total</span>
                              <span className="text-xl font-bold text-primary-600">
                                {formatPrice(calculateTotal())}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white"
                          onClick={() => {
                            const total = calculateTotal()
                            router.push(`/patient/payment?total=${total.toFixed(2)}`)
                          }}
                        >
                          Proceed to Checkout
                        </Button>

                        <div className="mt-6 bg-primary-50 rounded-lg p-4">
                          <h4 className="font-medium text-primary-700 mb-2">Secure Checkout</h4>
                          <p className="text-sm text-primary-600">
                            Your payment information is processed securely. We do not store credit card details.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
