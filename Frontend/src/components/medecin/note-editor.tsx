/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect } from "react"
import { X, Save, CheckCircle2 } from "lucide-react"

interface Tooth {
  id?: number
  tooth_code: string
  tooth_name: string
  note: string
  status?: string
}

interface NoteEditorProps {
  tooth: Tooth
  onClose: () => void
  onSave: (note: string) => void
  onStatusClick: () => void
  showPermanent: boolean
}

export function NoteEditor({ tooth, onClose, onSave, onStatusClick, showPermanent }: NoteEditorProps) {
  const [note, setNote] = useState(tooth.note || "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    setNote(tooth.note || "")
  }, [tooth])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(note)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error("Error saving note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="absolute top-0 right-0 w-full md:w-1/3 h-full bg-white shadow-lg border rounded-r-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="font-medium text-lg">
          Tooth {tooth.tooth_code} - {tooth.tooth_name}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Status:</span>
          <div className="flex items-center">
            {tooth.status ? (
              <>
                <div
                  className={`w-3 h-3 rounded-full mr-1 ${
                    tooth.status === "Healthy"
                      ? "bg-green-500"
                      : tooth.status === "Needs Attention"
                        ? "bg-yellow-500"
                        : tooth.status === "Requires Treatment"
                          ? "bg-red-500"
                          : "bg-blue-500"
                  }`}
                ></div>
                <span className="text-sm">{tooth.status}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Not set</span>
            )}
          </div>
        </div>
        <button
          onClick={onStatusClick}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
        >
          Change Status
        </button>
      </div>

      <div className="flex-grow">
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Notes:
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-[calc(100%-2rem)] p-2 border rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          placeholder="Add notes about this tooth..."
        />
      </div>

      <div className="flex justify-between items-center mt-4 pt-2 border-t">
        {saveSuccess ? (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle2 size={16} className="mr-1" />
            Saved successfully
          </div>
        ) : (
          <div className="text-xs text-gray-500">All changes are saved automatically</div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-1" />
              Save Note
            </>
          )}
        </button>
      </div>
    </div>
  )
}
