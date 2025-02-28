import Image from "next/image"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function ProfilePage() {
  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />

      {/* Profile Content */}
      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
            {/* Banner */}
            <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
              <span className="text-lg font-semibold">Profile</span>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Left side - Image */}
              <div className="relative w-full h-full overflow-hidden rounded-l-lg bg-[#2DD4BF]">
                <Image
                  src="/images/cap1.png"
                  alt="Profile background"
                  layout="fill"
                  objectFit="cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex items-center justify-center">
                  <Image
                    src="/images/U1C7sA.jpg"
                    alt="Profile Picture"
                    width={250}
                    height={250}
                    className="rounded-full border-4 border-white shadow-lg"
                  />
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      defaultValue="John Doe"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      defaultValue="john.doe@example.com"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      defaultValue="+1 234 567 8900"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      defaultValue="123 Main St, Anytown, USA"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 active:bg-[#2DD4BF]/80"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
