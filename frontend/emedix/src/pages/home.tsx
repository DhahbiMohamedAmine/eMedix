import "../../public/tailwind.css"
import type React from "react"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const aboutRef = useRef<HTMLElement | null>(null)
  const footerRef = useRef<HTMLElement | null>(null)

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <main className="w-full">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-50 px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64">
        <div
          className="hidden md:flex justify-between items-center border-b text-sm py-3"
          style={{ borderColor: "rgba(255,255,255,.25)" }}
        >
          <div className="">
            <ul className="flex text-white">
              <li>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 fill-current text-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12,2C7.589,2,4,5.589,4,9.995C3.971,16.44,11.696,21.784,12,22c0,0,8.029-5.56,8-12C20,5.589,16.411,2,12,2z M12,14 c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4S14.21,14,12,14z" />
                  </svg>
                  <span className="ml-2">A371, Centre Urb Nord, 1082, Tunis</span>
                </div>
              </li>
              <li className="ml-6">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 fill-current text-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.594,13.994l-1.66,1.66c-0.577-0.109-1.734-0.471-2.926-1.66c-1.193-1.193-1.553-2.354-1.661-2.926l1.661-1.66 l0.701-0.701L5.295,3.293L4.594,3.994l-1,1C3.42,5.168,3.316,5.398,3.303,5.643c-0.015,0.25-0.302,6.172,4.291,10.766 C11.6,20.414,16.618,20.707,18,20.707c0.202,0,0.326-0.006,0.358-0.008c0.245-0.014,0.476-0.117,0.649-0.291l1-1l0.697-0.697 l-5.414-5.414L14.594,13.994z" />
                  </svg>
                  <span className="ml-2">+216 25 698 888</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="">
            <ul className="flex justify-end text-white">
              {["facebook", "twitter", "instagram", "youtube"].map((social) => (
                <li key={social} className="ml-6">
                  <Link href="#" target="_blank" title={social}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="fill-current"
                    >
                      {/* SVG paths for each social icon */}
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between py-6">
          <div className="w-1/2 md:w-auto">
            <Link href="/" className="text-white font-bold text-2xl">
              eMedix
            </Link>
          </div>

          <label htmlFor="menu-toggle" className="pointer-cursor md:hidden block">
            <svg
              className="fill-current text-white"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <title>menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
            </svg>
          </label>

          <input className="hidden" type="checkbox" id="menu-toggle" />

          <div className="hidden md:block w-full md:w-auto" id="menu">
            <nav className="w-full bg-white md:bg-transparent rounded shadow-lg px-6 py-4 mt-4 text-center md:p-0 md:mt-0 md:shadow-none">
              <ul className="md:flex items-center">
                <li>
                  <Link
                    className="py-2 inline-block md:text-white md:hidden lg:block font-semibold"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(aboutRef)
                    }}
                  >
                    About Us
                  </Link>
                </li>
                <li className="md:ml-4">
                  <Link className="py-2 inline-block md:text-white md:px-2 font-semibold" href="#">
                    Medicaments
                  </Link>
                </li>
                <li className="md:ml-4">
                  <Link className="py-2 inline-block md:text-white md:px-2 font-semibold" href="#">
                    Profile
                  </Link>
                </li>
                <li className="md:ml-4 md:hidden lg:block">
                  <Link className="py-2 inline-block md:text-white md:px-2 font-semibold" href="#">
                    Blog
                  </Link>
                </li>
                <li className="md:ml-4">
                  <Link
                    className="py-2 inline-block md:text-white md:px-2 font-semibold"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(footerRef)
                    }}
                  >
                    Contact Us
                  </Link>
                </li>
                <li className="md:ml-6 mt-3 md:mt-0">
                  <Link
                    className="inline-block font-semibold px-4 py-2 text-white bg-blue-500 md:bg-transparent md:text-white border border-white rounded"
                    href="/login"
                  >
                    Login
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gray-100">
        <section
          className="cover bg-blue-teal-gradient relative bg-blue-500 px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 overflow-hidden py-48 flex
        items-center min-h-screen"
        >
          <div className="h-full absolute top-0 left-0 z-0">
            <Image
              src="/images/banner.png"
              alt=""
              className="w-full h-full object-cover opacity-20"
              width={1920}
              height={1080}
            />
          </div>

          <div className="lg:w-3/4 xl:w-2/4 relative z-10 h-100 lg:mt-16">
            <div>
              <h1 className="text-white text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
                Your health begins with precision care.
              </h1>
              <p className="text-blue-100 text-xl md:text-2xl leading-snug mt-4">
                Welcome to eMedix, where expertise and compassion come together for your well-being
              </p>
              <Link href="/login" className="px-8 py-4 bg-teal-500 text-white rounded inline-block mt-8 font-semibold">
                Book Appointment
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* About Section */}
      <section ref={aboutRef} className="relative px-4 py-16 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 lg:py-32">
        <div className="flex flex-col lg:flex-row lg:-mx-8">
          <div className="w-full lg:w-1/2 lg:px-8">
            <h2 className="text-3xl leading-tight font-bold mt-4">
              Welcome to eMedix - Your Trusted Healthcare Partner
            </h2>
            <p className="text-lg mt-4 font-semibold">Expert Healthcare Solutions for Your Well-Being</p>
            <p className="mt-2 leading-relaxed">
              At eMedix, we are committed to providing personalized and comprehensive healthcare services to ensure your
              well-being. Our team of experts combines advanced technology and compassionate care to support you on your
              health journey.
            </p>
          </div>

          <div className="w-full lg:w-1/2 lg:px-8 mt-12 lg:mt-0">
            <div className="md:flex">
              <div>
                <div className="w-16 h-16 bg-teal-500 rounded-full"></div>
              </div>
              <div className="md:ml-8 mt-4 md:mt-0">
                <h4 className="text-xl font-bold leading-tight">Comprehensive Medical Services Under One Roof</h4>
                <p className="mt-2 leading-relaxed">
                  We offer a wide range of healthcare services, including consultations, diagnostics, treatments, and
                  follow-up care. At eMedix, our goal is to provide convenient access to all the healthcare services you
                  need for a healthier life.
                </p>
              </div>
            </div>

            <div className="md:flex mt-8">
              <div>
                <div className="w-16 h-16 bg-teal-500 rounded-full"></div>
              </div>
              <div className="md:ml-8 mt-4 md:mt-0">
                <h4 className="text-xl font-bold leading-tight">Patient-Centered Care for Every Stage of Life</h4>
                <p className="mt-2 leading-relaxed">
                  Our approach to healthcare is centered around you. Whether you are seeking preventive care or
                  treatment for an ongoing condition, we tailor our services to meet your unique needs. With eMedix,
                  your health is our top priority, and we’re here to support you every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} id="footer" className="relative bg-gray-900 text-white px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-12 lg:py-24">
        <div className="flex flex-col md:flex-row">
          <div className="w-full lg:w-2/6 lg:mx-4 lg:pr-8">
          <h3 className="font-bold text-2xl">eMedix</h3>
            <p className="text-gray-400">eMedix is your trusted partner in healthcare, offering cutting-edge solutions for medical professionals and patients alike. We prioritize your health with advanced tools and compassionate care.</p>
          </div>

          <div className="w-full lg:w-1/6 mt-8 lg:mt-0 lg:mx-4">
            <h5 className="uppercase tracking-wider font-semibold text-gray-500">Treatments</h5>
            <ul className="mt-4">
              {["General Dentistry", "Cosmetic Dentistry", "Oral Health"].map((item) => (
                <li key={item} className="mt-2">
                  <Link href="#" className="opacity-75 hover:opacity-100">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:w-2/6 mt-8 lg:mt-0 lg:mx-4 lg:pr-8">
            <h5 className="uppercase tracking-wider font-semibold text-gray-500">Contact Details</h5>
            <ul className="mt-4">
              <li>
                <Link href="#" className="flex items-center opacity-75 hover:opacity-100">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="fill-current"
                    >
                      <path d="M12,2C7.589,2,4,5.589,4,9.995C3.971,16.44,11.696,21.784,12,22c0,0,8.029-5.56,8-12C20,5.589,16.411,2,12,2z M12,14 c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4S14.21,14,12,14z" />
                    </svg>
                  </span>
                  <span className="ml-3">A371, Centre Urb Nord, 1082, Tunis</span>
                </Link>
              </li>
              <li className="mt-4">
                <Link href="#" className="flex items-center opacity-75 hover:opacity-100">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="fill-current"
                    >
                      <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10c5.514,0,10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8 s3.589-8,8-8s8,3.589,8,8S16.411,20,12,20z" />
                      <path d="M13 7L11 7 11 13 17 13 17 11 13 11z" />
                    </svg>
                  </span>
                  <span className="ml-3">
                    Mon - Fri: 9:00 - 19:00
                    <br />
                    Closed on Weekends
                  </span>
                </Link>
              </li>
              <li className="mt-4">
                <Link href="#" className="flex items-center opacity-75 hover:opacity-100">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="fill-current"
                    >
                      <path d="M14.594,13.994l-1.66,1.66c-0.577-0.109-1.734-0.471-2.926-1.66c-1.193-1.193-1.553-2.354-1.661-2.926l1.661-1.66 l0.701-0.701L5.295,3.293L4.594,3.994l-1,1C3.42,5.168,3.316,5.398,3.303,5.643c-0.015,0.25-0.302,6.172,4.291,10.766 C11.6,20.414,16.618,20.707,18,20.707c0.202,0,0.326-0.006,0.358-0.008c0.245-0.014,0.476-0.117,0.649-0.291l1-1l0.697-0.697 l-5.414-5.414L14.594,13.994z" />
                    </svg>
                  </span>
                  <span className="ml-3">+216 25 698 888</span>
                </Link>
              </li>
              <li className="mt-4">
                <Link href="#" className="flex items-center opacity-75 hover:opacity-100">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="fill-current"
                    >
                      <path d="M20,4H4C2.896,4,2,4.896,2,6v12c0,1.104,0.896,2,2,2h16c1.104,0,2-0.896,2-2V6C22,4.896,21.104,4,20,4z M20,8.7l-8,5.334 L4,8.7V6.297l8,5.333l8-5.333V8.7z" />
                    </svg>
                  </span>
                  <span className="ml-3">8luay@pm.me</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full lg:w-1/6 mt-8 lg:mt-0 lg:mx-4">
            <p className="text-sm text-gray-400 mt-12">
              © 2025 eMedix. <br className="hidden lg:block" />
              All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

