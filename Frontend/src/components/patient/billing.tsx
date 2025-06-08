"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, ShoppingCart, Clock, CreditCard, Calendar } from "lucide-react"
import { format } from "date-fns"

// Add this interface definition after the imports and before the component
interface CreateBillingParams {
  amount: string | null
  cartId: string | null
  setDebugInfo: React.Dispatch<React.SetStateAction<string>>
  setBillingId: React.Dispatch<React.SetStateAction<number | null>>
  setOrderCode: React.Dispatch<React.SetStateAction<string | null>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  patientId: number | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams ? searchParams.get("amount") : null
  const cartId = searchParams ? searchParams.get("cartId") : null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingId, setBillingId] = useState<number | null>(null)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [debugInfo, setDebugInfo] = useState<string>("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [orderDate, setOrderDate] = useState(new Date())

  // Add a ref to track if billing creation is in progress
  const billingInProgress = useRef(false)
  // Add a ref to track if the component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true

    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
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

  useEffect(() => {
    if (!amount) {
      setError("No payment amount specified")
      setLoading(false)
      return
    }

    if (!cartId) {
      setError("No cart ID specified")
      setLoading(false)
      return
    }

    // If billing creation is already in progress, don't start another one
    if (billingInProgress.current) {
      console.log("Billing creation already in progress, skipping duplicate request")
      return
    }

    // Set billing in progress flag
    billingInProgress.current = true

    // Create a billing record
    const createBilling = async ({
      amount,
      cartId,
      setDebugInfo,
      setBillingId,
      setOrderCode,
      setLoading,
      patientId,
      setError,
    }: CreateBillingParams) => {
      let debug = "" // Declare debug variable here
      try {
        // Generate a unique order ID
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Store the order code
        if (isMounted.current) {
          setOrderCode(orderId)
        }

        // Convert amount from cents to dollars/dinars
        const amountInDinars = Number.parseFloat(amount || "0") / 100

        // Add debug info
        debug = `Creating billing record with:\n`
        debug += `- Order ID: ${orderId}\n`
        debug += `- Amount: ${amountInDinars}\n`
        debug += `- Cart ID: ${cartId}\n`
        debug += `- Note: This will also update medicament stock quantities\n`
        setDebugInfo(debug)

        // First check if the cart is already paid
        if (cartId) {
          try {
            // Check if there's already a billing record for this cart
            const billingsResponse = await fetch(`http://localhost:8000/billing/by-cart/${cartId}`)
            if (billingsResponse.ok) {
              const billings = await billingsResponse.json()
              if (billings && billings.length > 0) {
                const existingBilling = billings[0]
                debug += `\nFound existing billing record: ${JSON.stringify(existingBilling)}\n`
                debug += `\nUsing existing billing record instead of creating a new one.\n`
                setDebugInfo(debug)

                if (isMounted.current) {
                  setBillingId(existingBilling.id)
                  // Try to extract order code from existing billing if available
                  if (existingBilling.order_id) {
                    setOrderCode(existingBilling.order_id)
                  }
                  setLoading(false)
                }

                // Remove the cart ID from localStorage since it's already paid
                localStorage.removeItem("activeCartId")

                // Create a new cart for future purchases if we have a patient ID
                if (patientId) {
                  try {
                    debug += `\nCreating new cart for patient ${patientId} after using existing billing...\n`
                    setDebugInfo(debug)

                    // Create a new empty cart for the patient
                    const newCartResponse = await fetch(`http://localhost:8000/cart/add/${patientId}`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ items: [] }),
                    })

                    if (newCartResponse.ok) {
                      const newCart = await newCartResponse.json()
                      debug += `New cart created with ID: ${newCart.id}\n`
                      // Store the new cart ID in localStorage
                      localStorage.setItem("activeCartId", newCart.id.toString())
                    }
                    setDebugInfo(debug)
                  } catch (err) {
                    debug += `Exception creating new cart: ${err instanceof Error ? err.message : "Unknown error"}\n`
                    setDebugInfo(debug)
                  }
                }

                // Reset billing in progress flag
                billingInProgress.current = false
                return
              }
            }

            // Check cart status
            const cartStatusResponse = await fetch(`http://localhost:8000/cart/${cartId}/status`)
            if (cartStatusResponse.ok) {
              const cartStatus = await cartStatusResponse.json()
              debug += `\nCart status check: ${JSON.stringify(cartStatus)}\n`
              setDebugInfo(debug)

              if (cartStatus.is_paid) {
                debug += `\nCart is already marked as paid. Checking for existing billing...\n`
                setDebugInfo(debug)

                // Try to find an existing billing record (double-check)
                const billingsResponse = await fetch(`http://localhost:8000/billing/by-cart/${cartId}`)
                if (billingsResponse.ok) {
                  const billings = await billingsResponse.json()
                  if (billings && billings.length > 0) {
                    const existingBilling = billings[0]
                    debug += `\nFound existing billing record: ${JSON.stringify(existingBilling)}\n`
                    debug += `\nUsing existing billing record instead of creating a new one.\n`
                    setDebugInfo(debug)

                    if (isMounted.current) {
                      setBillingId(existingBilling.id)
                      // Try to extract order code from existing billing if available
                      if (existingBilling.order_id) {
                        setOrderCode(existingBilling.order_id)
                      }
                      setLoading(false)
                    }

                    // Remove the cart ID from localStorage since it's already paid
                    localStorage.removeItem("activeCartId")

                    // Create a new cart for future purchases if we have a patient ID
                    if (patientId) {
                      try {
                        debug += `\nCreating new cart for patient ${patientId} after using existing billing...\n`
                        setDebugInfo(debug)

                        // Create a new empty cart for the patient
                        const newCartResponse = await fetch(`http://localhost:8000/cart/add/${patientId}`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ items: [] }),
                        })

                        if (newCartResponse.ok) {
                          const newCart = await newCartResponse.json()
                          debug += `New cart created with ID: ${newCart.id}\n`
                          // Store the new cart ID in localStorage
                          localStorage.setItem("activeCartId", newCart.id.toString())
                        }
                        setDebugInfo(debug)
                      } catch (err) {
                        debug += `Exception creating new cart: ${err instanceof Error ? err.message : "Unknown error"}\n`
                        setDebugInfo(debug)
                      }
                    }

                    // Reset billing in progress flag
                    billingInProgress.current = false
                    return
                  }
                }

                // If we get here, the cart is marked as paid but no billing record exists
                // We can try to reset the cart payment status
                debug += `\nAttempting to reset cart payment status...\n`
                setDebugInfo(debug)

                const resetResponse = await fetch(`http://localhost:8000/cart/${cartId}/reset-payment`, {
                  method: "POST",
                })

                if (resetResponse.ok) {
                  debug += `\nCart payment status reset successfully. Proceeding with billing creation.\n`
                  setDebugInfo(debug)
                } else {
                  debug += `\nFailed to reset cart payment status. Will attempt billing creation anyway.\n`
                  setDebugInfo(debug)
                }
              }
            }
          } catch (error) {
            debug += `\nError checking cart status: ${error instanceof Error ? error.message : "Unknown error"}\n`
            setDebugInfo(debug)
            // Continue with billing creation attempt
          }
        }

        // Add a unique identifier to prevent duplicate submissions
        const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        debug += `\nGenerating client request ID: ${clientRequestId}\n`
        setDebugInfo(debug)

        const response = await fetch("http://localhost:8000/billing/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Request-ID": clientRequestId, // Add a unique request ID header
          },
          body: JSON.stringify({
            order_id: orderId,
            amount: amountInDinars,
            payment_method: "Credit Card",
            date: new Date().toISOString(),
            cart_id: cartId ? Number.parseInt(cartId) : null,
            client_request_id: clientRequestId, // Include in the request body as well
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          debug += `\nError from billing API: ${JSON.stringify(errorData)}\n`
          setDebugInfo(debug)
          throw new Error(errorData.detail || `${response.status}: Failed to create billing record`)
        }

        const data = await response.json()
        console.log("Billing record created:", data)

        if (isMounted.current) {
          setBillingId(data.id)
        }

        // Add more debug info
        debug += `\nBilling record created with ID: ${data.id}\n`
        setDebugInfo(debug)

        // Create a new cart immediately if we have a patient ID
        if (patientId) {
          try {
            debug += `\nCreating new cart for patient ${patientId}...\n`
            setDebugInfo(debug)

            // Create a new empty cart for the patient
            const newCartResponse = await fetch(`http://localhost:8000/cart/add/${patientId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ items: [] }),
            })

            if (newCartResponse.ok) {
              const newCart = await newCartResponse.json()
              console.log("Created new cart after payment:", newCart)
              debug += `New cart created with ID: ${newCart.id}\n`
              // Store the new cart ID in localStorage
              localStorage.setItem("activeCartId", newCart.id.toString())
            } else {
              const newCartError = await newCartResponse.json()
              debug += `Error creating new cart: ${newCartError.detail || "Unknown error"}\n`
              console.error("Failed to create new cart after payment:", newCartError)
            }
            setDebugInfo(debug)
          } catch (err) {
            debug += `Exception creating new cart: ${err instanceof Error ? err.message : "Unknown error"}\n`
            setDebugInfo(debug)
            console.error("Error creating new cart after payment:", err)
          }
        }

        if (isMounted.current) {
          setLoading(false)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        setDebugInfo((prev) => prev + `\nError: ${errorMsg}\n`)
        console.error("Error creating billing record:", err)

        // Check if this is the "Cart is already paid" error
        if (errorMsg.includes("Cart is already paid. Billing record exists with ID")) {
          // Extract the billing ID from the error message
          const match = errorMsg.match(/ID (\d+)/)
          if (match && match[1]) {
            const existingBillingId = Number.parseInt(match[1])
            debug += `\nExtracted existing billing ID ${existingBillingId} from error message\n`
            setDebugInfo(debug)

            if (isMounted.current) {
              setBillingId(existingBillingId)
            }

            // Remove the cart ID from localStorage since it's already paid
            localStorage.removeItem("activeCartId")

            // Create a new cart for future purchases if we have a patient ID
            if (patientId) {
              try {
                debug += `\nCreating new cart for patient ${patientId} after handling paid cart error...\n`
                setDebugInfo(debug)

                // Create a new empty cart for the patient
                fetch(`http://localhost:8000/cart/add/${patientId}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ items: [] }),
                })
                  .then((response) => {
                    if (response.ok) return response.json()
                    throw new Error("Failed to create new cart")
                  })
                  .then((newCart) => {
                    debug += `New cart created with ID: ${newCart.id}\n`
                    // Store the new cart ID in localStorage
                    localStorage.setItem("activeCartId", newCart.id.toString())
                    setDebugInfo(debug)
                  })
                  .catch((cartErr) => {
                    debug += `Error creating new cart: ${cartErr.message}\n`
                    setDebugInfo(debug)
                  })
              } catch (cartErr) {
                debug += `Exception creating new cart: ${cartErr instanceof Error ? cartErr.message : "Unknown error"}\n`
                setDebugInfo(debug)
              }
            }

            if (isMounted.current) {
              setLoading(false)
            }

            // Reset billing in progress flag
            billingInProgress.current = false
            return
          }
        }

        if (isMounted.current) {
          setError(`Failed to create billing record: ${errorMsg}`)
          setLoading(false)
        }
      } finally {
        // Always reset the billing in progress flag
        billingInProgress.current = false
      }
    }

    // Call the createBilling function with all required parameters
    createBilling({
      amount,
      cartId,
      setDebugInfo,
      setBillingId,
      setOrderCode,
      setLoading,
      patientId,
      setError,
    })
  }, [amount, cartId, patientId])

  // Function to handle printing the receipt
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const amountValue = amount ? (Number.parseFloat(amount) / 100).toFixed(2) : "0.00"
    const formattedDate = format(orderDate, "MMMM do, yyyy")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medix - Receipt ${orderCode || `#${billingId}`}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          
          .receipt-title {
            font-size: 24px;
            font-weight: 700;
            color: #0891b2;
            margin: 10px 0;
          }
          
          .receipt-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          
          .receipt-body {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            background-color: #f9fafb;
          }
          
          .receipt-section {
            margin-bottom: 20px;
          }
          
          .receipt-section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #0891b2;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          
          .receipt-label {
            font-weight: 500;
            color: #4b5563;
          }
          
          .receipt-value {
            font-weight: 600;
            text-align: right;
          }
          
          .receipt-total {
            font-size: 18px;
            font-weight: 700;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
          }
          
          .receipt-message {
            text-align: center;
            margin: 30px 0;
            color: #4b5563;
          }
          
          .receipt-footer {
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          
          .contact-info {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          
          .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .policies {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 15px;
          }
          
          .policy-link {
            color: #0891b2;
            text-decoration: none;
          }
          
          .policy-link:hover {
            text-decoration: underline;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="receipt-title">Medix</div>
          <div class="receipt-subtitle">Your trusted healthcare partner</div>
        </div>
        
        <div class="receipt-body">
          <div class="receipt-section">
            <div class="receipt-section-title">Order Summary</div>
            <div class="receipt-row">
              <span class="receipt-label">Order Code:</span>
              <span class="receipt-value">${orderCode || `ORD-${billingId}`}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Date:</span>
              <span class="receipt-value">${formattedDate}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Payment Method:</span>
              <span class="receipt-value">Credit Card</span>
            </div>
            <div class="receipt-row receipt-total">
              <span class="receipt-label">Total Amount:</span>
              <span class="receipt-value">${amountValue} DT</span>
            </div>
          </div>
        </div>
        

        
        <div class="receipt-footer">
          <div>Your trusted healthcare partner providing quality medical services and products.</div>
          
          <div class="contact-info">
            <div class="contact-item">A371, Centre Urb Nord, 1082, Tunis</div>
            <div class="contact-item">+216 25 698 888</div>
            <div class="contact-item">contact@emedix.com</div>
          </div>
          
          <div class="policies">
            <a href="#" class="policy-link">Privacy Policy</a>
            <a href="#" class="policy-link">Terms of Service</a>
            <a href="#" class="policy-link">Cookie Policy</a>
          </div>
          
          <div style="margin-top: 20px;">© 2025 eMedix. All rights reserved.</div>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Print after a short delay to ensure styles are loaded
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-cyan-700 font-medium">Processing your payment...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto shadow-lg border-red-100">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-alert-circle"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                Payment Error
              </CardTitle>
              <CardDescription>We encountered a problem with your payment</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700">{error}</p>
            </CardContent>
            <CardFooter className="border-t border-gray-100 pt-4">
              <Button onClick={() => router.push("/patient/medicaments")} className="bg-cyan-600 hover:bg-cyan-700">
                Return to Medicaments
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-lg border-cyan-100 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-b">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-3 shadow-md">
                <CheckCircle className="h-12 w-12 text-cyan-500" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Payment Successful!</CardTitle>
            <CardDescription className="text-lg text-white/90 mt-2">
              Your order has been processed and your payment was successful.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pt-8">
            <div className="bg-cyan-50 rounded-xl p-6 border border-cyan-100">
              <h3 className="font-bold text-xl text-cyan-800 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-cyan-600" />
                Order Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-cyan-100">
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 mr-2 text-cyan-600" />
                    <span>Order Code:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{orderCode || `ORD-${billingId}`}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-cyan-100">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-cyan-600" />
                    <span>Date:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{format(orderDate, "MMMM d, yyyy")}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-cyan-100">
                  <div className="flex items-center text-gray-700">
                    <CreditCard className="h-4 w-4 mr-2 text-cyan-600" />
                    <span>Payment Method:</span>
                  </div>
                  <span className="font-semibold text-gray-900">Credit Card</span>
                </div>

                <div className="flex justify-between items-center pt-2 mt-2">
                  <span className="font-bold text-lg text-gray-900">Total Amount:</span>
                  <span className="font-bold text-xl text-cyan-700">
                    {amount ? (Number.parseFloat(amount) / 100).toFixed(2) : 0} DT
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2 py-4 px-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-cyan-500 mb-2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <p className="text-gray-600">Thank you for your purchase!</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center bg-gray-50 border-t p-6">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
            <Button
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => router.push("/patient/medicaments")}
            >
              <ShoppingCart className="h-4 w-4" />
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </main>
  )
}
