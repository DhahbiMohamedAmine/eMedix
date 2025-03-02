import "../../../public/tailwind.css"
import Image from "next/image"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function AppointmentForm() {
  return (
    <main className="w-full bg-gray-100 min-h-screen">
          <Header />
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
        {/* Partie 5 Banner */}
        <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
          <span className="text-lg font-semibold">Appointment</span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left side - Image */}
          <div className="relative w-full h-full overflow-hidden rounded-l-lg">
            <Image
              src="/images/cap1.png"
              alt="Medical appointment illustration"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Right side - Form */}
          <div className="p-8 md:p-12">
            <h1 className="mb-8 text-3xl font-bold text-gray-900">Prendre un rendez-vous</h1>

            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom de famille
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Entrez votre nom"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Entrez votre email"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Numéro de contact
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Entrez votre numéro"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                  Entrer l horaire souhaité
                </label>
                <input
                  id="datetime"
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 active:bg-[#2DD4BF]/80"
              >
                Soumettre
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
     <Footer />
        </main>
  )
}
