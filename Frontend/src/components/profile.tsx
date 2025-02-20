import "../../public/tailwind.css"
import Image from "next/image"
import Link from "next/link"
import Header from "../components/header"
import Footer from "../components/footer"
export default function ProfilePage() {
  return (
    <main className="w-full">
      <Header />

      {/* Profile Content */}
      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">User Profile</h1>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Image
                src="/placeholder.svg?height=100&width=100"
                alt="Profile Picture"
                width={100}
                height={100}
                className="rounded-full"
              />
              <div className="ml-4">
                <h2 className="text-2xl font-semibold">John Doe</h2>
                <p className="text-gray-600">john.doe@example.com</p>
              </div>
            </div>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  defaultValue="John Doe"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  defaultValue="john.doe@example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  defaultValue="+1 234 567 8900"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  defaultValue="123 Main St, Anytown, USA"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </section>
<Footer />
     </main>
  )
}

