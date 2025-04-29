/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/router"
import { Send, Clock, User } from "lucide-react"

import Header from "../medecin/header"
import Footer from "../footer"

export default function AppointmentChat() {
  const router = useRouter()
  const [appointmentId, setAppointmentId] = useState<number | null>(null)
  const [senderId, setSenderId] = useState<string | null>(null)
  const [receiverId, setReceiverId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get appointment ID from the URL
  useEffect(() => {
    if (router.isReady) {
      const { appointment_id } = router.query
      const parsedId = Number.parseInt(appointment_id as string)
      if (!isNaN(parsedId)) {
        setAppointmentId(parsedId)
      }
    }
  }, [router.isReady, router.query])

  // Once appointmentId is ready, fetch the appointment details
  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails(appointmentId)
      fetchMessages(appointmentId)
      connectWebSocket(appointmentId)
    }
  }, [appointmentId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchAppointmentDetails = async (appointmentId: number) => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:8000/appointments/appointment/${appointmentId}`)
      const data = await res.json()

      const res2 = await fetch(`http://localhost:8000/users/medecin/${data.medecin_id}`)
      const data2 = await res2.json()

      const res3 = await fetch(`http://localhost:8000/users/patient/${data.patient_id}`)
      const data3 = await res3.json()

      // Set sender (medecin) and receiver (patient)
      setSenderId(String(data3.user_id))
      setReceiverId(String(data2.user_id))

      setAppointmentDetails({
        ...data,
        doctor: data2,
        patient: data3,
      })

      setLoading(false)
    } catch (error) {
      console.error("Error fetching appointment details:", error)
      setLoading(false)
    }
  }

  const connectWebSocket = (appointmentId: number) => {
    const ws = new WebSocket(`ws://localhost:8000/ws?appointment_id=${appointmentId}`)
    socketRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setMessages((prev) => [...prev, msg])
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
    }
  }

  const fetchMessages = async (appointmentId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/messages/${appointmentId}`)
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      senderId &&
      receiverId &&
      messageText.trim()
    ) {
      socketRef.current.send(
        JSON.stringify({
          sender_id: Number.parseInt(senderId),
          receiver_id: Number.parseInt(receiverId),
          content: messageText,
        }),
      )
      setMessageText("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <main className="w-full bg-gray-100 min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-[#2DD4BF]/30 mb-4"></div>
            <div className="h-6 w-48 bg-[#2DD4BF]/30 rounded"></div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
      <main className="w-full bg-gray-100 min-h-screen">
        <Header />
  
        <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
              {/* Banner */}
              <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
                <span className="text-lg font-semibold">Appointment Chat</span>
              </div>
  
              <div className="grid md:grid-cols-3">
                {/* Left side - Appointment Info */}
                <div className="relative flex flex-col w-full h-full bg-[#2DD4BF] p-8 py-16">
                  <div className="flex flex-col gap-6 text-white">
                    <h2 className="text-2xl font-semibold mb-4">Appointment Details</h2>
  
                    {appointmentDetails && (
                      <>
                        <div className="bg-white/10 rounded-lg p-4">
                          <h3 className="text-lg font-medium mb-2">Appointment #{appointmentId}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(appointmentDetails.date_heure).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              {appointmentDetails.patient?.prenom} {appointmentDetails.patient?.nom}
                            </span>
                          </div>
                        </div>
  
                        <div className="bg-white/10 rounded-lg p-4">
                          <h3 className="text-lg font-medium mb-2">Doctor</h3>
                          <div>
                            <p className="mb-1">
                              Dr. {appointmentDetails.doctor?.prenom} {appointmentDetails.doctor?.nom}
                            </p>
                            <p className="text-sm opacity-80">
                              {appointmentDetails.doctor?.specialite || "General Practitioner"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
  
                {/* Right side - Chat */}
                <div className="p-8 md:p-12 md:col-span-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">Appointment Chat</h1>
  
                  {/* Messages Container */}
                  <div className="bg-gray-50 border rounded-lg h-[400px] overflow-y-auto mb-6 p-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, idx) => {
                          const isSender = msg.sender_id.toString() === senderId
                          const senderName = isSender
                            ? `${appointmentDetails?.doctor?.prenom} ${appointmentDetails?.doctor?.nom}`
                            : `${appointmentDetails?.patient?.prenom} ${appointmentDetails?.patient?.nom}`
  
                          return (
                            <div
                              key={idx}
                              className={`flex ${isSender ? "justify-end" : "justify-start"} items-start gap-2 mb-4`}
                            >
                              {!isSender && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden">
                                    {appointmentDetails?.patient?.profile_image ? (
                                      <img
                                        src={`http://localhost:8000/users/patient/profile-image/${appointmentDetails.patient.user_id}`}
                                        alt={senderName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      senderName
                                        .split(" ")
                                        .map((name) => name[0])
                                        .join("")
                                    )}
                                  </div>
                                </div>
                              )}
  
                              <div className="flex flex-col">
                                <span className={`text-xs font-medium mb-1 ${isSender ? "text-right" : "text-left"}`}>
                                  {senderName}
                                </span>
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    isSender
                                      ? "bg-[#2DD4BF] text-white rounded-tr-none"
                                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                                  }`}
                                >
                                  <div className="text-sm">{msg.content}</div>
                                  <div className={`text-xs mt-1 ${isSender ? "text-white/70" : "text-gray-500"}`}>
                                    {formatTime(msg.timestamp)}
                                  </div>
                                </div>
                              </div>
  
                              {isSender && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#2DD4BF]/20 flex items-center justify-center text-xs font-medium text-[#2DD4BF] overflow-hidden">
                                    {appointmentDetails?.doctor?.profile_image ? (
                                      <img
                                        src={`http://localhost:8000/users/medecin/profile-image/${appointmentDetails.doctor.user_id}`}
                                        alt={senderName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      senderName
                                        .split(" ")
                                        .map((name) => name[0])
                                        .join("")
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
  
                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageText.trim()}
                      className="rounded-md bg-[#2DD4BF] px-6 py-3 text-white font-medium transition-colors hover:bg-[#2DD4BF]/90 focus:ring-2 focus:ring-[#2DD4BF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        <Footer />
      </main>
    )
  }
  