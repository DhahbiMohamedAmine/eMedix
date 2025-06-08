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
  GraduationCap,
  Loader2,
  UserCog,
  Award,
  AlertCircle,
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

interface Doctor {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  photo: string
  ville: string
  adresse: string
  grade: string
  diplome: string
}

// Extended doctor interface for detailed view
interface DoctorDetail extends Doctor {
  dateNaissance?: string
  specialite?: string
  experience?: number
  description?: string
  education?: string[]
  certifications?: string[]
}

interface FilterState {
  grade: string
  city: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [filters, setFilters] = useState<FilterState>({
    grade: "all",
    city: "all",
    sortBy: "name",
    sortOrder: "asc",
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetail | null>(null)
  const [doctorDetailLoading, setDoctorDetailLoading] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const itemsPerPage = 8

  const dictionary = useDictionary()
  const { dir } = useLanguage()

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true)
        const res = await fetch("http://localhost:8000/stats/doctors")
        if (!res.ok) throw new Error(`Error ${res.status}`)

        const data: Doctor[] = await res.json()
        setDoctors(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch doctors:", err)
        setError("Failed to load doctors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  // Function to fetch doctor details
  const fetchDoctorDetails = async (doctorId: number) => {
    try {
      setDoctorDetailLoading(true)
      setDetailDialogOpen(true) // Open dialog immediately to show loading state

      console.log(`Fetching doctor details for ID: ${doctorId}`)
      const res = await fetch(`http://localhost:8000/users/medecin/${doctorId}`)

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log("Doctor details received:", data)
      setSelectedDoctor(data)
    } catch (err) {
      console.error("Failed to fetch doctor details:", err)
      alert("Failed to load doctor details. Please try again.")
    } finally {
      setDoctorDetailLoading(false)
    }
  }

  const handleDeleteDoctor = async (doctorId: number) => {
    try {
      setDeleteLoading(true)

      const res = await fetch(`http://localhost:8000/users/medecin/${doctorId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      // Remove the deleted doctor from the state
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId))
      setDeleteDialogOpen(false)
      setDoctorToDelete(null)

      // Show success message (you could use a toast notification here)
      alert("Doctor deleted successfully")
    } catch (err) {
      console.error("Failed to delete doctor:", err)
      alert("Failed to delete doctor. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle view doctor details
  const handleViewDoctor = (doctorId: number) => {
    fetchDoctorDetails(doctorId)
  }

  // Extract unique values for filters
  const uniqueGrades = useMemo(() => [...new Set(doctors.map((d) => d.grade))].filter(Boolean), [doctors])

  const uniqueCities = useMemo(() => [...new Set(doctors.map((d) => d.ville))].filter(Boolean), [doctors])

  // Apply filters and search
  const filteredDoctors = useMemo(() => {
    let result = [...doctors]

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (d) =>
          d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply grade filter
    if (filters.grade && filters.grade !== "all") {
      result = result.filter((d) => d.grade === filters.grade)
    }

    // Apply city filter
    if (filters.city && filters.city !== "all") {
      result = result.filter((d) => d.ville === filters.city)
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
        case "city":
          comparison = a.ville.localeCompare(b.ville)
          break
        case "grade":
          comparison = a.grade.localeCompare(b.grade)
          break
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [doctors, searchTerm, filters])

  // Update active filters display
  useEffect(() => {
    const newActiveFilters = []

    if (filters.grade && filters.grade !== "all") newActiveFilters.push(`Grade: ${filters.grade}`)
    if (filters.city && filters.city !== "all") newActiveFilters.push(`City: ${filters.city}`)

    setActiveFilters(newActiveFilters)
  }, [filters])

  // Pagination
  const last = currentPage * itemsPerPage
  const first = last - itemsPerPage
  const pageItems = filteredDoctors.slice(first, last)
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilter = (filter: string) => {
    const filterKey = filter.split(":")[0].trim().toLowerCase()
    if (filterKey === "grade") {
      setFilters((prev) => ({ ...prev, grade: "all" }))
    } else if (filterKey === "city") {
      setFilters((prev) => ({ ...prev, city: "all" }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      grade: "all",
      city: "all",
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
      doc.text(`Doctors Export - ${new Date().toLocaleDateString()}`, 14, 15)

      // Define the column type with proper typing
      type ColumnDef = {
        header: string
        dataKey: keyof DoctorRow
      }

      // Define the row data type that will be used in the table
      type DoctorRow = {
        id: number
        name: string
        email: string
        phone: string
        city: string
        grade: string
      }

      // Define the columns for the table with proper typing
      const columns: ColumnDef[] = [
        { header: "ID", dataKey: "id" },
        { header: "Name", dataKey: "name" },
        { header: "Email", dataKey: "email" },
        { header: "Phone", dataKey: "phone" },
        { header: "City", dataKey: "city" },
        { header: "Grade", dataKey: "grade" },
      ]

      // Prepare the data for the table with the correct type
      const data: DoctorRow[] = filteredDoctors.map((doc) => ({
        id: doc.id,
        name: `${doc.prenom} ${doc.nom}`,
        email: doc.email,
        phone: doc.telephone,
        city: doc.ville,
        grade: doc.grade,
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
      doc.save(`doctors_export_${new Date().toISOString().split("T")[0]}.pdf`)
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
 <Worksheet ss:Name="Doctors">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">City</Data></Cell>
    <Cell><Data ss:Type="String">Address</Data></Cell>
    <Cell><Data ss:Type="String">Grade</Data></Cell>
    <Cell><Data ss:Type="String">Diploma</Data></Cell>
   </Row>`

      // Add data rows
      filteredDoctors.forEach((doc) => {
        excelContent += `
   <Row>
    <Cell><Data ss:Type="Number">${doc.id}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.prenom} ${doc.nom}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.email}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.telephone}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.ville}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.adresse}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.grade}</Data></Cell>
    <Cell><Data ss:Type="String">${doc.diplome}</Data></Cell>
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
        `doctors_export_${new Date().toISOString().split("T")[0]}.xls`,
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
      const headers = ["ID", "Name", "Email", "Phone", "City", "Address", "Grade", "Diploma"]
      const csvContent = [
        headers.join(","),
        ...filteredDoctors.map(
          (doc) =>
            `${doc.id},"${doc.prenom} ${doc.nom}","${doc.email}","${doc.telephone}","${doc.ville}","${doc.adresse}","${doc.grade}","${doc.diplome}"`,
        ),
      ].join("\n")

      // Download the CSV file
      downloadFile(csvContent, `doctors_export_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8")
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            <CardTitle className="text-lg font-semibold">{dictionary.dashboard.doctorsList}</CardTitle>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder={dictionary.dashboard.searchDoctors}
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

        {/* Filter Section */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium dark:text-gray-300">{dictionary.dashboard.filters}:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select value={filters.grade} onValueChange={(value) => handleFilterChange("grade", value)}>
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder={dictionary.dashboard.selectGrade} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder={dictionary.dashboard.selectCity} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="email">Sort by Email</SelectItem>
                  <SelectItem value="city">Sort by City</SelectItem>
                  <SelectItem value="grade">Sort by Grade</SelectItem>
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
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">No doctors found</h3>
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
                      {dictionary.dashboard.email}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.phone}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.city}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.grade}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                          {doc.photo ? (
                            <Image
                              src={doc.photo.startsWith("http") ? doc.photo : `http://localhost:8000${doc.photo}`}
                              alt={`${doc.prenom} ${doc.nom}`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {doc.prenom[0]}
                              {doc.nom[0]}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {doc.prenom} {doc.nom}
                      </td>
                      <td className="py-3 px-4">{doc.email}</td>
                      <td className="py-3 px-4">{doc.telephone}</td>
                      <td className="py-3 px-4">{doc.ville}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {doc.grade}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDoctor(doc.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDoctorToDelete(doc)
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
              {pageItems.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                        {doc.photo ? (
                          <Image
                            src={doc.photo.startsWith("http") ? doc.photo : `http://localhost:8000${doc.photo}`}
                            alt={`${doc.prenom} ${doc.nom}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl">
                            {doc.prenom[0]}
                            {doc.nom[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {doc.prenom} {doc.nom}
                        </h3>
                        <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                          {doc.grade}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {doc.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {doc.telephone}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {doc.ville}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        {doc.diplome}
                      </div>
                    </div>
                  </div>

                  <div className="border-t p-2 bg-gray-50 flex justify-end space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDoctor(doc.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setDoctorToDelete(doc)
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
                {Math.min(last, filteredDoctors.length)} {dictionary.dashboard.of} {filteredDoctors.length}{" "}
                {dictionary.dashboard.doctors}
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

      {/* Doctor Detail Dialog - High Contrast Design */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="p-0 max-w-[700px] max-h-[90vh] overflow-hidden rounded-lg">
          {doctorDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-gray-500 mb-4" />
              <p className="text-lg font-medium">Loading doctor details...</p>
            </div>
          ) : selectedDoctor ? (
            <div className="flex flex-col h-full">
              {/* Header - simplified without status */}
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Doctor Profile</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-gray-800"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Doctor info header - without ID badge */}
              <div className="bg-gray-800 text-white p-6 flex items-center gap-4">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-700">
                  {selectedDoctor.photo ? (
                    <Image
                      src={
                        selectedDoctor.photo.startsWith("http")
                          ? selectedDoctor.photo
                          : `http://localhost:8000${selectedDoctor.photo}`
                      }
                      alt={`${selectedDoctor.prenom} ${selectedDoctor.nom}`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-600 text-white text-3xl font-bold">
                      {selectedDoctor.prenom?.[0] || ""}
                      {selectedDoctor.nom?.[0] || ""}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedDoctor.prenom} {selectedDoctor.nom}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-gray-700 hover:bg-gray-600 text-white">{selectedDoctor.grade}</Badge>
                    {selectedDoctor.specialite && (
                      <Badge className="bg-gray-700 hover:bg-gray-600 text-white">{selectedDoctor.specialite}</Badge>
                    )}
                    {selectedDoctor.experience !== undefined && (
                      <Badge className="bg-gray-700 hover:bg-gray-600 text-white">
                        {selectedDoctor.experience} years experience
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Content area with white background */}
              <div className="bg-white p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-900 text-white p-2 rounded-full">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">{selectedDoctor.email}</p>
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
                            <p className="font-semibold text-gray-900">{selectedDoctor.telephone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="bg-gray-900 text-white p-2 rounded-full mt-0.5">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-semibold text-gray-900">
                              {selectedDoctor.ville}
                              {selectedDoctor.adresse && (
                                <>
                                  <br />
                                  {selectedDoctor.adresse}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Education & Qualifications */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Education & Qualifications</h3>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-gray-900" />
                          <h4 className="font-bold text-gray-900">Diploma</h4>
                        </div>
                        <p className="ml-7 text-gray-900">{selectedDoctor.diplome || "Not specified"}</p>
                      </div>

                      {selectedDoctor.education && selectedDoctor.education.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-5 w-5 text-gray-900" />
                            <h4 className="font-bold text-gray-900">Education History</h4>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {selectedDoctor.education.map((edu, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block h-2 w-2 rounded-full bg-gray-900 mt-1.5 mr-2"></span>
                                <span className="text-gray-900">{edu}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-5 w-5 text-gray-900" />
                            <h4 className="font-bold text-gray-900">Certifications</h4>
                          </div>
                          <ul className="ml-7 space-y-2">
                            {selectedDoctor.certifications.map((cert, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block h-2 w-2 rounded-full bg-gray-900 mt-1.5 mr-2"></span>
                                <span className="text-gray-900">{cert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About / Description */}
                  {selectedDoctor.description && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">About</h3>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedDoctor.description}</p>
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
              <h3 className="text-xl font-bold mb-2 text-center">Failed to load doctor details</h3>
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
            <h2 className="text-xl font-bold text-center">Delete Doctor</h2>
            <p className="text-center text-gray-500">
              Are you sure you want to delete {doctorToDelete?.prenom} {doctorToDelete?.nom}? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setDoctorToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => doctorToDelete && handleDeleteDoctor(doctorToDelete.id)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Doctor"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
