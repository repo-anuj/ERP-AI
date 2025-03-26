"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
}

interface CompanyContextType {
  company: Company | null
  loading: boolean
  error: string | null
  updateCompany: (updates: Partial<Company>) => Promise<void>
  refreshCompany: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCompany = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/company")
      
      if (!response.ok) {
        throw new Error("Failed to fetch company data")
      }
      
      const companyData = await response.json()
      setCompany(companyData)
    } catch (error) {
      console.error("Failed to fetch company:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return

    try {
      const response = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update company")
      }

      const updatedCompany = await response.json()
      setCompany(updatedCompany)
      
      toast({
        title: "Success",
        description: "Company information updated successfully",
      })
    } catch (error) {
      console.error("Failed to update company:", error)
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [])

  return (
    <CompanyContext.Provider 
      value={{ 
        company, 
        loading, 
        error, 
        updateCompany,
        refreshCompany: fetchCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
