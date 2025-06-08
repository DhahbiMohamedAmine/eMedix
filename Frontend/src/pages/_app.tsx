"use client"

import type { AppProps } from "next/app"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

interface User {
  role: string
  nom: string
  prenom: string
}

// Pages that don't need protection (exact matches)
const PUBLIC_PAGES = ["/login", "/register", "/home", "/forgot-password", "/request-reset-password"]

// Page patterns that don't need protection (for dynamic routes)
const PUBLIC_PAGE_PATTERNS = [
  "/reset-password", // This will match /reset-password/anything
]

// Function to check if a path is public
function isPublicPage(currentPath: string): boolean {
  // Check exact matches first
  if (PUBLIC_PAGES.includes(currentPath)) {
    return true
  }

  // Check pattern matches for dynamic routes
  for (const pattern of PUBLIC_PAGE_PATTERNS) {
    if (currentPath.startsWith(pattern)) {
      return true
    }
  }

  return false
}

// Function to check if user can access current page
function canAccess(userRole: string, currentPath: string): boolean {
  if (currentPath.startsWith("/patient/")) return userRole === "patient"
  if (currentPath.startsWith("/medecin/")) return userRole === "medecin"
  if (currentPath.startsWith("/admin/")) return userRole === "admin"
  return true // Allow access to other pages
}

// Function to clear all user data from localStorage
function clearAllUserData(): void {
  localStorage.removeItem("user")
  localStorage.removeItem("patientData")
  localStorage.removeItem("medecinData")
  localStorage.removeItem("adminData")
  localStorage.removeItem("patientId")
  localStorage.removeItem("doctorId")
  // Add any other localStorage items you use
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAccess = () => {
      const currentPath = router.asPath

      console.log("Checking access for path:", currentPath)

      // Allow public pages (including dynamic routes like /reset-password/token)
      if (isPublicPage(currentPath)) {
        console.log("Public page detected, allowing access")
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      // Get user from localStorage
      const userString = localStorage.getItem("user")

      if (!userString) {
        // No user - redirect to login
        console.log("No user found, redirecting to login")
        router.replace("/login")
        return
      }

      try {
        const user: User = JSON.parse(userString)

        // Check if user can access this page
        if (canAccess(user.role, currentPath)) {
          console.log("Access granted for", user.role, "to", currentPath)
          setIsAuthorized(true)
        } else {
          // User trying to access unauthorized page
          console.log(`Unauthorized access: ${user.role} trying to access ${currentPath}`)

          // Clear all user data
          clearAllUserData()

          // Redirect to login
          router.replace("/login")
          return
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Invalid user data - clear everything and redirect to login
        console.log("Invalid user data found, clearing and redirecting to login")
        clearAllUserData()
        router.replace("/login")
        return
      }

      setIsLoading(false)
    }

    checkAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath])

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show page if authorized
  if (isAuthorized) {
    return <Component {...pageProps} />
  }

  // Don't show anything while redirecting
  return null
}
