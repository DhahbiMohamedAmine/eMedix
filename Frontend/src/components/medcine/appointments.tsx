import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"

// Sample appointment data
const appointments = [
  { id: 1, name: "John Doe", date: "2023-06-15", time: "10:00", reason: "Check-up" },
  { id: 2, name: "Jane Smith", date: "2023-06-16", time: "14:30", reason: "Dental cleaning" },
  { id: 3, name: "Alice Johnson", date: "2023-06-17", time: "11:15", reason: "Eye exam" },
  { id: 4, name: "Bob Brown", date: "2023-06-18", time: "09:45", reason: "Physical therapy" },
  { id: 5, name: "Emma Wilson", date: "2023-06-19", time: "16:00", reason: "Vaccination" },
]

export default function AppointmentList() {
  const handleAccept = (id: number) => {
    // Placeholder function for accepting an appointment
    console.log(`Accepted appointment ${id}`)
  }

  const handleReject = (id: number) => {
    // Placeholder function for rejecting an appointment
    console.log(`Rejected appointment ${id}`)
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Partie 5 Banner */}
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointments</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left side - Image */}
            <div className="w-full md:w-1/3 h-64 md:h-auto relative">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            {/* Right side - Appointment List */}
            <div className="w-full md:w-2/3 p-8">
              <h1 className="mb-6 text-3xl font-bold text-gray-900">Liste des rendez-vous</h1>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Nom
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Heure
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Raison
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b bg-white">
                        <td className="px-4 py-4">{appointment.name}</td>
                        <td className="px-4 py-4">{appointment.date}</td>
                        <td className="px-4 py-4">{appointment.time}</td>
                        <td className="px-4 py-4">{appointment.reason}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleAccept(appointment.id)}
                            className="mr-2 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id)}
                            className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
