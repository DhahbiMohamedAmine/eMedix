import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react" // Optional, if you want icons for the dark mode button

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for the saved theme preference
    const savedTheme = localStorage.getItem('theme') === 'dark'
    setIsDarkMode(savedTheme)
    if (savedTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode
    setIsDarkMode(newIsDarkMode)
    document.documentElement.classList.toggle('dark', newIsDarkMode)
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 transition-colors duration-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      {isDarkMode ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  )
}
