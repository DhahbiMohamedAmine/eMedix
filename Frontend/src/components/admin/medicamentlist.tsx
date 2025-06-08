"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Grid,
  List,
  Eye,
  FileText,
  FileSpreadsheet,
  Pill,
} from "lucide-react"
import { useDictionary } from "@/components/admin/dictionary-provider"

type Medicament = {
  id: number
  name: string
  description?: string
  dosage?: string
  price?: number
  stock?: number
  image?: string
  duration?: string
  legal?: boolean
}

type Notification = {
  id: string
  message: string
  type: "success" | "error"
}

type SortField = "name" | "price" | "stock" | "dosage"
type SortDirection = "asc" | "desc"

type FilterState = {
  dosage: string
  sortBy: SortField
  sortOrder: SortDirection
}

export function MedicamentsList() {
  const [medicaments, setMedicaments] = useState<Medicament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null)
  const [medicamentDetailLoading, setMedicamentDetailLoading] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const itemsPerPage = 8

  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [restockQuantity, setRestockQuantity] = useState<number>(0)
  const [currentRestockMedicament, setCurrentRestockMedicament] = useState<Medicament | null>(null)
  const [currentMedicament, setCurrentMedicament] = useState<Medicament | null>(null)
  const [formData, setFormData] = useState<Partial<Medicament>>({
    name: "",
    description: "",
    dosage: "",
    price: undefined,
    stock: undefined,
    image: "",
    duration: "",
    legal: true, // Default to legal
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    dosage: "all",
    sortBy: "name",
    sortOrder: "asc",
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Backend URL validation and construction
  const getBackendUrl = () => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    try {
      new URL(url) // Validate URL
      return url
    } catch {
      console.warn("Invalid backend URL, falling back to localhost")
      return "http://localhost:8000"
    }
  }

  const BACKEND_URL = getBackendUrl()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dictionary = useDictionary()

  // Helper function to safely construct image URLs for LIST DISPLAY ONLY (matches doctor list pattern)
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null

    try {
      // If it's already a complete URL, return as is
      if (imagePath.startsWith("http")) return imagePath

      // If it's a relative path, construct with backend URL
      const formattedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
      return `${BACKEND_URL}${formattedPath}`
    } catch (error) {
      console.error("Error formatting image URL:", error)
      return null
    }
  }

  // Helper function to safely create object URLs (for form previews only)
  const createObjectUrl = (file: File) => {
    try {
      return URL.createObjectURL(file)
    } catch (error) {
      console.error("Failed to create object URL:", error)
      return null
    }
  }

  // Clean up object URLs when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 3000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const fetchMedicaments = async () => {
    try {
      setLoading(true)
      const url = `${BACKEND_URL}/medicaments`

      // Validate URL before making request
      new URL(url)

      const res = await fetch(url, {
        cache: "no-cache",
      })

      if (!res.ok) throw new Error(`Failed to fetch medicaments: ${res.status}`)
      const data = await res.json()
      setMedicaments(data)
    } catch (error) {
      console.error("Error fetching medicaments:", error)
      showNotification("Failed to load medications", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicaments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle image error
  const handleImageError = (medicamentId: number) => {
    console.error(`Image failed to load for medicament ID: ${medicamentId}`)
    setImageErrors((prev) => ({
      ...prev,
      [medicamentId]: true,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "price" || name === "stock") {
      setFormData({
        ...formData,
        [name]: value === "" ? undefined : Number(value),
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean up previous preview URL
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview URL safely
      const previewUrl = createObjectUrl(file)
      setImagePreviewUrl(previewUrl)
    } else {
      setImageFile(null)
      setImagePreviewUrl(null)
    }
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value === "true",
    })
  }

  const resetForm = () => {
    // Clean up preview URL
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    setFormData({
      name: "",
      description: "",
      dosage: "",
      price: undefined,
      stock: undefined,
      image: "",
      duration: "",
      legal: true, // Reset to default (legal)
    })
    setImageFile(null)
    setImagePreviewUrl(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (medicament: Medicament) => {
    setCurrentMedicament(medicament)
    setFormData({
      name: medicament.name,
      description: medicament.description || "",
      dosage: medicament.dosage || "",
      price: medicament.price,
      stock: medicament.stock,
      image: medicament.image || "",
      duration: medicament.duration || "",
      legal: medicament.legal,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (medicament: Medicament) => {
    setCurrentMedicament(medicament)
    setIsDeleteDialogOpen(true)
  }

  const handleViewMedicament = async (medicament: Medicament) => {
    try {
      setMedicamentDetailLoading(true)
      setDetailDialogOpen(true)

      const url = `${BACKEND_URL}/medicaments/${medicament.id}`
      new URL(url) // Validate URL

      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setSelectedMedicament(data)
    } catch (err) {
      console.error("Failed to fetch medicament details:", err)
      showNotification("Failed to load medication details", "error")
    } finally {
      setMedicamentDetailLoading(false)
    }
  }

  const handleAddMedicament = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      showNotification("Medication name is required", "error")
      return
    }

    try {
      setIsSubmitting(true)

      let imageUrl = ""
      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append("file", imageFile)

        const uploadUrl = `${BACKEND_URL}/medicaments/upload-medicament-image`
        new URL(uploadUrl) // Validate URL

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: imageFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadResult = await uploadResponse.json()
        imageUrl = uploadResult.image_path
      }

      const medicamentData = {
        name: formData.name,
        description: formData.description || "",
        dosage: formData.dosage || "",
        price: formData.price || 0,
        stock: formData.stock || 0,
        image: imageUrl || formData.image || "",
        duration: formData.duration || "",
        legal: formData.legal !== undefined ? formData.legal : true,
      }

      const createUrl = `${BACKEND_URL}/medicaments`
      new URL(createUrl) // Validate URL

      const response = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicamentData),
      })

      if (!response.ok) {
        throw new Error("Failed to add medication")
      }

      const newMedicament = await response.json()
      setMedicaments((prev) => [...prev, newMedicament])
      showNotification(`${newMedicament.name} has been added successfully`)

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error adding medicament:", error)
      showNotification(error instanceof Error ? error.message : "Failed to add medication", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateMedicament = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentMedicament || !formData.name) {
      showNotification("Medication data is invalid", "error")
      return
    }

    try {
      setIsSubmitting(true)

      let imageUrl = formData.image
      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append("file", imageFile)

        const uploadUrl = `${BACKEND_URL}/medicaments/upload-medicament-image`
        new URL(uploadUrl) // Validate URL

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: imageFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadResult = await uploadResponse.json()
        imageUrl = uploadResult.image_path
      }

      const medicamentData = {
        price: formData.price || 0,
        dosage: formData.dosage || "",
        stock: formData.stock || 0,
        image: imageUrl || "",
        duration: formData.duration || "",
        legal: formData.legal !== undefined ? formData.legal : true,
      }

      const updateUrl = `${BACKEND_URL}/medicaments/${currentMedicament.id}`
      new URL(updateUrl) // Validate URL

      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicamentData),
      })

      if (!response.ok) {
        throw new Error("Failed to update medication")
      }

      const updatedMedicament = await response.json()
      setMedicaments((prev) => prev.map((med) => (med.id === updatedMedicament.id ? updatedMedicament : med)))

      showNotification(`${updatedMedicament.name} has been updated successfully`)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating medicament:", error)
      showNotification(error instanceof Error ? error.message : "Failed to update medication", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMedicament = async () => {
    if (!currentMedicament) {
      showNotification("No medication selected for deletion", "error")
      return
    }

    try {
      setIsSubmitting(true)

      const deleteUrl = `${BACKEND_URL}/medicaments/${currentMedicament.id}`
      new URL(deleteUrl) // Validate URL

      const response = await fetch(deleteUrl, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete medication")
      }

      setMedicaments((prev) => prev.filter((med) => med.id !== currentMedicament.id))
      showNotification(`${currentMedicament.name} has been deleted successfully`)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting medicament:", error)
      showNotification(error instanceof Error ? error.message : "Failed to delete medication", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRestockDialog = (medicament: Medicament) => {
    setCurrentRestockMedicament(medicament)
    setRestockQuantity(0)
    setIsRestockDialogOpen(true)
  }

  const handleRestockMedicament = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentRestockMedicament || restockQuantity <= 0) {
      showNotification("Please enter a valid quantity to restock", "error")
      return
    }

    try {
      setIsSubmitting(true)

      const newStock = (currentRestockMedicament.stock || 0) + restockQuantity
      const medicamentData = {
        price: currentRestockMedicament.price || 0,
        dosage: currentRestockMedicament.dosage || "",
        stock: newStock,
        image: currentRestockMedicament.image || "",
        duration: currentRestockMedicament.duration || "",
        legal: currentRestockMedicament.legal !== undefined ? currentRestockMedicament.legal : true,
      }

      const updateUrl = `${BACKEND_URL}/medicaments/${currentRestockMedicament.id}`
      new URL(updateUrl) // Validate URL

      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicamentData),
      })

      if (!response.ok) {
        throw new Error("Failed to restock medication")
      }

      const updatedMedicament = await response.json()
      setMedicaments((prev) => prev.map((med) => (med.id === updatedMedicament.id ? updatedMedicament : med)))

      showNotification(`${currentRestockMedicament.name} restocked successfully! Added ${restockQuantity} units.`)
      setIsRestockDialogOpen(false)
      setRestockQuantity(0)
      setCurrentRestockMedicament(null)
    } catch (error) {
      console.error("Error restocking medicament:", error)
      showNotification(error instanceof Error ? error.message : "Failed to restock medication", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Extract unique values for filters
  const uniqueDosages = useMemo(() => [...new Set(medicaments.map((m) => m.dosage))].filter(Boolean), [medicaments])

  // Update active filters display
  useEffect(() => {
    const newActiveFilters = []
    if (filters.dosage && filters.dosage !== "all") newActiveFilters.push(`Dosage: ${filters.dosage}`)
    setActiveFilters(newActiveFilters)
  }, [filters])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilter = (filter: string) => {
    const filterKey = filter.split(":")[0].trim().toLowerCase()
    if (filterKey === "dosage") {
      setFilters((prev) => ({ ...prev, dosage: "all" }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      dosage: "all",
      sortBy: "name",
      sortOrder: "asc",
    })
    setSearchTerm("")
  }

  // Apply filters and search
  const filteredMedicaments = useMemo(() => {
    let result = [...medicaments]

    if (searchTerm) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (filters.dosage && filters.dosage !== "all") {
      result = result.filter((m) => m.dosage === filters.dosage)
    }

    result.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "dosage":
          comparison = (a.dosage || "").localeCompare(b.dosage || "")
          break
        case "price":
          comparison = (a.price || 0) - (b.price || 0)
          break
        case "stock":
          comparison = (a.stock || 0) - (b.stock || 0)
          break
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [medicaments, searchTerm, filters])

  // Pagination
  const last = currentPage * itemsPerPage
  const first = last - itemsPerPage
  const pageItems = filteredMedicaments.slice(first, last)
  const totalPages = Math.ceil(filteredMedicaments.length / itemsPerPage)

  // Helper function to create and download a file
  const downloadFile = (content: string | Blob, fileName: string, mimeType: string) => {
    try {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", fileName)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download file:", error)
      showNotification("Failed to download file", "error")
    }
  }

  // Export data in different formats
  const exportData = (format: "csv" | "pdf" | "excel") => {
    if (format === "csv") {
      const headers = ["ID", "Name", "Description", "Dosage", "Price", "Stock"]
      const csvContent = [
        headers.join(","),
        ...filteredMedicaments.map(
          (med) =>
            `${med.id},"${med.name}","${med.description || ""}","${med.dosage || ""}","${med.price || 0}","${med.stock || 0}"`,
        ),
      ].join("\n")

      downloadFile(
        csvContent,
        `medications_export_${new Date().toISOString().split("T")[0]}.csv`,
        "text/csv;charset=utf-8",
      )
    } else if (format === "excel") {
      generateExcel()
    } else if (format === "pdf") {
      generatePDF()
    }
  }

  const generateExcel = async () => {
    try {
      setExportLoading("excel")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Medications">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Description</Data></Cell>
    <Cell><Data ss:Type="String">Dosage</Data></Cell>
    <Cell><Data ss:Type="String">Price</Data></Cell>
    <Cell><Data ss:Type="String">Stock</Data></Cell>
   </Row>`

      filteredMedicaments.forEach((med) => {
        excelContent += `
   <Row>
    <Cell><Data ss:Type="Number">${med.id}</Data></Cell>
    <Cell><Data ss:Type="String">${med.name}</Data></Cell>
    <Cell><Data ss:Type="String">${med.description || ""}</Data></Cell>
    <Cell><Data ss:Type="String">${med.dosage || ""}</Data></Cell>
    <Cell><Data ss:Type="Number">${med.price || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${med.stock || 0}</Data></Cell>
   </Row>`
      })

      excelContent += `
  </Table>
 </Worksheet>
</Workbook>`

      downloadFile(
        excelContent,
        `medications_export_${new Date().toISOString().split("T")[0]}.xls`,
        "application/vnd.ms-excel",
      )
    } catch (error) {
      console.error("Error generating Excel:", error)
      showNotification("Failed to generate Excel file", "error")
    } finally {
      setExportLoading(null)
    }
  }

  const generatePDF = async () => {
    try {
      setExportLoading("pdf")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      showNotification("PDF generation would be implemented with jsPDF in a real application")
    } catch (error) {
      console.error("Error generating PDF:", error)
      showNotification("Failed to generate PDF", "error")
    } finally {
      setExportLoading(null)
    }
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A"
    return `${price.toFixed(2)} DT`
  }

  const renderSkeletonTable = () => (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg transition-all animate-in slide-in-from-right-5
              ${
                notification.type === "success"
                  ? "bg-white border-l-4 border-blue-500"
                  : "bg-white border-l-4 border-red-500"
              }`}
          >
            <div className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center mr-3
                ${notification.type === "success" ? "bg-blue-100" : "bg-red-100"}`}
              >
                {notification.type === "success" ? (
                  <Check className="h-5 w-5 text-blue-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-gray-700">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="pb-2 border-b p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold">Medications Inventory</h2>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search medications..."
                    className="w-full md:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className={`px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center gap-1 ${
                      viewMode === "table" ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                    Table
                  </button>
                  <button
                    className={`px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center gap-1 ${
                      viewMode === "grid" ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                    Grid
                  </button>

                  <div className="relative group">
                    <button
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center gap-1"
                      disabled={exportLoading !== null}
                    >
                      {exportLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Export
                        </>
                      )}
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block z-10">
                      <div className="py-1">
                        <button
                          onClick={() => exportData("csv")}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export as CSV
                        </button>
                        <button
                          onClick={() => exportData("excel")}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as Excel
                        </button>
                        <button
                          onClick={() => exportData("pdf")}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={filters.dosage}
                  onChange={(e) => handleFilterChange("dosage", e.target.value)}
                >
                  <option value="all">All Dosages</option>
                  {uniqueDosages.map((dosage) => (
                    <option key={dosage} value={dosage}>
                      {dosage}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value as SortField)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="dosage">Sort by Dosage</option>
                  <option value="price">Sort by Price</option>
                  <option value="stock">Sort by Stock</option>
                </select>

                <select
                  className="w-full border rounded-md p-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange("sortOrder", e.target.value as SortDirection)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>

                <button
                  onClick={openAddDialog}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New Medication
                </button>
              </div>

              {activeFilters.length > 0 && (
                <button onClick={clearAllFilters} className="text-blue-600 text-sm hover:underline md:ml-auto">
                  Clear All
                </button>
              )}
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {filter}
                    <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => clearFilter(filter)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-0">
            {loading ? (
              <div className="p-6">{renderSkeletonTable()}</div>
            ) : filteredMedicaments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-medium">No medications found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Image</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Name</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Dosage</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Price</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Stock</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Legal Status</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((med) => {
                      const imageUrl = getImageUrl(med.image)

                      return (
                        <tr key={med.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                              {imageUrl && !imageErrors[med.id] ? (
                                <Image
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={med.name}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg"
                                    handleImageError(med.id)
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                                  {med.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{med.name}</td>
                          <td className="py-3 px-4">
                            {med.dosage ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {med.dosage}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">{formatPrice(med.price)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  med.stock === undefined
                                    ? "bg-gray-100 text-gray-600"
                                    : med.stock === 0
                                      ? "bg-red-100 text-red-700"
                                      : med.stock < 10
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                              {med.stock === undefined ? "N/A" : med.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {med.legal !== undefined ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  med.legal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {med.legal ? "Legal" : "need prescription"}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleViewMedicament(med)}
                                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditDialog(med)}
                                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteDialog(med)}
                                className="p-1 rounded-md text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openRestockDialog(med)}
                                className="p-1 rounded-md text-green-500 hover:bg-green-50"
                                title="Restock"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {pageItems.map((med) => {
                  const imageUrl = getImageUrl(med.image)

                  return (
                    <div key={med.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                            {imageUrl && !imageErrors[med.id] ? (
                              <Image
                                src={imageUrl || "/placeholder.svg"}
                                alt={med.name}
                                width={64}
                                height={64}
                                unoptimized
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                  handleImageError(med.id)
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl">
                                {med.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{med.name}</h3>
                            {med.dosage && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1">
                                {med.dosage}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Price:</span>
                            <span className="font-medium">{formatPrice(med.price)}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Stock:</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  med.stock === undefined
                                    ? "bg-gray-100 text-gray-600"
                                    : med.stock === 0
                                      ? "bg-red-100 text-red-700"
                                      : med.stock < 10
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                              {med.stock === undefined ? "N/A" : med.stock}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Legal Status:</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  med.legal === undefined
                                    ? "bg-gray-100 text-gray-600"
                                    : med.legal
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                            >
                              {med.legal === undefined ? "N/A" : med.legal ? "Legal" : "need prescription"}
                            </span>
                          </div>
                          {med.description && (
                            <div className="text-gray-600 mt-2">
                              <p className="line-clamp-2">{med.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t p-2 bg-gray-50 flex justify-end gap-1">
                        <button
                          onClick={() => handleViewMedicament(med)}
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(med)}
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(med)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openRestockDialog(med)}
                          className="p-1 rounded-md text-green-500 hover:bg-green-50"
                          title="Restock"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t py-4 px-6 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {first + 1} to {Math.min(last, filteredMedicaments.length)} of {filteredMedicaments.length}{" "}
                medications
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>
                <button
                  className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add New Medication</h3>
              <button onClick={() => setIsAddDialogOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMedicament}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700 text-right">
                    Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700 text-right pt-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="dosage" className="text-sm font-medium text-gray-700 text-right">
                    Dosage
                  </label>
                  <input
                    id="dosage"
                    name="dosage"
                    type="text"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-sm font-medium text-gray-700 text-right">
                    Price (DT)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price === undefined ? "" : formData.price}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="stock" className="text-sm font-medium text-gray-700 text-right">
                    Stock
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock === undefined ? "" : formData.stock}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="duration" className="text-sm font-medium text-gray-700 text-right">
                    Duration
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    type="text"
                    value={formData.duration || ""}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 7 days"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 text-right">Legal Status</label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="legal-yes"
                        name="legal"
                        type="radio"
                        value="true"
                        checked={formData.legal === true}
                        onChange={handleRadioChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="legal-yes" className="ml-2 block text-sm text-gray-700">
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="legal-no"
                        name="legal"
                        type="radio"
                        value="false"
                        checked={formData.legal === false}
                        onChange={handleRadioChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="legal-no" className="ml-2 block text-sm text-gray-700">
                        NO
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="image" className="text-sm font-medium text-gray-700 text-right">
                    Image
                  </label>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {imagePreviewUrl && (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={imagePreviewUrl || "/placeholder.svg"}
                            alt="Preview"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="inline mr-2 h-4 w-4" />
                      Add Medication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medication Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Edit Medication</h3>
              <button onClick={() => setIsEditDialogOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateMedicament}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-name" className="text-sm font-medium text-gray-700 text-right">
                    Name *
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="edit-description" className="text-sm font-medium text-gray-700 text-right pt-2">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-dosage" className="text-sm font-medium text-gray-700 text-right">
                    Dosage
                  </label>
                  <input
                    id="edit-dosage"
                    name="dosage"
                    type="text"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-price" className="text-sm font-medium text-gray-700 text-right">
                    Price (DT)
                  </label>
                  <input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price === undefined ? "" : formData.price}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-stock" className="text-sm font-medium text-gray-700 text-right">
                    Stock
                  </label>
                  <input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock === undefined ? "" : formData.stock}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-duration" className="text-sm font-medium text-gray-700 text-right">
                    Duration
                  </label>
                  <input
                    id="edit-duration"
                    name="duration"
                    type="text"
                    value={formData.duration || ""}
                    onChange={handleInputChange}
                    className="col-span-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 7 days"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 text-right">Legal Status</label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="edit-legal-yes"
                        name="legal"
                        type="radio"
                        value="true"
                        checked={formData.legal === true}
                        onChange={handleRadioChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="edit-legal-yes" className="ml-2 block text-sm text-gray-700">
                        yes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="edit-legal-no"
                        name="legal"
                        type="radio"
                        value="false"
                        checked={formData.legal === false}
                        onChange={handleRadioChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="edit-legal-no" className="ml-2 block text-sm text-gray-700">
                        No
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-image" className="text-sm font-medium text-gray-700 text-right">
                    Image
                  </label>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {imagePreviewUrl ? (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={imagePreviewUrl || "/placeholder.svg"}
                            alt="Preview"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : formData.image ? (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={getImageUrl(formData.image) || "/placeholder.svg?height=40&width=40"}
                            alt="Current"
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="inline mr-2 h-4 w-4" />
                      Update Medication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete {currentMedicament?.name} from your inventory. This action cannot be
                undone.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedicament}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="inline mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medication Detail Dialog */}
      {detailDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {medicamentDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500 mb-4" />
                <p className="text-lg font-medium">Loading medication details...</p>
              </div>
            ) : selectedMedicament ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Medication Details</h2>
                  <button
                    onClick={() => setDetailDialogOpen(false)}
                    className="text-white hover:bg-gray-800 p-1 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Medication info header */}
                <div className="bg-gray-800 text-white p-6 flex items-center gap-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-700">
                    {selectedMedicament.image ? (
                      <Image
                        src={getImageUrl(selectedMedicament.image) || "/placeholder.svg?height=96&width=96"}
                        alt={selectedMedicament.name}
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                          handleImageError(selectedMedicament.id)
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-600 text-white text-3xl font-bold">
                        {selectedMedicament.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMedicament.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMedicament.dosage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">
                          {selectedMedicament.dosage}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">
                        ID: {selectedMedicament.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="bg-white p-6 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-900 text-white p-2 rounded-full">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Price</p>
                              <p className="font-semibold text-gray-900">{formatPrice(selectedMedicament.price)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-900 text-white p-2 rounded-full">
                              <ChevronUp className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Stock</p>
                              <p className="font-semibold text-gray-900">
                                {selectedMedicament.stock === undefined ? "N/A" : selectedMedicament.stock}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className={`text-white p-2 rounded-full ${selectedMedicament.legal ? "bg-green-600" : "bg-red-600"}`}
                            >
                              <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Legal Status</p>
                              <p className="font-semibold text-gray-900">
                                {selectedMedicament.legal === undefined
                                  ? "Not specified"
                                  : selectedMedicament.legal
                                    ? "Legal Medication"
                                    : "Controlled Substance"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedMedicament.description && (
                      <div>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">Description</h3>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-gray-900">{selectedMedicament.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4 flex justify-end bg-gray-100">
                  <button
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md"
                    onClick={() => setDetailDialogOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-red-500 mb-4">
                  <AlertCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">Failed to load medication details</h3>
                <p className="text-gray-500 mb-8 text-center">
                  Please try again or contact support if the problem persists.
                </p>
                <button
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restock Medication Dialog */}
      {isRestockDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Restock Medication</h3>
              <button onClick={() => setIsRestockDialogOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRestockMedicament}>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">{currentRestockMedicament?.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Current stock: <span className="font-medium">{currentRestockMedicament?.stock || 0}</span> units
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="restock-quantity" className="block text-sm font-medium text-gray-700">
                    Quantity to Add
                  </label>
                  <input
                    id="restock-quantity"
                    type="number"
                    min="1"
                    value={restockQuantity || ""}
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity to add"
                    required
                  />
                </div>

                {restockQuantity > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">
                      New stock will be:{" "}
                      <span className="font-medium">{(currentRestockMedicament?.stock || 0) + restockQuantity}</span>{" "}
                      units
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || restockQuantity <= 0}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      Restocking...
                    </>
                  ) : (
                    <>
                      <Plus className="inline mr-2 h-4 w-4" />
                      Restock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
