"use client"
import "../../../public/tailwind.css"
import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Sidebar } from "@/components/admin/sidebar"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { LanguageProvider } from "@/contexts/language-context"
import { DictionaryProvider } from "@/components/admin/dictionary-provider"
import { getDictionary } from "@/lib/dictionary"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  Search,
  UserPlus,
  CheckCircle2,
  CircleXIcon as XCircle2,
  Eye,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

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
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")

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
    setActiveTab("overview")
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

  // Quick approve/reject directly from the table
  const handleQuickApprove = async (doctorId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    await handleApproveDoctor(doctorId)
  }

  const handleQuickReject = async (doctorId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    await handleRejectDoctor(doctorId)
  }

  // Filter doctors based on search term
  const filteredDoctors = pendingDoctors.filter(
    (doctor) =>
      doctor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.grade.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <DoctorApprovalContent
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          pendingDoctors={filteredDoctors}
          selectedDoctor={selectedDoctor}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          isApproving={isApproving}
          isRejecting={isRejecting}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleViewDetails={handleViewDetails}
          handleApproveDoctor={handleApproveDoctor}
          handleRejectDoctor={handleRejectDoctor}
          handleQuickApprove={handleQuickApprove}
          handleQuickReject={handleQuickReject}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </DictionaryProvider>
    </LanguageProvider>
  )
}

function DoctorApprovalContent({
  isSidebarOpen,
  setIsSidebarOpen,
  pendingDoctors,
  selectedDoctor,
  isDialogOpen,
  setIsDialogOpen,
  isApproving,
  isRejecting,
  activeTab,
  setActiveTab,
  handleViewDetails,
  handleApproveDoctor,
  handleRejectDoctor,
  handleQuickApprove,
  handleQuickReject,
  searchTerm,
  setSearchTerm,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  pendingDoctors: Doctor[]
  selectedDoctor: Doctor | null
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  isApproving: boolean
  isRejecting: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
  handleViewDetails: (doctor: Doctor) => void
  handleApproveDoctor: (doctorId: number) => void
  handleRejectDoctor: (doctorId: number) => void
  handleQuickApprove: (doctorId: number, event: React.MouseEvent) => void
  handleQuickReject: (doctorId: number, event: React.MouseEvent) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}) {
  const dictionary = useDictionary()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-900 dark:text-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Header with stats */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    {dictionary.dashboard.doctorApplications}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">{dictionary.dashboard.reviewManage}</p>
                </div>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                      <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
                        {dictionary.dashboard.dashboard}
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <span className="text-gray-400 mx-2">/</span>
                        <span className="text-gray-500 text-sm">{dictionary.dashboard.doctorApplications}</span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{pendingDoctors.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Approved Today</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Rejected Today</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                      <XCircle2 className="h-6 w-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main content card */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-white dark:bg-gray-800 border-b p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{dictionary.dashboard.pendingDoctorApplications}</CardTitle>
                    <CardDescription className="mt-1">{dictionary.dashboard.reviewApprove}</CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search doctors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full md:w-64"
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200 self-start md:self-center px-3 py-1"
                    >
                      {pendingDoctors.length} {dictionary.dashboard.pending}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingDoctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                      <AlertCircle className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {searchTerm ? "No doctors match your search" : dictionary.dashboard.noPendingApplications}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      {searchTerm
                        ? "Try adjusting your search terms or clear the search to see all pending applications."
                        : dictionary.dashboard.noApplicationsWaiting}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800">
                        <TableRow>
                          <TableHead className="font-semibold w-1/4">{dictionary.dashboard.doctors}</TableHead>
                          <TableHead className="font-semibold w-1/5">{dictionary.dashboard.contact}</TableHead>
                          <TableHead className="font-semibold w-1/5">{dictionary.dashboard.qualifications}</TableHead>
                          <TableHead className="font-semibold w-1/5">{dictionary.dashboard.location}</TableHead>
                          <TableHead className="font-semibold w-1/5 text-right">
                            {dictionary.dashboard.actions}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDoctors.map((doctor) => (
                          <TableRow
                            key={doctor.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(doctor)}
                          >
                            <TableCell className="font-medium p-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                  {doctor.photo ? (
                                    <Image
                                      src={
                                        doctor.photo?.startsWith("http")
                                          ? doctor.photo
                                          : `http://localhost:8000${doctor.photo}`
                                      }
                                      alt={`${doctor.nom} ${doctor.prenom}`}
                                      width={48}
                                      height={48}
                                      className="h-full w-full object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-700 font-medium">
                                      {doctor.nom.charAt(0)}
                                      {doctor.prenom.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100 text-base">
                                    {doctor.nom} {doctor.prenom}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 bg-blue-50 text-blue-700 border border-blue-100 font-medium"
                                  >
                                    {doctor.grade}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="flex items-center space-x-2 mb-1.5">
                                <Mail className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700">{doctor.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600">{doctor.telephone}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="flex items-center space-x-2">
                                <Award className="h-4 w-4 text-purple-500" />
                                <span className="text-sm text-gray-700">{doctor.diplome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="flex items-center space-x-2 mb-1.5">
                                <Building className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-gray-700">{doctor.ville}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-gray-600 truncate max-w-[200px]">{doctor.adresse}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetails(doctor)
                                  }}
                                  className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {dictionary.dashboard.viewDetails}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => handleQuickReject(doctor.id, e)}
                                  className="bg-white hover:bg-red-50 text-red-600 border-red-200 h-8 w-8"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => handleQuickApprove(doctor.id, e)}
                                  className="bg-white hover:bg-green-50 text-green-600 border-green-200 h-8 w-8"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              {pendingDoctors.length > 0 && (
                <CardFooter className="bg-gray-50 dark:bg-gray-800 flex justify-between py-3 px-4 border-t">
                  <div className="text-sm text-gray-500">
                    {dictionary.dashboard.showingApplications.replace("{0}", pendingDoctors.length.toString())}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Doctor Details Dialog */}
      {selectedDoctor && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 bg-white">
            <DialogHeader className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {dictionary.dashboard.doctorApplications}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-1">
                    Application ID: {selectedDoctor.id} • Submitted on {new Date().toLocaleDateString()}
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {dictionary.dashboard.pending} {dictionary.dashboard.reviewManage}
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-6 bg-white">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex flex-col items-center md:items-start">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-200 shadow-md">
                    {selectedDoctor.photo ? (
                      <Image
                        src={
                          selectedDoctor.photo?.startsWith("http")
                            ? selectedDoctor.photo
                            : `http://localhost:8000${selectedDoctor.photo}`
                        }
                        alt={`${selectedDoctor.nom} ${selectedDoctor.prenom}`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-700 text-xl">
                        {selectedDoctor.nom.charAt(0)}
                        {selectedDoctor.prenom.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedDoctor.nom} {selectedDoctor.prenom}
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                    <Badge className="bg-blue-50 text-blue-700 border-0 self-center md:self-auto">
                      {selectedDoctor.grade}
                    </Badge>
                    <span className="text-gray-500 hidden md:inline">•</span>
                    <div className="flex items-center gap-1 text-gray-500 justify-center md:justify-start">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedDoctor.ville}</span>
                    </div>
                    <span className="text-gray-500 hidden md:inline">•</span>
                    <div className="flex items-center gap-1 text-gray-500 justify-center md:justify-start">
                      <Award className="h-4 w-4" />
                      <span>{selectedDoctor.diplome}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="overview">{dictionary.dashboard.overview}</TabsTrigger>
                  <TabsTrigger value="qualifications">{dictionary.dashboard.qualifications}</TabsTrigger>
                  <TabsTrigger value="contact">{dictionary.dashboard.contactDetails}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-blue-600" />
                          {dictionary.dashboard.contact}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.email}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.phone}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.telephone}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                          {dictionary.dashboard.location}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.city}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.ville}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.address}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.adresse}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center">
                          <Award className="mr-2 h-4 w-4 text-blue-600" />
                          {dictionary.dashboard.qualifications}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.diploma}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.diplome}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-blue-600" />
                          Professional Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-normal text-gray-500">{dictionary.dashboard.grade}</dt>
                            <dd className="text-sm font-medium mt-1 text-gray-900">{selectedDoctor.grade}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-blue-600" />
                        Application Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex">
                          <div className="mr-4 flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="h-full w-px bg-gray-200 mt-2"></div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Application Submitted</p>
                            <p className="text-sm text-gray-500">
                              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="mr-4 flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                              <Clock className="h-4 w-4" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {dictionary.dashboard.pending} {dictionary.dashboard.reviewManage}
                            </p>
                            <p className="text-sm text-gray-500">Awaiting administrator decision</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="qualifications" className="space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">
                        Education & {dictionary.dashboard.qualifications}
                      </CardTitle>
                      <CardDescription>
                        Detailed information about the doctor s education and professional qualifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900">{dictionary.dashboard.diploma}</h4>
                          <p className="text-gray-700">{selectedDoctor.diplome}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900">Professional {dictionary.dashboard.grade}</h4>
                          <Badge className="bg-blue-50 text-blue-700 border-0">{selectedDoctor.grade}</Badge>
                        </div>
                        <Separator />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">{dictionary.dashboard.contactDetails}</CardTitle>
                      <CardDescription>Detailed contact information for the doctor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-start">
                          <Mail className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1 text-gray-900">{dictionary.dashboard.email}</h4>
                            <p className="text-blue-600">{selectedDoctor.email}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start">
                          <Phone className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1 text-gray-900">{dictionary.dashboard.phone}</h4>
                            <p className="text-gray-700">{selectedDoctor.telephone}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1 text-gray-900">{dictionary.dashboard.address}</h4>
                            <p className="text-gray-700">{selectedDoctor.adresse}</p>
                            <p className="text-gray-700">{selectedDoctor.ville}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="border-t p-6 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => handleRejectDoctor(selectedDoctor.id)}
                disabled={isRejecting || isApproving}
                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
              >
                {isRejecting ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    {dictionary.dashboard.processing}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <XCircle className="mr-2 h-5 w-5" />
                    {dictionary.dashboard.rejectApplication}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => handleApproveDoctor(selectedDoctor.id)}
                disabled={isApproving || isRejecting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isApproving ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    {dictionary.dashboard.processing}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {dictionary.dashboard.approveDoctor}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
