import "../../public/tailwind.css"
import Link from "next/link"


export default function HeaderComponent() {


    return (
       
          <header className="bg-blue-500 text-white px-4 py-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64">
            <div className="flex justify-between items-center">
              <Link href="/home" className="text-white font-bold text-2xl">
                eMedix
              </Link>
              <nav>
                <ul className="flex items-center">
                  <li className="ml-6">
                    <Link href="/home" className="text-white hover:text-blue-200">
                      Home
                    </Link>
                  </li>
                  <li className="ml-6">
                    <Link href="/medicament" className="text-white hover:text-blue-200">
                      Medicaments
                    </Link>
                  </li>
                  <li className="ml-6">
                    <Link href="/patient/profile" className="text-white hover:text-blue-200">
                      Profile
                    </Link></li>
                    <li className="ml-6">
                    <Link href="/userList" className="text-white hover:text-blue-200">
                      Users List
                    </Link>
                  </li>
                  <li className="ml-6">
                    <Link href="/patient/appointment" className="text-white hover:text-blue-200">
                      Appointment
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
       
    )


}