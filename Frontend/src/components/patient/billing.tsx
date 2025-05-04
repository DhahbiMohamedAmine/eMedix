"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import jsPDF from "jspdf"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { CheckCircle } from "lucide-react"
import { useEffect } from "react"


const BillingPage = () => {
  const searchParams = useSearchParams()
  const amount = searchParams ? searchParams.get("amount") : null
  const [isGenerating, setIsGenerating] = useState(false)

  // Convert the amount to dollars (assuming amount is in cents)
  const formattedAmount = amount ? (Number.parseInt(amount) / 100).toFixed(2) : "0.00"

  // Generate a random order ID
  const orderId = `ORD-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const generatePDF = () => {
    setIsGenerating(true)

    setTimeout(() => {
      try {
        const doc = new jsPDF()
        doc.setFont("helvetica", "normal")

        // Add a header
        doc.setFillColor(45, 212, 191) // #2DD4BF
        doc.rect(0, 0, 210, 30, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text("Payment Receipt", 105, 20, { align: "center" })

        // Reset text color for the rest of the document
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)

        // Add company info
        doc.text("HealthCare System", 20, 40)
        doc.text("123 Medical Avenue", 20, 46)
        doc.text("contact@healthcare.com", 20, 52)

        // Add receipt details
        doc.setFontSize(14)
        doc.text("Receipt Details", 20, 70)
        doc.line(20, 72, 190, 72)

        doc.setFontSize(12)
        doc.text(`Order ID: ${orderId}`, 20, 82)
        doc.text(`Date: ${currentDate}`, 20, 90)
        doc.text(`Time: ${currentTime}`, 20, 98)
        doc.text(`Payment Method: Credit Card`, 20, 106)

        // Add payment details
        doc.setFontSize(14)
        doc.text("Payment Details", 20, 124)
        doc.line(20, 126, 190, 126)

        doc.setFontSize(12)
        doc.text("Description", 20, 136)
        doc.text("Amount", 170, 136, { align: "right" })
        doc.line(20, 138, 190, 138)

        doc.text("Medical Services", 20, 146)
        doc.text(`${formattedAmount} DT`, 170, 146, { align: "right" })

        doc.line(20, 152, 190, 152)
        doc.setFont("helvetica", "bold")
        doc.text("Total", 20, 160)
        doc.text(`${formattedAmount} DT`, 170, 160, { align: "right" })

        // Add footer
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text("Thank you for your payment. For any questions, please contact our support team.", 105, 180, {
          align: "center",
        })
        doc.text("This is an automatically generated receipt and does not require a signature.", 105, 186, {
          align: "center",
        })

        // Download the PDF
        doc.save("payment-receipt.pdf")
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("Failed to generate PDF. Please try again.")
      } finally {
        setIsGenerating(false)
      }
    }, 500) // Small delay to show the loading state
  }
  useEffect(() => {
    const saveBillingToServer = async () => {
      try {
        const response = await fetch("http://localhost:8000/billing/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            amount: Number(formattedAmount),
            payment_method: "Credit Card",
            date: new Date().toISOString(),
          }),
        })
  
        if (!response.ok) {
          throw new Error("Failed to save billing data")
        }
  
        console.log("Billing data saved successfully")
      } catch (error) {
        console.error(error)
        alert("Failed to save billing information.")
      }
    }
  
    if (amount) {
      saveBillingToServer()
    }
  }, [amount, orderId, formattedAmount])
  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] md:max-w-[600px] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Receipt</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Payment Successful</h1>
                <p className="text-gray-500 mt-2">Thank you for your payment</p>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{currentDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{currentTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">Credit Card</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-b py-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Medical Services</span>
                  <span className="font-medium">{formattedAmount} DT</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>{formattedAmount} DT</span>
                </div>
              </div>

              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-sm font-medium text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  "Download Receipt (PDF)"
                )}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>If you have any questions about your payment,</p>
                <p>please contact our support team at support@healthcare.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default BillingPage