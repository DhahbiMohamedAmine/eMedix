import "../../public/tailwind.css"
import Link from "next/link"
import Image from "next/image"

export default function RequestResetPassword() {
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

        {/* Right side - Request Reset Password form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we ll send you a link to reset your password.
            </p>
            <form className="space-y-4">
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
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

