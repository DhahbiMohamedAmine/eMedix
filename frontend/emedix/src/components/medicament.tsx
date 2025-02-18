import Header from "../components/header"
import Footer from "../components/footer"
import "../../public/tailwind.css"
import { useState } from "react"
import Link from "next/link"
import { PlusIcon, Trash2Icon, PencilIcon } from "@/components/ui/icons"

interface Medicament {
  id: number
  name: string
  dosage: string
  frequency: string
}

export default function MedicamentManagement() {
  const [medicaments, setMedicaments] = useState<Medicament[]>([
    { id: 1, name: "Aspirin", dosage: "500mg", frequency: "Twice daily" },
    { id: 2, name: "Ibuprofen", dosage: "400mg", frequency: "As needed" },
  ])

  const [newMedicament, setNewMedicament] = useState<Omit<Medicament, "id">>({
    name: "",
    dosage: "",
    frequency: "",
  })

  const addMedicament = () => {
    if (newMedicament.name && newMedicament.dosage && newMedicament.frequency) {
      setMedicaments([...medicaments, { ...newMedicament, id: Date.now() }])
      setNewMedicament({ name: "", dosage: "", frequency: "" })
    }
  }

  const deleteMedicament = (id: number) => {
    setMedicaments(medicaments.filter((med) => med.id !== id))
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <main className="px-4 py-8 sm:px-8 lg:px-16 xl:px-40 2xl:px-64">
        <h1 className="text-3xl font-bold mb-8">Medicament Management</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Medicament</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Medicament Name"
              className="border rounded px-3 py-2"
              value={newMedicament.name}
              onChange={(e) => setNewMedicament({ ...newMedicament, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Dosage"
              className="border rounded px-3 py-2"
              value={newMedicament.dosage}
              onChange={(e) => setNewMedicament({ ...newMedicament, dosage: e.target.value })}
            />
            <input
              type="text"
              placeholder="Frequency"
              className="border rounded px-3 py-2"
              value={newMedicament.frequency}
              onChange={(e) => setNewMedicament({ ...newMedicament, frequency: e.target.value })}
            />
          </div>
          <button
            onClick={addMedicament}
            className="mt-4 bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors flex items-center"
          >
            <PlusIcon  />
            Add Medicament
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Medicaments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Dosage</th>
                  <th className="px-4 py-2 text-left">Frequency</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicaments.map((med) => (
                  <tr key={med.id} className="border-b">
                    <td className="px-4 py-2">{med.name}</td>
                    <td className="px-4 py-2">{med.dosage}</td>
                    <td className="px-4 py-2">{med.frequency}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-500 hover:text-blue-700 mr-2">
                        <PencilIcon  />
                      </button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => deleteMedicament(med.id)}>
                        <Trash2Icon  />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

    <Footer />
    </div>
  )
}

