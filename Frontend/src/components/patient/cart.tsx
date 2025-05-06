/* eslint-disable @typescript-eslint/no-unused-vars */
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

// Update the type definitions to match your API response
type Medicament = {
<<<<<<< HEAD
  id: number
=======
  id: number // This is the key change - API returns 'id', not 'medicament_id'
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
  name: string
  price: number
}

type CartResponse = {
  id: number
  patient_id: number
  total_price: number
<<<<<<< HEAD
  is_paid: boolean
=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
  medicaments: Medicament[]
}

// This is for our internal state management
type CartItem = {
  id: number
  name: string
  description?: string
  dosage?: string
  quantity: number
  price: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
<<<<<<< HEAD
  const [cartId, setCartId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalPrice, setTotalPrice] = useState(0)
  const [patientId, setPatientId] = useState<number | null>(null)
  const router = useRouter()

  // Update the processCartData function to handle missing cart items endpoint
  const processCartData = (cartData: CartResponse) => {
    setTotalPrice(cartData.total_price)

    // Get the quantities from a separate endpoint
    fetch(`http://localhost:8000/cart/${cartData.id}/items`)
      .then((response) => {
        if (response.ok) return response.json()
        // If the endpoint doesn't exist yet, just use default quantities of 1
        if (response.status === 404) {
          console.warn("Cart items endpoint not found, using default quantities")
          return cartData.medicaments.map((med) => ({ medicament_id: med.id, quantity: 1 }))
        }
        throw new Error(`Failed to fetch cart items: ${response.status}`)
      })
      .then((cartItemsData) => {
        // Transform the medicaments into CartItem format with proper ID mapping
        const cartItems: CartItem[] = cartData.medicaments.map((med) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cartItem = cartItemsData.find((item: any) => item.medicament_id === med.id)
          const quantity = cartItem ? cartItem.quantity : 1

          return {
            id: med.id,
            name: med.name,
            price: med.price,
            quantity: quantity,
            description: "", // These fields would need to come from the API
            dosage: "",
          }
        })

        setCart(cartItems)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching cart items:", error)
        // Fallback: just use the medicaments without quantities
        const cartItems: CartItem[] = cartData.medicaments.map((med) => {
          return {
            id: med.id,
            name: med.name,
            price: med.price,
            quantity: 1,
            description: "",
            dosage: "",
          }
        })

        setCart(cartItems)
        setLoading(false)
      })
  }

  // Define getOrCreateActiveCart function next
  const getOrCreateActiveCart = async () => {
    if (!patientId) return

    try {
      // Try to get an active (unpaid) cart for this patient
      const response = await fetch(`http://localhost:8000/cart/active/${patientId}`)

      if (response.ok) {
        // Found an active cart
        const cartData: CartResponse = await response.json()
        setCartId(cartData.id)
        localStorage.setItem("activeCartId", cartData.id.toString())
        processCartData(cartData)
      } else if (response.status === 404) {
        // No active cart found, create a new one
        const createResponse = await fetch(`http://localhost:8000/cart/add/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [] }),
        })

        if (createResponse.ok) {
          const newCartData: CartResponse = await createResponse.json()
          setCartId(newCartData.id)
          localStorage.setItem("activeCartId", newCartData.id.toString())
          setCart([])
          setTotalPrice(0)
          setLoading(false)
        } else {
          throw new Error("Failed to create a new cart")
        }
      } else {
        throw new Error("Failed to get active cart")
      }
    } catch (error) {
      console.error("Error getting/creating active cart:", error)
      setLoading(false)
    }
  }

  // Now define fetchActiveCart which uses the above functions
  const fetchActiveCart = async () => {
    try {
      setLoading(true)

      // First check if we have a stored active cart ID
      const storedCartId = localStorage.getItem("activeCartId")

      if (storedCartId) {
        // Verify this cart exists and is not paid
        try {
          const response = await fetch(`http://localhost:8000/cart/${storedCartId}`)

          if (response.ok) {
            const cartData: CartResponse = await response.json()

            // If the cart is paid, we need a new one
            if (cartData.is_paid) {
              await getOrCreateActiveCart()
            } else {
              // Cart exists and is not paid, use it
              setCartId(Number.parseInt(storedCartId))
              processCartData(cartData)
            }
          } else {
            // Cart doesn't exist, get or create a new one
            await getOrCreateActiveCart()
          }
        } catch (error) {
          console.error("Error checking stored cart:", error)
          await getOrCreateActiveCart()
        }
      } else {
        // No stored cart ID, get or create a new one
        await getOrCreateActiveCart()
      }
    } catch (error) {
      console.error("Error fetching active cart:", error)
=======
  const [cartId, setCartId] = useState<number>(1) // Default to 1, can be changed later
  const [loading, setLoading] = useState(true)
  const [totalPrice, setTotalPrice] = useState(0)
  const router = useRouter()

  // Replace the fetchCart function with this improved version
  const fetchCart = async () => {
    try {
      setLoading(true)
      // In a real app, you would get the cart ID from user session or context
      const res = await fetch(`http://localhost:8000/cart/${cartId}`)

      if (!res.ok) {
        if (res.status === 404) {
          // Cart not found is not an error, just an empty cart
          setCart([])
          setTotalPrice(0)
          return
        }
        throw new Error("Failed to fetch cart")
      }

      const data: CartResponse = await res.json()
      setTotalPrice(data.total_price)

      // Get the quantities from a separate endpoint
      const itemsRes = await fetch(`http://localhost:8000/cart/${cartId}/items`)
      let quantities: Record<number, number> = {}

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        // Create a map of medicament_id to quantity
        quantities = itemsData.reduce((acc: Record<number, number>, item: any) => {
          acc[item.medicament_id] = item.quantity
          return acc
        }, {})
      }

      // Transform the medicaments into CartItem format with proper ID mapping
      const cartItems: CartItem[] = data.medicaments.map((med) => {
        return {
          id: med.id,
          name: med.name,
          price: med.price,
          quantity: quantities[med.id] || 1, // Use quantity from map or default to 1
          description: "", // These fields would need to come from the API
          dosage: "",
        }
      })

      setCart(cartItems)
      console.log("Cart data loaded:", cartItems)
    } catch (error) {
      console.error("Error fetching cart:", error)
      alert("Failed to load cart")
    } finally {
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get patient ID from localStorage
    const storedPatientData = localStorage.getItem("patientData")
    if (storedPatientData) {
      try {
        const parsedData = JSON.parse(storedPatientData)
        if (parsedData.patient_id) {
          setPatientId(parsedData.patient_id)
        }
      } catch (error) {
        console.error("Error parsing patient data:", error)
      }
    }
  }, [])

<<<<<<< HEAD
  // Fetch active cart when component mounts
  useEffect(() => {
    if (patientId) {
      fetchActiveCart()
    }
  }, [patientId])

=======
  // Replace the updateQuantity function with this improved version
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return

    // Validate id is a valid number
    if (typeof id !== "number" || isNaN(id)) {
      console.error("Invalid medicament ID:", id)
      alert("Error: Invalid medicament ID")
      return
    }

    try {
<<<<<<< HEAD
      console.log(`Updating quantity for item ${id} to ${quantity}`)

      // Update local state optimistically first for better UX
      setCart((prevCart) => {
        const updatedCart = prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
        console.log("Updated cart:", updatedCart)
        return updatedCart
      })
=======
      // Update local state optimistically first for better UX
      setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity } : item)))
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57

      // Recalculate total price
      const newTotal = cart.reduce((total, item) => {
        return total + item.price * (item.id === id ? quantity : item.quantity)
      }, 0)
      setTotalPrice(newTotal)

      // Get all current items to send in the update
      const allItems = cart.map((item) => {
        return {
          medicament_id: item.id,
          quantity: item.id === id ? quantity : item.quantity,
        }
      })

<<<<<<< HEAD
      if (!cartId) {
        throw new Error("Cart ID not found")
      }

=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
      const response = await fetch(`http://localhost:8000/cart/update/${cartId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: allItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to update cart")
      }

<<<<<<< HEAD
      // Instead of immediately refetching, wait a moment to avoid race conditions
      setTimeout(() => {
        fetchActiveCart()
      }, 300)
=======
      // Refresh cart to ensure we have the latest data
      fetchCart()
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    } catch (error) {
      console.error("Error updating cart:", error)
      alert("Failed to update cart")
      // Revert optimistic update by refetching
<<<<<<< HEAD
      fetchActiveCart()
=======
      fetchCart()
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    }
  }

  const removeItem = async (id: number) => {
    // Validate id is a valid number
    if (typeof id !== "number" || isNaN(id)) {
      console.error("Invalid medicament ID:", id)
      alert("Error: Invalid medicament ID")
      return
    }

<<<<<<< HEAD
    if (!cartId) {
      console.error("Cart ID not found")
      alert("Error: Cart ID not found")
      return
    }

=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    try {
      const response = await fetch(`http://localhost:8000/cart/delete/${cartId}/item/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove item from cart")
      }

      // Update local state optimistically
      const removedItem = cart.find((item) => item.id === id)
      if (removedItem) {
        const removedItemPrice = removedItem.price * removedItem.quantity
        setTotalPrice((prev) => Math.max(prev - removedItemPrice, 0))
      }

      setCart((prevCart) => prevCart.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error removing item from cart:", error)
      alert("Failed to remove item from cart")
      // Revert optimistic update
<<<<<<< HEAD
      fetchActiveCart()
=======
      fetchCart()
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    }
  }

  const deleteCart = async () => {
<<<<<<< HEAD
    if (!cartId) {
      console.error("Cart ID not found")
      alert("Error: Cart ID not found")
      return
    }

=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    try {
      const response = await fetch(`http://localhost:8000/cart/deleteCart/${cartId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete cart")
      }

      setCart([])
      setTotalPrice(0)
<<<<<<< HEAD
      localStorage.removeItem("activeCartId")

      // Create a new cart
      if (patientId) {
        getOrCreateActiveCart()
      }
=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    } catch (error) {
      console.error("Error deleting cart:", error)
      alert("Failed to delete cart")
    }
  }

  const calculateItemSubtotal = (item: CartItem) => {
    return item.price * item.quantity
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const formatPrice = (price: number) => {
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
                {/* Fix: Don't put Skeleton inside p tag */}
                <div className="text-neutral-500">
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${calculateTotalItems()} item${calculateTotalItems() !== 1 ? "s" : ""} in your cart`
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/patient/medicaments")}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
              {!loading && cart.length > 0 && (
                <Button
                  onClick={() => {
<<<<<<< HEAD
                    if (cartId) {
                      router.push(`/patient/payment?total=${totalPrice.toFixed(2)}&cartId=${cartId}`)
                    }
=======
                    router.push(`/patient/payment?total=${totalPrice.toFixed(2)}`)
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
                        Looks like you haven&apos;t added any medications to your cart yet.
                      </p>
                      <Button
                        onClick={() => router.push("/patient/medicaments")}
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
                        key={item.id}
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
                                      updateQuantity(item.id, item.quantity - 1)
                                    } else {
                                      removeItem(item.id)
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
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                                  onClick={() => removeItem(item.id)}
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
                              <span className="text-xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white"
                          onClick={() => {
<<<<<<< HEAD
                            if (cartId) {
                              router.push(`/patient/payment?total=${totalPrice.toFixed(2)}&cartId=${cartId}`)
                            }
=======
                            router.push(`/patient/payment?total=${totalPrice.toFixed(2)}`)
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
