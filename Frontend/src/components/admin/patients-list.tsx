"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Grid,
  List,
  Eye,
  MapPin,
  Phone,
  Mail,
  FileText,
  X,
  FileSpreadsheet,
  Loader2,
  UserCog,
  AlertCircle,
  Calendar,
  Heart,
  User,
  Trash2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { useLanguage } from "@/contexts/language-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Note: These imports are dynamically loaded in the generatePDF function
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

interface Patient {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  email: string
  telephone: string
  photo: string
  adresse?: string
  groupe_sanguin?: string
}

// Extended patient interface for detailed view
interface PatientDetail extends Patient {
  poids?: number
  taille?: number
  allergies?: string[]
  maladies_chroniques?: string[]
  antecedents_medicaux?: string[]
  derniere_visite?: string
  medecin_traitant?: string
}

interface FilterState {
  ageGroup: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [filters, setFilters] = useState<FilterState>({
    ageGroup: "all",
    sortBy: "name",
    sortOrder: "asc",
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null)
  const [patientDetailLoading, setPatientDetailLoading] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const itemsPerPage = 8

  const dictionary = useDictionary()
  const { dir } = useLanguage()

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true)
        const res = await fetch("http://localhost:8000/stats/patients")
        if (!res.ok) throw new Error(`Error ${res.status}`)

        const data: Patient[] = await res.json()
        setPatients(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch patients:", err)
        setError("Failed to load patients. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  // Function to fetch patient details
  const fetchPatientDetails = async (patientId: number) => {
    try {
      setPatientDetailLoading(true)
      setDetailDialogOpen(true) // Open dialog immediately to show loading state

      console.log(`Fetching patient details for ID: ${patientId}`)
      const res = await fetch(`http://localhost:8000/users/patient/${patientId}`)

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log("Patient details received:", data)
      setSelectedPatient(data)
    } catch (err) {
      console.error("Failed to fetch patient details:", err)
      alert("Failed to load patient details. Please try again.")
    } finally {
      setPatientDetailLoading(false)
    }
  }

  const handleDeletePatient = async (patientId: number) => {
    try {
      setDeleteLoading(true)

      const res = await fetch(`http://localhost:8000/users/patient/${patientId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      // Remove the deleted patient from the state
      setPatients((prev) => prev.filter((p) => p.id !== patientId))
      setDeleteDialogOpen(false)
      setPatientToDelete(null)

      // Show success message (you could use a toast notification here)
      alert("Patient deleted successfully")
    } catch (err) {
      console.error("Failed to delete patient:", err)
      alert("Failed to delete patient. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle view patient details
  const handleViewPatient = (patientId: number) => {
    fetchPatientDetails(patientId)
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  // Group patients by age
  const getAgeGroup = (dateOfBirth: string) => {
    const age = calculateAge(dateOfBirth)
    if (age < 18) return "under18"
    if (age < 30) return "18to29"
    if (age < 50) return "30to49"
    if (age < 65) return "50to64"
    return "65plus"
  }

  // Apply filters and search
  const filteredPatients = useMemo(() => {
    let result = [...patients]

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply age group filter
    if (filters.ageGroup && filters.ageGroup !== "all") {
      result = result.filter((p) => getAgeGroup(p.date_naissance) === filters.ageGroup)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "name":
          comparison = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "age":
          comparison = calculateAge(b.date_naissance) - calculateAge(a.date_naissance)
          break
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, searchTerm, filters])

  // Update active filters display
  useEffect(() => {
    const newActiveFilters = []

    if (filters.ageGroup && filters.ageGroup !== "all") {
      let ageGroupLabel = ""
      switch (filters.ageGroup) {
        case "under18":
          ageGroupLabel = "Under 18"
          break
        case "18to29":
          ageGroupLabel = "18-29"
          break
        case "30to49":
          ageGroupLabel = "30-49"
          break
        case "50to64":
          ageGroupLabel = "50-64"
          break
        case "65plus":
          ageGroupLabel = "65+"
          break
      }
      newActiveFilters.push(`Age: ${ageGroupLabel}`)
    }

    setActiveFilters(newActiveFilters)
  }, [filters])

  // Pagination
  const last = currentPage * itemsPerPage
  const first = last - itemsPerPage
  const pageItems = filteredPatients.slice(first, last)
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilter = (filter: string) => {
    const filterKey = filter.split(":")[0].trim().toLowerCase()
    if (filterKey === "age") {
      setFilters((prev) => ({ ...prev, ageGroup: "all" }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      ageGroup: "all",
      sortBy: "name",
      sortOrder: "asc",
    })
    setSearchTerm("")
  }

  // Helper function to create and download a file
  const downloadFile = (content: string | Blob, fileName: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) // Clean up
  }

  // Generate PDF using jsPDF
  const generatePDF = async () => {
    try {
      setExportLoading("pdf")

      // Dynamically import jsPDF to avoid issues with SSR
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.default

      // Dynamically import jspdf-autotable
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default

      // Create a new PDF document
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text(`Patients Export - ${new Date().toLocaleDateString()}`, 14, 15)

      // Define the column type with proper typing
      type ColumnDef = {
        header: string
        dataKey: keyof PatientRow
      }

      // Define the row data type that will be used in the table
      type PatientRow = {
        id: number
        name: string
        age: number
        email: string
        phone: string
      }

      // Define the columns for the table with proper typing
      const columns: ColumnDef[] = [
        { header: "ID", dataKey: "id" },
        { header: "Name", dataKey: "name" },
        { header: "Age", dataKey: "age" },
        { header: "Email", dataKey: "email" },
        { header: "Phone", dataKey: "phone" },
      ]

      // Prepare the data for the table with the correct type
      const data: PatientRow[] = filteredPatients.map((patient) => ({
        id: patient.id,
        name: `${patient.prenom} ${patient.nom}`,
        age: calculateAge(patient.date_naissance),
        email: patient.email,
        phone: patient.telephone,
      }))

      // Generate the table with type-safe access
      autoTable(doc, {
        startY: 25,
        head: [columns.map((col) => col.header)],
        body: data.map((row) => columns.map((col) => row[col.dataKey])),
        theme: "grid",
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        margin: { top: 25 },
      })

      // Save the PDF
      doc.save(`patients_export_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      // Show error message to user
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setExportLoading(null)
    }
  }

  // Generate Excel file (XLSX format)
  const generateExcel = async () => {
    try {
      setExportLoading("excel")

      // In a real application, you would use a library like xlsx or exceljs
      // This is a simulation that creates a basic Excel XML format

      // Simulate loading time for Excel generation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create Excel XML content
      let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Patients">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Age</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Birth Date</Data></Cell>
    <Cell><Data ss:Type="String">Address</Data></Cell>
   </Row>`

      // Add data rows
      filteredPatients.forEach((patient) => {
        excelContent += `
   <Row>
    <Cell><Data ss:Type="Number">${patient.id}</Data></Cell>
    <Cell><Data ss:Type="String">${patient.prenom} ${patient.nom}</Data></Cell>
    <Cell><Data ss:Type="Number">${calculateAge(patient.date_naissance)}</Data></Cell>
    <Cell><Data ss:Type="String">${patient.email}</Data></Cell>
    <Cell><Data ss:Type="String">${patient.telephone}</Data></Cell>
    <Cell><Data ss:Type="String">${new Date(patient.date_naissance).toLocaleDateString()}</Data></Cell>
    <Cell><Data ss:Type="String">${patient.adresse || ""}</Data></Cell>
   </Row>`
      })

      // Close tags
      excelContent += `
  </Table>
 </Worksheet>
</Workbook>`

      // Download the Excel file
      downloadFile(
        excelContent,
        `patients_export_${new Date().toISOString().split("T")[0]}.xls`,
        "application/vnd.ms-excel",
      )
    } catch (error) {
      console.error("Error generating Excel:", error)
    } finally {
      setExportLoading(null)
    }
  }

  // Export data in different formats
  const exportData = (format: "csv" | "pdf" | "excel") => {
    if (format === "csv") {
      // Create CSV content
      const headers = ["ID", "Name", "Age", "Email", "Phone", "Birth Date", "Address"]
      const csvContent = [
        headers.join(","),
        ...filteredPatients.map(
          (patient) =>
            `${patient.id},"${patient.prenom} ${patient.nom}",${calculateAge(patient.date_naissance)},"${
              patient.email
            }","${patient.telephone}","${patient.date_naissance}","${patient.adresse || ""}"`,
        ),
      ].join("\n")

      // Download the CSV file
      downloadFile(
        csvContent,
        `patients_export_${new Date().toISOString().split("T")[0]}.csv`,
        "text/csv;charset=utf-8",
      )
    } else if (format === "pdf") {
      generatePDF()
    } else if (format === "excel") {
      generateExcel()
    }
  }

  const renderSkeletonTable = () => (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <Card className="dark:bg-gray-800 dark:text-gray-100 shadow-sm">
        <CardHeader className="pb-2 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">{dictionary.dashboard.patientList}</CardTitle>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder={dictionary.dashboard.searchPatients}
                  className="w-full md:w-64 pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={viewMode === "table" ? "bg-gray-100" : ""}
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={viewMode === "grid" ? "bg-gray-100" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={exportLoading !== null}>
                      {exportLoading ? (
                        <>
                          <span className="animate-spin mr-1">⏳</span>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportData("csv")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportData("excel")}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportData("pdf")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium dark:text-gray-300">{dictionary.dashboard.filters}:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={filters.ageGroup} onValueChange={(value) => handleFilterChange("ageGroup", value)}>
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Select Age Group" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="under18">Under 18</SelectItem>
                  <SelectItem value="18to29">18-29</SelectItem>
                  <SelectItem value="30to49">30-49</SelectItem>
                  <SelectItem value="50to64">50-64</SelectItem>
                  <SelectItem value="65plus">65+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="email">Sort by Email</SelectItem>
                  <SelectItem value="age">Sort by Age</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortOrder}
                onValueChange={(value) => handleFilterChange("sortOrder", value as "asc" | "desc")}
              >
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline md:ml-auto"
              >
                Clear All
              </button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {filter}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => clearFilter(filter)} />
                </span>
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">{renderSkeletonTable()}</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">No patients found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse dark:text-gray-100" dir={dir}>
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.photo}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.name}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.age}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.email}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.phone}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                          {patient.photo ? (
                            <Image
                              src={
                                patient.photo.startsWith("http")
                                  ? patient.photo
                                  : `http://localhost:8000${patient.photo}`
                              }
                              alt={`${patient.prenom} ${patient.nom}`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {patient.prenom[0]}
                              {patient.nom[0]}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {patient.prenom} {patient.nom}
                      </td>
                      <td className="py-3 px-4">
                        {calculateAge(patient.date_naissance)} {dictionary.dashboard.years}
                      </td>
                      <td className="py-3 px-4">{patient.email}</td>
                      <td className="py-3 px-4">{patient.telephone}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewPatient(patient.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setPatientToDelete(patient)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {pageItems.map((patient) => (
                <Card key={patient.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                        {patient.photo ? (
                          <Image
                            src={
                              patient.photo.startsWith("http") ? patient.photo : `http://localhost:8000${patient.photo}`
                            }
                            alt={`${patient.prenom} ${patient.nom}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl">
                            {patient.prenom[0]}
                            {patient.nom[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {patient.prenom} {patient.nom}
                        </h3>
                        <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                          {calculateAge(patient.date_naissance)} {dictionary.dashboard.years}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {patient.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {patient.telephone}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(patient.date_naissance)}
                      </div>
                    </div>
                  </div>

                  <div className="border-t p-2 bg-gray-50 flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setPatientToDelete(patient)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="border-t py-4 bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {dictionary.dashboard.showing} {first + 1} {dictionary.dashboard.to}{" "}
                {Math.min(last, filteredPatients.length)} {dictionary.dashboard.of} {filteredPatients.length}{" "}
                {dictionary.dashboard.patients}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Patient Detail Dialog - High Contrast Design */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="p-0 max-w-[700px] max-h-[90vh] overflow-hidden rounded-lg">
          {patientDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-gray-500 mb-4" />
              <p className="text-lg font-medium">Loading patient details...</p>
            </div>
          ) : selectedPatient ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Patient Profile</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-gray-800"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Patient info header */}
              <div className="bg-gray-800 text-white p-6 flex items-center gap-4">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-700">
                  {selectedPatient.photo ? (
                    <Image
                      src={
                        selectedPatient.photo.startsWith("http")
                          ? selectedPatient.photo
                          : `http://localhost:8000${selectedPatient.photo}`
                      }
                      alt={`${selectedPatient.prenom} ${selectedPatient.nom}`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-600 text-white text-3xl font-bold">
                      {selectedPatient.prenom?.[0] || ""}
                      {selectedPatient.nom?.[0] || ""}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPatient.prenom} {selectedPatient.nom}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-gray-700 hover:bg-gray-600 text-white">
                      {calculateAge(selectedPatient.date_naissance)} years old
                    </Badge>
                    {selectedPatient.groupe_sanguin && (
                      <Badge className="bg-gray-700 hover:bg-gray-600 text-white">
                        Blood: {selectedPatient.groupe_sanguin}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Content area with white background */}
              <div className="bg-white p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-900 text-white p-2 rounded-full">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date of Birth</p>
                            <p className="font-semibold text-gray-900">{formatDate(selectedPatient.date_naissance)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-900 text-white p-2 rounded-full">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">{selectedPatient.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-900 text-white p-2 rounded-full">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-semibold text-gray-900">{selectedPatient.telephone}</p>
                          </div>
                        </div>
                      </div>

                      {selectedPatient.adresse && (
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="bg-gray-900 text-white p-2 rounded-full mt-0.5">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-semibold text-gray-900">{selectedPatient.adresse}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Medical Information</h3>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-5 w-5 text-gray-900" />
                          <h4 className="font-bold text-gray-900">Blood Group</h4>
                        </div>
                        <p className="ml-7 text-gray-900">{selectedPatient.groupe_sanguin || "Not specified"}</p>
                      </div>

                      {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-gray-900" />
                            <h4 className="font-bold text-gray-900">Allergies</h4>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {selectedPatient.allergies.map((allergy, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block h-2 w-2 rounded-full bg-gray-900 mt-1.5 mr-2"></span>
                                <span className="text-gray-900">{allergy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedPatient.maladies_chroniques && selectedPatient.maladies_chroniques.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-gray-900" />
                            <h4 className="font-bold text-gray-900">Chronic Diseases</h4>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {selectedPatient.maladies_chroniques.map((disease, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block h-2 w-2 rounded-full bg-gray-900 mt-1.5 mr-2"></span>
                                <span className="text-gray-900">{disease}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedPatient.antecedents_medicaux && selectedPatient.antecedents_medicaux.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-gray-900" />
                            <h4 className="font-bold text-gray-900">Medical History</h4>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {selectedPatient.antecedents_medicaux.map((history, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block h-2 w-2 rounded-full bg-gray-900 mt-1.5 mr-2"></span>
                                <span className="text-gray-900">{history}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Last Visit Information */}
                  {selectedPatient.derniere_visite && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Last Visit</h3>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-gray-900" />
                          <p className="font-semibold text-gray-900">{formatDate(selectedPatient.derniere_visite)}</p>
                        </div>
                        {selectedPatient.medecin_traitant && (
                          <div className="flex items-center gap-2 mt-3">
                            <User className="h-5 w-5 text-gray-900" />
                            <div>
                              <p className="text-sm text-gray-500">Attending Physician</p>
                              <p className="font-semibold text-gray-900">{selectedPatient.medecin_traitant}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-4 flex justify-end bg-gray-100">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Failed to load patient details</h3>
              <p className="text-gray-500 mb-8 text-center">
                Please try again or contact support if the problem persists.
              </p>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-full bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center">Delete Patient</h2>
            <p className="text-center text-gray-500">
              Are you sure you want to delete {patientToDelete?.prenom} {patientToDelete?.nom}? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setPatientToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => patientToDelete && handleDeletePatient(patientToDelete.id)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Patient"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
