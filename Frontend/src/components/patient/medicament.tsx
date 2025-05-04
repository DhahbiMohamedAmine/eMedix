"use client"

import { useEffect, useState } from "react"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Check, ShoppingCart, X, Search, Filter, Pill, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [selectedDosage, setSelectedDosage] = useState("")
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

  // Get unique dosages for filter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dosages = Array.from(
    new Set(
      medicaments
        .map((med) => med.dosage)
        .filter(Boolean)
        .sort()
    )
  )

  const filteredMedicaments = medicaments.filter((medicament) => {
    const nameMatch = medicament.name.toLowerCase().includes(searchTerm.toLowerCase())
    const dosageMatch = selectedDosage === "" || medicament.dosage === selectedDosage
    return nameMatch && dosageMatch
  })

  // Helper function to safely format price
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

      {/* Custom Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-center justify-between p-4 rounded-lg shadow-lg
              transform transition-all duration-300 animate-in slide-in-from-right-5
              ${notification.type === "success" ? "bg-white border-l-4 border-primary-500" : "bg-white border-l-4 border-red-500"}
            `}
          >
            <div className="flex items-center">
              {notification.type === "success" ? (
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <Check className="h-5 w-5 text-primary-500" />
                </div>
              ) : (
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <X className="h-5 w-5 text-red-500" />
                </div>
              )}
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

      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-12 left-1/3 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Medications</h1>
            <p className="text-primary-100 max-w-2xl mx-auto text-lg">
              Browse our selection of high-quality medications and add them to your cart
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Panel */}
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
                  className="pl-9 border-neutral-300 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-2">
              <label htmlFor="dosage-filter" className="text-sm font-medium text-neutral-700">
                Dosage
              </label>


            <div className="md:col-span-2">
              {searchTerm || selectedDosage ? (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              ) : (
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

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
        ) : (
          <>
            {filteredMedicaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedicaments.map((medicament) => (
                  <Card
                    key={medicament.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-xl border border-primary-100"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-primary-500/10 to-primary-600/20 flex items-center justify-center">
                      <div className="bg-white p-4 rounded-full">
                        <Pill className="h-12 w-12 text-primary-500" />
                      </div>
                      {medicament.price !== undefined && (
                        <Badge className="absolute top-4 right-4 bg-primary-500 hover:bg-primary-600 text-white font-medium px-3 py-1">
                          {formatPrice(medicament.price)}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-neutral-800 group-hover:text-primary-600 transition-colors">
                          {medicament.name}
                        </h3>
                        {medicament.dosage && (
                          <Badge className="mt-1 bg-primary-100 text-primary-700 hover:bg-primary-200 font-normal">
                            {medicament.dosage}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 mb-6 min-h-[40px]">
                        {medicament.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary-100">
                        <span className="text-lg font-semibold text-primary-600">{formatPrice(medicament.price)}</span>

                        <Button
                          onClick={() => addToCart(medicament.id, medicament.name)}
                          disabled={addingToCart === medicament.id}
                          className={`transition-all duration-300 ${
                            addingToCart === medicament.id
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-primary-500 hover:bg-primary-600"
                          } text-white`}
                        >
                          {addingToCart === medicament.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Added!
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-primary-100 overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <div className="bg-primary-50 p-6 rounded-full mb-6">
                    <AlertCircle className="h-12 w-12 text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-neutral-800 mb-2">No medications found</h3>
                  <p className="text-neutral-500 text-center max-w-md mb-6">
                    We couldn t find any medications matching your search criteria. Please try different filters.
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
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
