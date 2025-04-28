/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation" // Updated for App Router
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
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-6">
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-[#2DD4BF] focus-within:border-[#2DD4BF]">
          <CardNumberElement
            id="cardNumber"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex mb-6">
        <div className="w-1/2 pr-2">
          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-[#2DD4BF] focus-within:border-[#2DD4BF]">
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
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="w-1/2 pl-2">
          <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-[#2DD4BF] focus-within:border-[#2DD4BF]">
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
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {errorMessage && <div className="text-red-500 text-sm mt-2 mb-4">{errorMessage}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-sm font-medium text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const total = searchParams ? searchParams.get("total") : null
  const amount = total ? Math.round(parseFloat(total) * 100) : 1000 // Defaulting to $10.00 if no total is found

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] md:max-w-[600px] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Checkout</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <h1 className="mb-6 text-3xl font-bold text-gray-900">💳 Secure Checkout</h1>

              <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>${(amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${(amount / 100).toFixed(2)}</span>
                </div>
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm amount={amount} />
              </Elements>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Your payment is secured by Stripe</p>
                <p className="mt-1">We do not store your card details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}