import "../../public/tailwind.css"
import Image from "next/image"
import Link from "next/link"
import Header from "../components/header"
import Footer from "../components/footer"
// This would typically come from an API or database
const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Patient" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Doctor" },
  { id: 3, name: "Alice Johnson", email: "alice@example.com", role: "Nurse" },
  { id: 4, name: "Bob Brown", email: "bob@example.com", role: "Patient" },
  { id: 5, name: "Charlie Davis", email: "charlie@example.com", role: "Admin" },
  { id: 1, name: "John Doe", email: "john@example.com", role: "Patient" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Doctor" },
  { id: 3, name: "Alice Johnson", email: "alice@example.com", role: "Nurse" },
  { id: 4, name: "Bob Brown", email: "bob@example.com", role: "Patient" },
  { id: 5, name: "Charlie Davis", email: "charlie@example.com", role: "Admin" },
]

export default function UsersListPage() {
  return (
    <main className="w-full">
      <Header />
      {/* Users List Content */}
      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Users List</h1>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            className="h-10 w-10 rounded-full"
                            src={`/placeholder.svg?height=40&width=40`}
                            alt=""
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/users/${user.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </Link>
                      <Link href={`/users/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </Link>
                      <Link href={`/users/${user.id}/delete`} className="text-indigo-600 hover:text-indigo-900">
                        Delete
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    <Footer />
    </main>
  )
}

