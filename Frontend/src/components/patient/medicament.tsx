"use client"

import { useEffect, useState } from "react"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Check, ShoppingCart, X } from "lucide-react"

type Medicament = {
  id: number
  name: string
  description?: string
  dosage?: string
  price?: number
}

type Notification = {
  id: string
  message: string
  type: "success" | "error"
}

export default function MedicamentsPage() {
  const [medicaments, setMedicaments] = useState<Medicament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])

    // Auto remove notification after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 3000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const fetchMedicaments = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:8000/medicaments")
      if (!res.ok) {
        throw new Error("Failed to fetch medicaments")
      }
      const data = await res.json()
      setMedicaments(data)
    } catch (error) {
      console.error("Error fetching medicaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (medicament_id: number, medicamentName: string) => {
    try {
      setAddingToCart(medicament_id)

      const response = await fetch("http://localhost:8000/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicament_id, quantity: 1 }),
      })

      if (!response.ok) {
        throw new Error("Failed to add to cart")
      }

      // Show custom notification
      showNotification(`${medicamentName} has been added to your cart`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      showNotification("Failed to add medicament to cart", "error")
    } finally {
      // Reset the adding state after a short delay to show the animation
      setTimeout(() => setAddingToCart(null), 600)
    }
  }

  useEffect(() => {
    fetchMedicaments()
  }, [])

  const filteredMedicaments = medicaments.filter((medicament) => {
    return medicament.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Helper function to safely format price
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "Price not available"
    return `${price.toFixed(2) } DT`
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />

      {/* Custom Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-center justify-between p-4 rounded-lg shadow-lg
              transform transition-all duration-300 animate-in slide-in-from-right-5
              ${notification.type === "success" ? "bg-white border-l-4 border-[#2DD4BF]" : "bg-white border-l-4 border-red-500"}
            `}
          >
            <div className="flex items-center">
              {notification.type === "success" ? (
                <div className="h-8 w-8 bg-[#2DD4BF]/20 rounded-full flex items-center justify-center mr-3">
                  <Check className="h-5 w-5 text-[#2DD4BF]" />
                </div>
              ) : (
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <X className="h-5 w-5 text-red-500" />
                </div>
              )}
              <p className="text-gray-700">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Our Medicaments</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">💊 Available Medicaments</h1>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search medicaments..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DD4BF]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMedicaments.length > 0 ? (
                    filteredMedicaments.map((medicament) => (
                      <div
                        key={medicament.id}
                        className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="flex h-full flex-col">
                          <div className="relative h-32 w-full bg-[#2DD4BF]/10 flex items-center justify-center">
                            <div className="text-4xl">💊</div>
                            {/* Price tag */}
                            <div className="absolute top-0 right-0 bg-[#2DD4BF] text-white px-3 py-1 rounded-bl-lg font-bold">
                              {formatPrice(medicament.price)}
                            </div>
                          </div>
                          <div className="flex flex-col flex-grow p-4">
                            <h3 className="text-xl font-bold text-gray-900">{medicament.name}</h3>
                            <p className="text-sm text-[#2DD4BF] font-medium">{medicament.dosage}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-lg font-semibold">{formatPrice(medicament.price)}</p>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {medicament.description || "No description available"}
                            </p>
                            <div className="mt-auto pt-4">
                              <button
                                onClick={() => addToCart(medicament.id, medicament.name)}
                                disabled={addingToCart === medicament.id}
                                className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 transition-all duration-300 flex items-center justify-center ${
                                  addingToCart === medicament.id ? "bg-green-500" : "bg-[#2DD4BF] hover:bg-[#20B8A2]"
                                }`}
                              >
                                {addingToCart === medicament.id ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Added!
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add to Cart
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-gray-500">
                      No medicaments found matching your search. Please try a different name.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
