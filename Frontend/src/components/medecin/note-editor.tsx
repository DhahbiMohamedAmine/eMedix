"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface Tooth {
  id: number
  tooth_code: string
  tooth_name: string
  note: string
}

export function NoteEditor({
  tooth,
  onClose,
  onSave,
  showPermanent,
}: {
  tooth: Tooth | null
  onClose: () => void
  onSave: (note: string) => void
  showPermanent: boolean
}) {
  const [note, setNote] = useState("")

  useEffect(() => {
    if (tooth) {
      setNote(tooth.note || "")
    }
  }, [tooth])

  if (!tooth) return null

  const toothName = showPermanent ? `Permanent ${tooth.tooth_name}` : tooth.tooth_name

  return (
    <div className="absolute bg-white rounded-md shadow-lg p-4 z-20 w-80 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-800">{toothName}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write notes here..."
        className="w-full border border-gray-300 rounded p-2 mb-3"
        autoFocus
      />
      <button
        onClick={() => onSave(note)}
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
      >
        Save
      </button>
    </div>
  )
}
