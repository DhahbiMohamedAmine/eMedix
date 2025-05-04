// app/layout.tsx or src/app/layout.tsx
import { ThemeProvider } from "@/components/admin/theme-provider"
import "../public/tailwind.css"

export const metadata = {
  title: "Your App",
  description: "Your Description",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
