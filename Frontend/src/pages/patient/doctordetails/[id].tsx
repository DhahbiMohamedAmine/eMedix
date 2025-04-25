import { useRouter } from "next/router"
import DoctorDetails from "@/components/patient/doctordetails"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"

export default function DoctorDetailsPage() {
  const router = useRouter()
  const { id } = router.query

  if (!id) return <p>Loading...</p>

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <DoctorDetails doctorId={id as string} />
      </div>
      <Footer />
    </main>
  )
}
