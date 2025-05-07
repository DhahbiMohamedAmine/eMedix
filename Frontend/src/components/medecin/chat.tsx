/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Send, User, Search, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import Header from "../medecin/header"
import Footer from "../footer"

interface Patient {
  id: number
  prenom: string
  nom: string
  email: string
  date_naissance?: string
  sexe?: string
  photo?: string | null
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  timestamp: string
  appointment_id?: number
}

export default function DoctorChat() {
  const [doctorId, setDoctorId] = useState<number | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
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

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get doctor ID from local storage or context
  useEffect(() => {
    // For demo purposes, we'll use a hardcoded doctor ID
    // In a real app, you'd get this from authentication
    const storedDoctorId = localStorage.getItem("doctorId")
    if (storedDoctorId) {
      setDoctorId(Number.parseInt(storedDoctorId))
    } else {
      // For demo, set a default
      setDoctorId(1)
      localStorage.setItem("doctorId", "1")
    }
  }, [])

  // Fetch patients the doctor has had appointments with
  useEffect(() => {
    if (doctorId) {
      fetchPatients(doctorId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId])

  // Connect to WebSocket when a patient is selected
  useEffect(() => {
    if (doctorId && selectedPatient) {
      fetchMessages(doctorId, selectedPatient.id)
      connectWebSocket(doctorId, selectedPatient.id)
    }

    return () => {
      // Clean up WebSocket connection when component unmounts or patient changes
      if (socketRef.current) {
        socketRef.current.close()
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, selectedPatient])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchPatients = async (doctorId: number) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching patients for doctor ${doctorId}`)
      const res = await fetch(`http://localhost:8000/users/patients/doctor/${doctorId}`)

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Patients data:", data)

      // Extract the patients array from the response object
      if (data && data.patients && Array.isArray(data.patients)) {
        // Map the data to match our Patient interface
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedPatients = data.patients.map((patient: any) => ({
          id: patient.id,
          prenom: patient.prenom,
          nom: patient.nom,
          email: patient.email,
          date_naissance: patient.date_naissance,
          sexe: patient.sexe,
          photo: patient.photo || null,
        }))

        setPatients(formattedPatients)

        // If we have patients and none is selected, select the first one
        if (formattedPatients.length > 0 && !selectedPatient) {
          setSelectedPatient(formattedPatients[0])
        }
      } else {
        console.error("Expected an object with patients array, but received:", data)
        setPatients([]) // Set to empty array as fallback
        setError("Received invalid data format from server")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching patients:", error)
      setError(`Failed to load patients: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  // For testing: Create a test appointment with a patient
  const createTestAppointment = async () => {
    try {
      // This assumes you have at least one patient in your system with ID 1
      // Adjust the patient_id as needed
      const patientId = 1
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

      // Refresh the patient list
      fetchPatients(doctorId!)
    } catch (error) {
      console.error("Error creating test appointment:", error)
      alert(`Failed to create test appointment: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const connectWebSocket = (doctorId: number, patientId: number) => {
    try {
      console.log(`Connecting WebSocket for doctor ${doctorId} and patient ${patientId}`)

      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close()
      }

      const ws = new WebSocket(`ws://localhost:8000/ws/chat?doctor_id=${doctorId}&patient_id=${patientId}`)
      socketRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data)
        try {
          const msg = JSON.parse(event.data)

          // Check if this is an error message
          if (msg.error) {
            console.error("Error from server:", msg.error)
            return
          }

          // Add message to the list if it's not already there
          setMessages((prev) => {
            // Check if message with this ID already exists
            const exists = prev.some((m) => m.id === msg.id)
            if (exists) return prev
            return [...prev, msg]
          })
        } catch (e) {
          console.error("Error parsing WebSocket message:", e)
        }
      }

      ws.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason)
        setIsConnected(false)

        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          if (selectedPatient && doctorId) {
            connectWebSocket(doctorId, selectedPatient.id)
          }
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error setting up WebSocket:", error)
      setIsConnected(false)
    }
  }

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
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError(`Failed to load messages: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const sendMessage = () => {
    if (!doctorId || !selectedPatient || !messageText.trim()) return

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageData = {
        sender_id: doctorId,
        receiver_id: selectedPatient.id,
        content: messageText,
        // Use appointment_id 361 from your example data as a fallback
        appointment_id: 361,
      }

      console.log("Sending message:", messageData)
      socketRef.current.send(JSON.stringify(messageData))

      // Clear the input field after sending
      setMessageText("")
    } else {
      console.error("WebSocket not connected")
      alert("Connection to chat server lost. Please refresh the page and try again.")

      // Try to reconnect
      if (selectedPatient && doctorId) {
        connectWebSocket(doctorId, selectedPatient.id)
      }
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

  const filteredPatients = patients.filter((patient) =>
    `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get patient profile image URL
  const getPatientPhotoUrl = (patient: Patient) => {
    if (!patient.photo) return null
    // If the photo path is already a full URL, use it directly
    if (patient.photo.startsWith("http")) return patient.photo
    // Otherwise, prepend the base URL
    return `http://localhost:8000${patient.photo}`
  }

  if (loading && !selectedPatient) {
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
            {/* Banner */}
            <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
              <span className="text-lg font-semibold">Doctor Chat</span>
            </div>

            <div className="grid md:grid-cols-3 h-[700px]">
              {/* Left side - Patient List */}
              <div className="relative flex flex-col w-full h-full bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
                  <p className="text-sm text-gray-500 mt-1">Chat with your patients</p>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/50 bg-gray-50"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">
                      <strong className="font-bold">Error: </strong>
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}

                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 px-6">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="mb-4">
                        No patients found. Schedule an appointment to start chatting with a patient.
                      </p>

                      {/* Test button to create an appointment - for development only */}
                      <button
                        onClick={createTestAppointment}
                        className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-[#2DD4BF] text-white rounded-md hover:bg-[#2DD4BF]/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Test Appointment</span>
                      </button>

                      <Link
                        href="/medecin/appointments/new"
                        className="flex items-center justify-center gap-2 mx-auto mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Schedule Appointment</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedPatient?.id === patient.id ? "bg-[#2DD4BF]/5 border-l-4 border-[#2DD4BF]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 overflow-hidden">
                              {patient.photo ? (
                                <Image
                                  src={getPatientPhotoUrl(patient) || "/placeholder.svg"}
                                  alt={`${patient.prenom} ${patient.nom}`}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : patient.prenom && patient.nom ? (
                                `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
                              ) : (
                                "P"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {patient.prenom} {patient.nom}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {patient.sexe === "M" ? "Male" : patient.sexe === "F" ? "Female" : ""}
                                {patient.date_naissance ? ` • ${formatDate(patient.date_naissance)}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Chat */}
              <div className="flex flex-col h-full md:col-span-2 bg-gray-50">
                {selectedPatient ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-sm font-medium text-[#2DD4BF] overflow-hidden">
                          {selectedPatient.photo ? (
                            <Image
                              src={getPatientPhotoUrl(selectedPatient) || "/placeholder.svg"}
                              alt={`${selectedPatient.prenom} ${selectedPatient.nom}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : selectedPatient.prenom && selectedPatient.nom ? (
                            `${selectedPatient.prenom[0]}${selectedPatient.nom[0]}`.toUpperCase()
                          ) : (
                            "P"
                          )}
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900">
                            {selectedPatient.prenom} {selectedPatient.nom}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {selectedPatient.sexe === "M" ? "Male" : selectedPatient.sexe === "F" ? "Female" : ""}
                            {selectedPatient.date_naissance ? ` • ${formatDate(selectedPatient.date_naissance)}` : ""}
                          </p>
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
                            No messages yet. Start the conversation with {selectedPatient.prenom} {selectedPatient.nom}!
                          </p>
                        </div>
                      ) : (
                        Object.entries(messageGroups).map(([date, msgs]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">{date}</div>
                            </div>

                            {msgs.map((msg, idx) => {
                              const isSender = msg.sender_id === doctorId
                              const senderName = isSender ? "You" : `${selectedPatient.prenom} ${selectedPatient.nom}`
                              const prevMsg = idx > 0 ? msgs[idx - 1] : null
                              const showAvatar = !isSender && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

                              return (
                                <div
                                  key={msg.id || idx}
                                  className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2`}
                                >
                                  {!isSender && showAvatar ? (
                                    <div className="flex-shrink-0 mb-1">
                                      <div className="w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-xs font-medium text-[#2DD4BF] overflow-hidden">
                                        {selectedPatient.photo ? (
                                          <Image
                                            src={getPatientPhotoUrl(selectedPatient) || "/placeholder.svg"}
                                            alt={senderName}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                          />
                                        ) : selectedPatient.prenom && selectedPatient.nom ? (
                                          `${selectedPatient.prenom[0]}${selectedPatient.nom[0]}`.toUpperCase()
                                        ) : (
                                          "P"
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
                                        {isSender ? "You" : `${selectedPatient.prenom} ${selectedPatient.nom}`}
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
                            placeholder="Type your message..."
                            className="w-full px-3 py-2 bg-transparent border-none focus:outline-none resize-none rounded-lg"
                            rows={2}
                          />
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={!messageText.trim()}
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Patient</h2>
                    <p className="text-gray-600 max-w-md mb-6">
                      Choose a patient from the list to start or continue your conversation.
                    </p>
                    {patients.length === 0 && (
                      <div className="space-y-4">
                        <button
                          onClick={createTestAppointment}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2DD4BF] text-white rounded-md font-medium hover:bg-[#2DD4BF]/90 transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                          <span>Create Test Appointment</span>
                        </button>

                        <Link
                          href="/medecin/appointments/new"
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
