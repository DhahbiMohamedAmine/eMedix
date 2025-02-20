import "../../public/tailwind.css"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Register() {
  const [role, setRole] = useState<"patient" | "doctor">("patient")

  return (
    <main className="w-full min-h-screen bg-gray-100">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 relative">
          <Image
            src="/images/banner.png"
            alt="eMedix Healthcare"
            layout="fill"
            objectFit="cover"
            className="opacity-80"
          />
          <div className="absolute inset-0 bg-blue-500 opacity-60"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Link href="/" className="text-white font-bold text-4xl">
              eMedix
            </Link>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Your Account</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="cin" className="block text-sm font-medium text-gray-700">
                  CIN
                </label>
                <input
                  type="text"
                  id="cin"
                  name="cin"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                  Surname
                </label>
                <input
                  type="text"
                  id="surname"
                  name="surname"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Telephone
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-2 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="patient"
                      checked={role === "patient"}
                      onChange={() => setRole("patient")}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Patient</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="doctor"
                      checked={role === "doctor"}
                      onChange={() => setRole("doctor")}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Doctor</span>
                  </label>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Register
                </button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

