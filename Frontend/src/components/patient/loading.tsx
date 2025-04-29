import { Loader2 } from "lucide-react"

export default function DoctorDetailsLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#2DD4BF]" />
        <p className="mt-4 text-gray-600">Loading doctor details...</p>
      </div>
    </div>
  )
}
