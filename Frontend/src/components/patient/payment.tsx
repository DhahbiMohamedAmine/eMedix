/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { CreditCard, ShieldCheck, ArrowLeft, LockIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Load your Stripe public key
const stripePromise = loadStripe(
  "pk_test_51RIB714KHtU95xZ4Y5HNfB8EUm38FfzxUxfIj6XVVtZdWEcPN0vxLihleznXB3NqHgkmtnso8r0uLsU1CQ1TIxIO00B2hUgCy8",
)

const CheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    if (!stripe || !elements) {
      setLoading(false)
      setErrorMessage("Stripe has not loaded yet. Please try again.")
      return
    }

    try {
      // 1. Create PaymentIntent
      const res = await fetch("http://localhost:8000/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      if (!res.ok) {
        throw new Error("Failed to create payment intent")
      }

      const { clientSecret } = await res.json()

      if (!clientSecret) {
        throw new Error("Failed to get client secret.")
      }

      // 2. Confirm the payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: {
            name: "Test User", // You can change this to dynamically capture user's name
          },
        },
      })

      if (result.error) {
        setErrorMessage(result.error.message || "Payment failed. Please try again.")
      } else if (result.paymentIntent?.status === "succeeded") {
        // After success, redirect to the billing page with the amount
        router.push(`/patient/billing?amount=${amount}`)
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-700 mb-2">
          Card Number
        </label>
        <div className="border border-neutral-300 rounded-md p-4 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
          <CardNumberElement
            id="cardNumber"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                  iconColor: "#6366f1",
                },
                invalid: {
                  color: "#ef4444",
                },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="cardExpiry" className="block text-sm font-medium text-neutral-700 mb-2">
            Expiration Date
          </label>
          <div className="border border-neutral-300 rounded-md p-4 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
            <CardExpiryElement
              id="cardExpiry"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": { color: "#aab7c4" },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cardCvc" className="block text-sm font-medium text-neutral-700 mb-2">
            CVC
          </label>
          <div className="border border-neutral-300 rounded-md p-4 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
            <CardCvcElement
              id="cardCvc"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": { color: "#aab7c4" },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 h-auto text-base"
      >
        {loading ? "Processing..." : `Pay ${(amount / 100).toFixed(2)} DT`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const total = searchParams ? searchParams.get("total") : null
  const amount = total ? Math.round(Number.parseFloat(total) * 100) : 1000 // Defaulting to $10.00 if no total is found
  const router = useRouter()

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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Secure Checkout</h1>
            <p className="text-primary-100 max-w-2xl mx-auto text-lg">
              Complete your purchase securely with our trusted payment system
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back to Cart Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-neutral-600 hover:text-primary-600 hover:bg-primary-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form Section */}
          <div className="lg:col-span-2">
            <Card className="border border-primary-100 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <CreditCard className="h-6 w-6 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-neutral-800">Payment Details</h2>
                </div>

                <Elements stripe={stripePromise}>
                  <CheckoutForm amount={amount} />
                </Elements>

                <div className="mt-6 flex items-center justify-center text-sm text-neutral-500">
                  <LockIcon className="h-4 w-4 mr-2 text-primary-500" />
                  <span>Your payment information is processed securely</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            <Card className="border border-primary-100 sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-800 mb-6">Order Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span>{(amount / 100).toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className="text-primary-600">Free</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tax</span>
                    <span>0.00 DT</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-neutral-800">Total</span>
                    <span className="text-xl font-bold text-primary-600">{(amount / 100).toFixed(2)} DT</span>
                  </div>
                </div>

                <div className="mt-6 bg-primary-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <ShieldCheck className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary-700 mb-1">Secure Transaction</h4>
                      <p className="text-sm text-primary-600">
                        Your payment information is processed securely. We do not store credit card details.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
