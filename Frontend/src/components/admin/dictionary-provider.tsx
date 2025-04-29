"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useLanguage } from "@/contexts/language-context"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dictionary = any

const DictionaryContext = createContext<Dictionary | undefined>(undefined)

export function DictionaryProvider({
  children,
  dictionaries,
}: {
  children: ReactNode
  dictionaries: {
    en: Dictionary
    fr: Dictionary
    ar: Dictionary
  }
}) {
  const { language } = useLanguage()
  const dictionary = dictionaries[language]

  return <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>
}

export function useDictionary() {
  const context = useContext(DictionaryContext)
  if (context === undefined) {
    throw new Error("useDictionary must be used within a DictionaryProvider")
  }
  return context
}
