"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Lock, ShieldCheck } from "lucide-react"

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  "pk_test_51RIB714KHtU95xZ4Y5HNfB8EUm38FfzxUxfIj6XVVtZdWEcPN0vxLihleznXB3NqHgkmtnso8r0uLsU1CQ1TIxIO00B2hUgCy8",
)

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const total = searchParams ? searchParams.get("total") : null
  const cartId = searchParams ? searchParams.get("cartId") : null
  const [clientSecret, setClientSecret] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!total) {
      setError("No payment amount specified")
      setLoading(false)
      return
    }

    // Convert total to cents for Stripe
    const amountInCents = Math.round(Number.parseFloat(total) * 100)

    // Create a payment intent on the server
    fetch("http://localhost:8000/payment/createPayment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInCents,
        cart_id: cartId ? Number.parseInt(cartId) : null,
      }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          console.error("Payment API error:", data)
          throw new Error(data.detail || "Failed to create payment intent")
        }
        return data
      })
      .then((data) => {
        console.log("Payment intent created:", data)
        setClientSecret(data.clientSecret)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error creating payment intent:", err)
        setError("Failed to initialize payment. Please check the server logs for details.")
        setLoading(false)
      })
  }, [total, cartId])

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-500">Payment Error</CardTitle>
              <CardDescription>We encountered a problem with your payment</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.history.back()}>Return to Cart</Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>Enter your card information to complete the purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret && (
                    <Elements options={options} stripe={stripePromise}>
                      <CheckoutForm total={total} cartId={cartId} />
                    </Elements>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{total} DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-primary-600">Free</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{total} DT</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary-50 flex flex-col items-start space-y-2">
                  <div className="flex items-center text-sm text-primary-700">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center text-sm text-primary-700">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>Your data is protected</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

function CheckoutForm({ total, cartId }: { total: string | null; cartId: string | null }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/patient/billing?amount=${
          total ? Number.parseFloat(total) * 100 : 0
        }&cartId=${cartId}`,
      },
      redirect: "if_required",
    })

    if (error) {
      setPaymentError(error.message || "Payment failed. Please try again.")
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment succeeded, redirect to billing page
      router.push(`/patient/billing?amount=${total ? Number.parseFloat(total) * 100 : 0}&cartId=${cartId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {paymentError && <div className="text-red-500 text-sm">{paymentError}</div>}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full bg-primary-500 hover:bg-primary-600">
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay ${total} DT`
        )}
      </Button>
    </form>
  )
}
