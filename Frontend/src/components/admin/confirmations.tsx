"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/admin/sidebar"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { LanguageProvider } from "@/contexts/language-context"
import { DictionaryProvider } from "@/components/admin/dictionary-provider"
import { getDictionary } from "@/lib/dictionary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, User, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Doctor {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  photo: string | null
  medecin_id: number
  adresse: string
  diplome: string
  grade: string
  ville: string
}

export default function DoctorApprovalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dictionaries, setDictionaries] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    async function loadDictionaries() {
      try {
        const [en, fr, ar] = await Promise.all([getDictionary("en"), getDictionary("fr"), getDictionary("ar")])
        setDictionaries({ en, fr, ar })
      } catch (error) {
        console.error("Failed to load dictionaries:", error)
      }
    }

    loadDictionaries()
  }, [])

  useEffect(() => {
    async function fetchPendingDoctors() {
      try {
        const response = await fetch("http://localhost:8000/auth/admin/pending-doctors")
        if (!response.ok) {
          throw new Error("Failed to fetch pending doctors")
        }
        const data = await response.json()
        setPendingDoctors(data)
      } catch (error) {
        console.error("Error fetching pending doctors:", error)
        toast({
          title: "Error",
          description: "Failed to load pending doctor applications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (dictionaries) {
      fetchPendingDoctors()
    }
  }, [dictionaries])

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsDialogOpen(true)
  }

  const handleApproveDoctor = async (doctorId: number) => {
    setIsApproving(true)
    try {
      const response = await fetch("http://localhost:8000/auth/admin/approve-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          approved: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve doctor")
      }

      // Remove the approved doctor from the list
      setPendingDoctors(pendingDoctors.filter((doctor) => doctor.id !== doctorId))
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Doctor has been approved successfully",
        variant: "default",
      })
    } catch (error) {
      console.error("Error approving doctor:", error)
      toast({
        title: "Error",
        description: "Failed to approve doctor",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleRejectDoctor = async (doctorId: number) => {
    setIsRejecting(true)
    try {
      const response = await fetch("http://localhost:8000/auth/admin/approve-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          approved: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject doctor")
      }

      // Remove the rejected doctor from the list
      setPendingDoctors(pendingDoctors.filter((doctor) => doctor.id !== doctorId))
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Doctor application has been rejected",
        variant: "default",
      })
    } catch (error) {
      console.error("Error rejecting doctor:", error)
      toast({
        title: "Error",
        description: "Failed to reject doctor application",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  if (loading || !dictionaries) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <DictionaryProvider dictionaries={dictionaries}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar isOpen={isSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-900 dark:text-gray-100">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Doctor Applications</h1>
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                      <li className="inline-flex items-center">
                        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <span className="text-gray-400 mx-2">/</span>
                          <span className="text-gray-500 text-sm">Doctor Applications</span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Doctor Applications</CardTitle>
                    <CardDescription>Review and approve doctor registration applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingDoctors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          No pending applications
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          There are no doctor applications waiting for approval at this time.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Qualifications</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingDoctors.map((doctor) => (
                            <TableRow key={doctor.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarImage src={doctor.photo || ""} alt={`${doctor.nom} ${doctor.prenom}`} />
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {doctor.nom} {doctor.prenom}
                                    </p>
                                    <Badge variant="outline">{doctor.grade}</Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p>{doctor.email}</p>
                                <p className="text-sm text-gray-500">{doctor.telephone}</p>
                              </TableCell>
                              <TableCell>
                                <p>{doctor.diplome}</p>
                              </TableCell>
                              <TableCell>
                                <p>{doctor.ville}</p>
                                <p className="text-sm text-gray-500">{doctor.adresse}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(doctor)}>
                                    View Details
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>

        {/* Doctor Details Dialog */}
        {selectedDoctor && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Doctor Application Details</DialogTitle>
                <DialogDescription>Review the doctor&apos;s information before making a decision.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedDoctor.photo || ""}
                      alt={`${selectedDoctor.nom} ${selectedDoctor.prenom}`}
                    />
                    <AvatarFallback className="text-lg">
                      {selectedDoctor.nom.charAt(0)}
                      {selectedDoctor.prenom.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedDoctor.nom} {selectedDoctor.prenom}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {selectedDoctor.grade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                    <p className="mt-1">{selectedDoctor.email}</p>
                    <p>{selectedDoctor.telephone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                    <p className="mt-1">{selectedDoctor.ville}</p>
                    <p>{selectedDoctor.adresse}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Qualifications</h4>
                  <p className="mt-1">{selectedDoctor.diplome}</p>
                </div>
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => handleRejectDoctor(selectedDoctor.id)}
                  disabled={isRejecting || isApproving}
                >
                  {isRejecting ? (
                    <span className="flex items-center">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                      Rejecting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Application
                    </span>
                  )}
                </Button>
                <Button onClick={() => handleApproveDoctor(selectedDoctor.id)} disabled={isApproving || isRejecting}>
                  {isApproving ? (
                    <span className="flex items-center">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                      Approving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Doctor
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DictionaryProvider>
    </LanguageProvider>
  )
}
