/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Send, User, Search, Calendar, Plus, Wifi, WifiOff, Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import Header from "../patient/header"
import Footer from "../footer"

interface Doctor {
  user_id: number
  prenom: string
  nom: string
  specialite: string
  email: string
  photo: string | null
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  timestamp: string
  appointment_id?: number
}

export default function EnhancedPatientChat() {
  const [patientId, setPatientId] = useState<number | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const maxReconnectAttempts = 5

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get patient ID from local storage or context
  useEffect(() => {
    const storedPatientId = localStorage.getItem("patientId")
    if (storedPatientId) {
      setPatientId(Number.parseInt(storedPatientId))
    } else {
      setPatientId(1)
      localStorage.setItem("patientId", "1")
    }
  }, [])

  // Fetch doctors the patient has had appointments with
  useEffect(() => {
    if (patientId) {
      fetchDoctors(patientId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  // Connect to WebSocket when a doctor is selected
  useEffect(() => {
    if (patientId && selectedDoctor) {
      fetchMessages(selectedDoctor.user_id, patientId)
      connectWebSocket(selectedDoctor.user_id, patientId)
    }

    return () => {
      // Clean up WebSocket connection when component unmounts or doctor changes
      if (socketRef.current) {
        console.log("Cleaning up WebSocket connection")
        socketRef.current.close(1000, "Component unmounting")
        socketRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, selectedDoctor])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchDoctors = async (patientId: number) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching doctors for patient ${patientId}`)
      const res = await fetch(`http://localhost:8000/users/doctors/patient/${patientId}`)

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Doctors data:", data)

      if (data && data.doctors && Array.isArray(data.doctors)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedDoctors = data.doctors.map((doctor: any) => ({
          user_id: doctor.id,
          prenom: doctor.prenom,
          nom: doctor.nom,
          email: doctor.email,
          specialite: doctor.grade || "General Practitioner",
          photo: doctor.photo || null,
        }))

        setDoctors(formattedDoctors)

        if (formattedDoctors.length > 0 && !selectedDoctor) {
          setSelectedDoctor(formattedDoctors[0])
        }
      } else {
        console.error("Expected an object with doctors array, but received:", data)
        setDoctors([])
        setError("Received invalid data format from server")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      setError(`Failed to load doctors: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  const createTestAppointment = async () => {
    try {
      const doctorId = 1
      const res = await fetch(
        `http://localhost:8000/test/create-appointment?patient_id=${patientId}&doctor_id=${doctorId}`,
        {
          method: "POST",
        },
      )

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()
      alert(`Test appointment created: ${data.message}`)
      fetchDoctors(patientId!)
    } catch (error) {
      console.error("Error creating test appointment:", error)
      alert(`Failed to create test appointment: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const connectWebSocket = useCallback(
    (doctorId: number, patientId: number) => {
      // Close existing connection if any
      if (socketRef.current) {
        console.log("Closing existing WebSocket connection")
        socketRef.current.close()
        socketRef.current = null
      }

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      try {
        console.log(`Attempting to connect WebSocket for doctor ${doctorId} and patient ${patientId}`)
        const wsUrl = `ws://localhost:8000/ws/chat?doctor_id=${doctorId}&patient_id=${patientId}`
        console.log("WebSocket URL:", wsUrl)

        const ws = new WebSocket(wsUrl)
        socketRef.current = ws

        ws.onopen = (event) => {
          console.log("✅ WebSocket connected successfully", event)
          setIsConnected(true)
          setConnectionAttempts(0)
          setError(null)
        }

        ws.onmessage = (event) => {
          console.log("📨 WebSocket message received:", event.data)
          try {
            const msg = JSON.parse(event.data)
            console.log("Parsed message:", msg)

            // Check if this is an error message
            if (msg.error) {
              console.error("❌ Error from server:", msg.error)
              setError(`Server error: ${msg.error}`)
              return
            }

            // Validate message structure
            if (!msg.id || !msg.content || !msg.sender_id || !msg.receiver_id) {
              console.error("❌ Invalid message structure:", msg)
              return
            }

            // Add message to the list
            setMessages((prevMessages) => {
              console.log("Current messages count:", prevMessages.length)

              // Check if message with this ID already exists
              const exists = prevMessages.some((m) => m.id === msg.id)
              if (exists) {
                console.log("Message already exists, skipping:", msg.id)
                return prevMessages
              }

              const newMessages = [...prevMessages, msg].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
              )
              console.log("✅ Added new message, total count:", newMessages.length)
              return newMessages
            })
          } catch (e) {
            console.error("❌ Error parsing WebSocket message:", e, "Raw data:", event.data)
          }
        }

        ws.onclose = (event) => {
          console.log("🔌 WebSocket disconnected", event.code, event.reason)
          setIsConnected(false)
          socketRef.current = null

          // Only attempt to reconnect if it wasn't a normal closure and we haven't exceeded max attempts
          if (event.code !== 1000 && connectionAttempts < maxReconnectAttempts) {
            console.log(`🔄 Attempting to reconnect (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`)
            setConnectionAttempts((prev) => prev + 1)

            reconnectTimeoutRef.current = setTimeout(
              () => {
                if (selectedDoctor && patientId) {
                  connectWebSocket(doctorId, patientId)
                }
              },
              Math.min(1000 * Math.pow(2, connectionAttempts), 10000),
            ) // Exponential backoff, max 10s
          } else if (connectionAttempts >= maxReconnectAttempts) {
            setError("Connection lost. Please refresh the page to reconnect.")
          }
        }

        ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error)
          setIsConnected(false)
          setError("WebSocket connection error")
        }
      } catch (error) {
        console.error("❌ Error setting up WebSocket:", error)
        setIsConnected(false)
        setError("Failed to establish WebSocket connection")
      }
    },
    [connectionAttempts, selectedDoctor],
  )

  const fetchMessages = async (doctorId: number, patientId: number) => {
    try {
      console.log(`Fetching messages between doctor ${doctorId} and patient ${patientId}`)
      const res = await fetch(
        `http://localhost:8000/messages/doctor-patient?doctor_id=${doctorId}&patient_id=${patientId}`,
      )

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Server error (${res.status}): ${errorText}`)
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Messages data:", data)

      // Sort messages by timestamp
      const sortedMessages = Array.isArray(data)
        ? data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : []

      setMessages(sortedMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError(`Failed to load messages: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const sendMessage = useCallback(() => {
    if (!patientId || !selectedDoctor || !messageText.trim()) {
      console.log("Cannot send message: missing required data")
      return
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not connected, current state:", socketRef.current?.readyState)
      setError("Connection lost. Attempting to reconnect...")

      // Try to reconnect
      if (selectedDoctor && patientId) {
        connectWebSocket(selectedDoctor.user_id, patientId)
      }
      return
    }

    const messageData = {
      sender_id: patientId,
      receiver_id: selectedDoctor.user_id,
      content: messageText.trim(),
      appointment_id: 361,
    }

    console.log("📤 Sending message:", messageData)

    try {
      socketRef.current.send(JSON.stringify(messageData))
      console.log("✅ Message sent successfully")
      setMessageText("")
      setError(null)
    } catch (error) {
      console.error("❌ Error sending message:", error)
      setError("Failed to send message. Please try again.")
    }
  }, [patientId, selectedDoctor, messageText, connectWebSocket])

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

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {}

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate()

  const filteredDoctors = doctors.filter((doctor) =>
    `${doctor.prenom} ${doctor.nom} ${doctor.specialite}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getDoctorPhotoUrl = (doctor: Doctor) => {
    if (!doctor.photo) return null
    if (doctor.photo.startsWith("http")) return doctor.photo
    return `http://localhost:8000${doctor.photo}`
  }

  if (loading && !selectedDoctor) {
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

      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full max-w-6xl rounded-xl bg-white shadow-xl overflow-hidden">
            {/* Fixed Layout Container */}
            <div className="flex h-[700px]">
              {/* Left Sidebar - Doctor List */}
              <div
                className={`${
                  sidebarOpen ? "w-80" : "w-0"
                } transition-all duration-300 ease-in-out flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden`}
                style={{ minWidth: sidebarOpen ? "320px" : "0px" }}
              >
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
                        <p className="text-sm text-gray-500 mt-1">Chat with your healthcare providers</p>
                      </div>

                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search doctors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/50 bg-gray-50"
                      />
                      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Doctor List */}
                  <div className="flex-1 overflow-y-auto">
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        {!isConnected && (
                          <button
                            onClick={() =>
                              selectedDoctor && patientId && connectWebSocket(selectedDoctor.user_id, patientId)
                            }
                            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Retry Connection
                          </button>
                        )}
                      </div>
                    )}

                    {filteredDoctors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 px-6">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                        <p className="mb-4">
                          No doctors found. Schedule an appointment to start chatting with a doctor.
                        </p>

                        <button
                          onClick={createTestAppointment}
                          className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-[#2DD4BF] text-white rounded-md hover:bg-[#2DD4BF]/90 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Test Appointment</span>
                        </button>

                        <Link
                          href="/patient/appointments/new"
                          className="flex items-center justify-center gap-2 mx-auto mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Schedule Appointment</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredDoctors.map((doctor) => (
                          <div
                            key={doctor.user_id}
                            onClick={() => {
                              setSelectedDoctor(doctor)
                              // Auto-close sidebar on mobile after selection
                              if (window.innerWidth < 768) {
                                setSidebarOpen(false)
                              }
                            }}
                            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                              selectedDoctor?.user_id === doctor.user_id
                                ? "bg-[#2DD4BF]/5 border-l-4 border-[#2DD4BF]"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 overflow-hidden">
                                {doctor.photo ? (
                                  <Image
                                    src={getDoctorPhotoUrl(doctor) || "/placeholder.svg"}
                                    alt={`${doctor.prenom} ${doctor.nom}`}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : doctor.prenom && doctor.nom ? (
                                  `${doctor.prenom[0]}${doctor.nom[0]}`.toUpperCase()
                                ) : (
                                  "DR"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                  Dr. {doctor.prenom} {doctor.nom}
                                </h3>
                                <p className="text-sm text-gray-500 truncate">
                                  {doctor.specialite || "General Practitioner"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Chat */}
              <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
                {selectedDoctor ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                        {/* Sidebar Toggle Button */}
                        <button
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        <div className="w-12 h-12 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-sm font-medium text-[#2DD4BF] overflow-hidden">
                          {selectedDoctor.photo ? (
                            <Image
                              src={getDoctorPhotoUrl(selectedDoctor) || "/placeholder.svg"}
                              alt={`${selectedDoctor.prenom} ${selectedDoctor.nom}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : selectedDoctor.prenom && selectedDoctor.nom ? (
                            `${selectedDoctor.prenom[0]}${selectedDoctor.nom[0]}`.toUpperCase()
                          ) : (
                            "DR"
                          )}
                        </div>
                        <div className="flex-1">
                          <h2 className="font-bold text-gray-900">
                            Dr. {selectedDoctor.prenom} {selectedDoctor.nom}
                          </h2>
                          <p className="text-sm text-gray-500">{selectedDoctor.specialite || "General Practitioner"}</p>
                        </div>

                      </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-20 h-20 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center mb-4">
                            <User className="h-10 w-10 text-[#2DD4BF]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Start a conversation</h3>
                          <p className="text-gray-500 max-w-md">
                            No messages yet. Start the conversation with Dr. {selectedDoctor.prenom}{" "}
                            {selectedDoctor.nom}!
                          </p>
                        </div>
                      ) : (
                        Object.entries(messageGroups).map(([date, msgs]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">{date}</div>
                            </div>

                            {msgs.map((msg, idx) => {
                              const isSender = msg.sender_id === patientId
                              const senderName = isSender ? "You" : `Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom}`
                              const prevMsg = idx > 0 ? msgs[idx - 1] : null
                              const showAvatar = !isSender && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

                              return (
                                <div
                                  key={`${msg.id}-${idx}`}
                                  className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2`}
                                >
                                  {!isSender && showAvatar ? (
                                    <div className="flex-shrink-0 mb-1">
                                      <div className="w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-xs font-medium text-[#2DD4BF] overflow-hidden">
                                        {selectedDoctor.photo ? (
                                          <Image
                                            src={getDoctorPhotoUrl(selectedDoctor) || "/placeholder.svg"}
                                            alt={senderName}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                          />
                                        ) : selectedDoctor.prenom && selectedDoctor.nom ? (
                                          `${selectedDoctor.prenom[0]}${selectedDoctor.nom[0]}`.toUpperCase()
                                        ) : (
                                          "DR"
                                        )}
                                      </div>
                                    </div>
                                  ) : !isSender ? (
                                    <div className="w-8 flex-shrink-0"></div>
                                  ) : null}

                                  <div className="max-w-[75%]">
                                    {(!prevMsg || prevMsg.sender_id !== msg.sender_id) && (
                                      <div
                                        className={`text-xs font-medium mb-1 ${isSender ? "text-right text-gray-500" : "text-left text-[#2DD4BF]"}`}
                                      >
                                        {isSender ? "You" : `Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom}`}
                                      </div>
                                    )}
                                    <div
                                      className={`rounded-2xl px-4 py-2 ${
                                        isSender
                                          ? "bg-[#2DD4BF] text-white rounded-br-none"
                                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                      }`}
                                    >
                                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                    <div
                                      className={`text-xs mt-1 ${isSender ? "text-right" : "text-left"} text-gray-400`}
                                    >
                                      {formatTime(msg.timestamp)}
                                    </div>
                                  </div>

                                  {isSender && showAvatar ? (
                                    <div className="flex-shrink-0 mb-1">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden">
                                        You
                                      </div>
                                    </div>
                                  ) : isSender ? (
                                    <div className="w-8 flex-shrink-0"></div>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-[#2DD4BF] focus-within:ring-1 focus-within:ring-[#2DD4BF]/30">
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isConnected ? "Type your message..." : "Connecting..."}
                            disabled={!isConnected}
                            className="w-full px-3 py-2 bg-transparent border-none focus:outline-none resize-none rounded-lg disabled:opacity-50"
                            rows={2}
                          />
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={!messageText.trim() || !isConnected}
                          className="rounded-full bg-[#2DD4BF] p-3 text-white transition-colors hover:bg-[#2DD4BF]/90 focus:ring-2 focus:ring-[#2DD4BF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center mb-6">
                      <User className="h-12 w-12 text-[#2DD4BF]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Doctor</h2>
                    <p className="text-gray-600 max-w-md mb-6">
                      Choose a doctor from the list to start or continue your conversation.
                    </p>
                    {doctors.length === 0 && (
                      <div className="space-y-4">
                        <button
                          onClick={createTestAppointment}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2DD4BF] text-white rounded-md font-medium hover:bg-[#2DD4BF]/90 transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                          <span>Create Test Appointment</span>
                        </button>

                        <Link
                          href="/patient/appointments/new"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Schedule an Appointment</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
