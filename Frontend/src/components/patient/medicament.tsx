"use client"

import { useEffect, useState } from "react"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Check, ShoppingCart, X, Search, Filter, Pill, AlertCircle, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

type Medicament = {
  id: number
  name: string
  description?: string
  dosage?: string
  price?: number
  stock?: number
  image?: string
  legal?: boolean
}

type CartItem = {
  medicament_id: number
  quantity: number
}

type CartResponse = {
  id: number
  patient_id: number
  total_price: number
  is_paid: boolean
  medicaments: Array<{
    id: number
    name: string
    price: number
  }>
}

type Notification = {
  id: string
  message: string
  type: "success" | "error"
}

export default function MedicamentsPage() {
  const [patientId, setPatientId] = useState<number | null>(null)
  const [activeCartId, setActiveCartId] = useState<number | null>(null)
  const [medicaments, setMedicaments] = useState<Medicament[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [updatingQuantity, setUpdatingQuantity] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDosage, setSelectedDosage] = useState("")
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Backend URL for image paths
  const BACKEND_URL = "http://localhost:8000"

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 3000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Improved image URL handling similar to doctor list
  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return "/placeholder.svg?height=300&width=500"

    try {
      if (imagePath.startsWith("http")) return imagePath
      const formattedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
      return `${BACKEND_URL}${formattedPath}`
    } catch (error) {
      console.error("Error formatting image URL:", error)
      return "/placeholder.svg?height=300&width=500"
    }
  }

  useEffect(() => {
    const storedPatientData = localStorage.getItem("patientData")

    if (storedPatientData) {
      const parsedData = JSON.parse(storedPatientData)
      if (parsedData.patient_id) {
        setPatientId(parsedData.patient_id)
      }
    }
  }, [])

  // Initialize selected quantities when medicaments load
  useEffect(() => {
    const initialQuantities: Record<number, number> = {}
    medicaments.forEach((med) => {
      initialQuantities[med.id] = 1
    })
    setSelectedQuantities(initialQuantities)
  }, [medicaments])

  // Fetch the active cart when patientId is available
  useEffect(() => {
    if (patientId) {
      fetchActiveCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const fetchActiveCart = async () => {
    if (!patientId) return

    try {
      // First check if we have a stored active cart ID
      const storedCartId = localStorage.getItem("activeCartId")

      if (storedCartId) {
        // Verify this cart exists and is not paid
        try {
          const response = await fetch(`${BACKEND_URL}/cart/${storedCartId}`)

          if (response.ok) {
            const cartData: CartResponse = await response.json()

            // If the cart is paid, we need a new one
            if (cartData.is_paid) {
              await getOrCreateActiveCart()
            } else {
              // Cart exists and is not paid, use it
              setActiveCartId(Number.parseInt(storedCartId))
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
      showNotification("Failed to load your cart", "error")
    }
  }

  const getOrCreateActiveCart = async () => {
    if (!patientId) return

    try {
      // Try to get an active (unpaid) cart for this patient
      const response = await fetch(`${BACKEND_URL}/cart/active/${patientId}`)

      if (response.ok) {
        // Found an active cart
        const cartData: CartResponse = await response.json()
        setActiveCartId(cartData.id)
        localStorage.setItem("activeCartId", cartData.id.toString())
        processCartData(cartData)
      } else if (response.status === 404) {
        // No active cart found, create a new one
        const createResponse = await fetch(`${BACKEND_URL}/cart/add/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [] }),
        })

        if (createResponse.ok) {
          const newCartData: CartResponse = await createResponse.json()
          setActiveCartId(newCartData.id)
          localStorage.setItem("activeCartId", newCartData.id.toString())
          setCartItems([])
        } else {
          throw new Error("Failed to create a new cart")
        }
      } else {
        throw new Error("Failed to get active cart")
      }
    } catch (error) {
      console.error("Error getting/creating active cart:", error)
      showNotification("Failed to initialize your cart", "error")
    }
  }

  // Update the processCartData function to handle missing cart items endpoint
  const processCartData = (cartData: CartResponse) => {
    // Extract cart items from the response
    const items: CartItem[] = []

    if (cartData && cartData.medicaments) {
      // We need to get the quantities from the cart_medicament table
      // For now, we'll make a separate API call to get this information
      fetch(`${BACKEND_URL}/cart/${cartData.id}/items`)
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
          // Map the medicaments with their quantities
          for (const med of cartData.medicaments) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cartItem = cartItemsData.find((item: any) => item.medicament_id === med.id)
            const quantity = cartItem ? cartItem.quantity : 1

            items.push({
              medicament_id: med.id,
              quantity: quantity,
            })
          }
          setCartItems(items)
        })
        .catch((error) => {
          console.error("Error fetching cart items:", error)
          // Fallback: just use the medicaments without quantities
          for (const med of cartData.medicaments) {
            items.push({
              medicament_id: med.id,
              quantity: 1,
            })
          }
          setCartItems(items)
        })
    } else {
      setCartItems([])
    }
  }

  const fetchMedicaments = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/medicaments`, {
        // Add cache: 'no-cache' to ensure we always get fresh data
        cache: "no-cache",
      })
      if (!res.ok) throw new Error("Failed to fetch medicaments")
      const data = await res.json()

      // Log the image URLs to help debug
      console.log(
        "Medicaments with images:",
        data
          .filter((m: Medicament) => m.image)
          .map((m: Medicament) => ({
            id: m.id,
            name: m.name,
            image: m.image,
            fullImageUrl: getImageUrl(m.image),
          })),
      )

      setMedicaments(data)
    } catch (error) {
      console.error("Error fetching medicaments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Add this after the fetchMedicaments function
  useEffect(() => {
    // This effect will run when the component is focused (user returns to this page)
    const handleFocus = () => {
      fetchMedicaments()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to update quantity directly in the database
  const updateCartQuantity = async (medicamentId: number, newQuantity: number, medicamentName: string) => {
    if (!patientId || !activeCartId) {
      showNotification("Patient ID or Cart ID not found. Please log in again.", "error")
      return
    }

    // Don't allow quantity less than 1
    if (newQuantity < 1) {
      newQuantity = 1
      return
    }

    try {
      setUpdatingQuantity(medicamentId)

      // Get all current cart items
      const currentItems = [...cartItems]
      const existingItemIndex = currentItems.findIndex((item) => item.medicament_id === medicamentId)

      // If item exists in cart, update it
      if (existingItemIndex >= 0) {
        // Create a copy of the items with the updated quantity
        const updatedItems = currentItems.map((item) =>
          item.medicament_id === medicamentId
            ? { medicament_id: medicamentId, quantity: newQuantity }
            : { medicament_id: item.medicament_id, quantity: item.quantity },
        )

        // Update the quantity in the database
        const response = await fetch(`${BACKEND_URL}/cart/update/${activeCartId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: updatedItems,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to update cart")
        }

        // Update was successful, show notification
        showNotification(`${medicamentName} quantity updated to ${newQuantity}`)

        // Update local state
        setCartItems(updatedItems)
      } else {
        // If item doesn't exist in cart, add it with the specified quantity
        const response = await fetch(`${BACKEND_URL}/cart/add/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                medicament_id: medicamentId,
                quantity: newQuantity,
              },
            ],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to add to cart")
        }

        // Update local state
        setCartItems((prev) => [...prev, { medicament_id: medicamentId, quantity: newQuantity }])

        showNotification(`${medicamentName} added to cart with quantity ${newQuantity}`)
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error)
      showNotification(error instanceof Error ? error.message : "Failed to update quantity", "error")

      // Refresh cart to ensure UI is in sync with backend
      fetchActiveCart()
    } finally {
      setUpdatingQuantity(null)
    }
  }

  // Function to handle quantity change from the UI
  const handleQuantityChange = async (medicamentId: number, delta: number, medicamentName: string) => {
    // Check if the item is already in the cart
    const existingItem = cartItems.find((item) => item.medicament_id === medicamentId)

    if (existingItem) {
      // If it's in the cart, update directly in the database
      const newQuantity = existingItem.quantity + delta
      if (newQuantity >= 1) {
        // First update the UI immediately for better user experience
        setCartItems((prev) =>
          prev.map((item) => (item.medicament_id === medicamentId ? { ...item, quantity: newQuantity } : item)),
        )

        // Then update in the database
        updateCartQuantity(medicamentId, newQuantity, medicamentName)
      }
    } else {
      // If it's not in the cart, just update the local selected quantity
      setSelectedQuantities((prev) => {
        const currentQuantity = prev[medicamentId] || 1
        const newQuantity = Math.max(1, currentQuantity + delta)
        return { ...prev, [medicamentId]: newQuantity }
      })
    }
  }

  const addToCart = async (medicament_id: number, medicamentName: string) => {
    if (!patientId) {
      showNotification("Patient ID not found. Please log in again.", "error")
      return
    }

    try {
      setAddingToCart(medicament_id)

      // Ensure we have an active cart
      if (!activeCartId) {
        await getOrCreateActiveCart()
        if (!activeCartId) {
          throw new Error("Failed to create or get an active cart")
        }
      }

      // Check if the item already exists in the cart
      const existingItem = cartItems.find((item) => item.medicament_id === medicament_id)

      // Get the selected quantity for this medicament
      const quantity = selectedQuantities[medicament_id] || 1

      // If item exists, update its quantity
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        await updateCartQuantity(medicament_id, newQuantity, medicamentName)
      } else {
        // If item doesn't exist, add it with the selected quantity
        const response = await fetch(`${BACKEND_URL}/cart/add/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                medicament_id: medicament_id,
                quantity: quantity,
              },
            ],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to add to cart")
        }

        // Update local state
        setCartItems((prev) => [...prev, { medicament_id, quantity }])

        showNotification(`${quantity} ${medicamentName}${quantity > 1 ? "s" : ""} added to your cart`)
      }

      // Reset the selected quantity back to 1 after adding to cart
      setSelectedQuantities((prev) => ({ ...prev, [medicament_id]: 1 }))
    } catch (error) {
      console.error("Error adding to cart:", error)
      showNotification(error instanceof Error ? error.message : "Failed to add medicament to cart", "error")

      // Refresh cart to ensure we have the latest state
      fetchActiveCart()
    } finally {
      setTimeout(() => setAddingToCart(null), 600)
    }
  }

  useEffect(() => {
    fetchMedicaments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dosages = Array.from(
    new Set(
      medicaments
        .map((med) => med.dosage)
        .filter(Boolean)
        .sort(),
    ),
  )

  const filteredMedicaments = medicaments.filter((med) => {
    const nameMatch = med.name.toLowerCase().includes(searchTerm.toLowerCase())
    const dosageMatch = selectedDosage === "" || med.dosage === selectedDosage
    const legalCheck = med.legal !== false // Only show if legal is true or undefined
    return nameMatch && dosageMatch && legalCheck
  })

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "Price not available"
    return `${price.toFixed(2)} DT`
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedDosage("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      <Header />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg transition-all animate-in slide-in-from-right-5
              ${notification.type === "success" ? "bg-white border-l-4 border-primary-500" : "bg-white border-l-4 border-red-500"}`}
          >
            <div className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center mr-3
                ${notification.type === "success" ? "bg-primary-100" : "bg-red-100"}`}
              >
                {notification.type === "success" ? (
                  <Check className="h-5 w-5 text-primary-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-neutral-700">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-12 left-1/3 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Medications</h1>
          <p className="text-primary-100 max-w-2xl mx-auto text-lg">
            Browse our selection of high-quality medications and add them to your cart
          </p>
        </div>
      </div>

      {/* Search/Filter Panel */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10 -mt-12 border border-primary-100 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-2">
              <label htmlFor="search" className="text-sm font-medium text-neutral-700">
                Medication Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                <Input
                  id="search"
                  placeholder="Search medications..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-4 space-y-2">
              <label htmlFor="dosage-filter" className="text-sm font-medium text-neutral-700">
                Dosage
              </label>
              <select
                id="dosage-filter"
                className="w-full border rounded-md p-2 border-neutral-300 focus:outline-none focus:ring focus:ring-primary-500"
                value={selectedDosage}
                onChange={(e) => setSelectedDosage(e.target.value)}
              >
                <option value="">All dosages</option>
                {dosages.map((dosage) => (
                  <option key={dosage} value={dosage}>
                    {dosage}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              {searchTerm || selectedDosage ? (
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" /> Clear
                </Button>
              ) : (
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Medicament List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden border border-primary-100">
                <div className="h-48 bg-primary-50">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMedicaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicaments.map((med) => {
              const outOfStock = med.stock === 0
              const itemInCart = cartItems.find((item) => item.medicament_id === med.id)
              const quantity = itemInCart ? itemInCart.quantity : selectedQuantities[med.id] || 1
              const isUpdating = updatingQuantity === med.id

              return (
                <Card key={med.id} className="overflow-hidden border border-primary-100 hover:shadow-xl transition-all">
                  <div className="relative h-48 bg-gradient-to-br from-primary-500/10 to-primary-600/20 flex items-center justify-center overflow-hidden">
                    {med.image ? (
                      <Image
                        src={getImageUrl(med.image) || "/placeholder.svg"}
                        alt={med.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=300&width=500"
                        }}
                      />
                    ) : (
                      <div className="bg-white p-4 rounded-full">
                        <Pill className="h-12 w-12 text-primary-500" />
                      </div>
                    )}
                    {med.price !== undefined && (
                      <Badge className="absolute top-4 right-4 bg-primary-500 text-white">
                        {formatPrice(med.price)}
                      </Badge>
                    )}
                    {itemInCart && (
                      <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                        In Cart: {itemInCart.quantity}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-neutral-800">{med.name}</h3>
                      {med.dosage && <Badge className="mt-1 bg-primary-100 text-primary-700">{med.dosage}</Badge>}
                      {med.stock !== undefined && (
                        <p className={`mt-1 text-sm font-medium ${outOfStock ? "text-red-500" : "text-green-600"}`}>
                          {outOfStock ? "Out of stock" : `In stock: ${med.stock}`}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mb-6 min-h-[40px]">
                      {med.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-primary-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-primary-600">{formatPrice(med.price)}</span>

                        {/* Quantity selector */}
                        <div className="flex items-center border rounded-md ml-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-r"
                            onClick={() => handleQuantityChange(med.id, -1, med.name)}
                            disabled={quantity <= 1 || isUpdating || outOfStock}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 text-sm font-medium">{isUpdating ? "..." : quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-none border-l"
                            onClick={() => handleQuantityChange(med.id, 1, med.name)}
                            disabled={(med.stock !== undefined && quantity >= med.stock) || isUpdating || outOfStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => addToCart(med.id, med.name)}
                        disabled={addingToCart === med.id || isUpdating || outOfStock}
                        className={`text-white ${
                          addingToCart === med.id || isUpdating
                            ? "bg-green-500"
                            : itemInCart
                              ? "bg-primary-400 hover:bg-primary-500"
                              : "bg-primary-500 hover:bg-primary-600"
                        }`}
                      >
                        {addingToCart === med.id ? (
                          <>
                            <Check className="mr-2 h-4 w-4" /> Added!
                          </>
                        ) : isUpdating ? (
                          <>Updating...</>
                        ) : itemInCart ? (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Add More
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border border-primary-100 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className="bg-primary-50 p-6 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-primary-400" />
              </div>
              <h3 className="text-2xl font-semibold text-neutral-800 mb-2">No medications found</h3>
              <p className="text-neutral-500 text-center max-w-md mb-6">
                We couldn&apos;t find any medications matching your search criteria. Please try different filters.
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </main>
  )
}
