"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // ✅ Import useRouter
import Header from "@/components/patient/header"
import Footer from "@/components/footer"

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
  const router = useRouter() // ✅ Initialize useRouter

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
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Your Cart</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">🛒 Your Cart</h1>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DD4BF]"></div>
                </div>
              ) : (
                <>
                  {cart.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-6xl mb-4">🛒</div>
                      <p className="text-xl text-gray-600">Your cart is empty</p>
                      <button
                        onClick={() => window.history.back()}
                        className="mt-6 inline-flex items-center rounded-md bg-[#2DD4BF] px-6 py-2 text-sm font-medium text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Cart header */}
                      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-center">Price</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-center">Subtotal</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Cart items */}
                      <ul className="space-y-4">
                        {cart.map((item) => (
                          <li
                            key={item.medicament_id}
                            className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow p-4"
                          >
                            <div className="grid md:grid-cols-12 gap-4 items-center">
                              {/* Product info */}
                              <div className="md:col-span-5">
                                <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                                <p className="text-sm text-[#2DD4BF] font-medium">{item.dosage}</p>
                                <p className="mt-2 text-sm text-gray-600 md:hidden">{formatPrice(item.price)} each</p>
                                <p className="mt-2 text-sm text-gray-600">
                                  {item.description || "No description available"}
                                </p>
                              </div>

                              {/* Price */}
                              <div className="md:col-span-2 text-center hidden md:block">
                                <p className="font-medium">{formatPrice(item.price)}</p>
                              </div>

                              {/* Quantity controls */}
                              <div className="md:col-span-2 flex items-center justify-center space-x-3">
                                <button
                                  className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(item.medicament_id, item.quantity - 1)
                                    } else {
                                      removeItem(item.medicament_id)
                                    }
                                  }}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  onClick={() => updateQuantity(item.medicament_id, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="md:col-span-2 text-center">
                                <p className="font-bold text-[#2DD4BF]">{formatPrice(calculateItemSubtotal(item))}</p>
                              </div>

                              {/* Remove button */}
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => removeItem(item.medicament_id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Order summary */}
                      <div className="mt-8 border-t pt-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium">{formatPrice(calculateTotal())}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Total Items</span>
                              <span className="font-medium">{calculateTotalItems()}</span>
                            </div>
                            <div className="border-t border-gray-200 my-2 pt-2"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">Total</span>
                              <span className="text-lg font-bold text-[#2DD4BF]">{formatPrice(calculateTotal())}</span>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3">
                            <button
                              disabled={cart.length === 0}
                              onClick={() => {
                                const total = calculateTotal()
                                router.push(`/patient/payment?total=${total.toFixed(2)}`) // ✅ Redirect with total
                              }}
                              className={`w-full rounded-md px-6 py-2 text-sm font-medium text-white ${
                                cart.length === 0
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-[#2DD4BF] hover:bg-[#20B8A2] focus:ring-[#2DD4BF]"
                              }`}
                            >
                              Proceed to Checkout
                            </button>
                            <button
                              onClick={() => window.history.back()}
                              className="w-full rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
