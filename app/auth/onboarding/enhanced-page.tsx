"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Building2, Globe, Users, Package, CreditCard, Settings, CheckCircle } from "lucide-react"
import { getAllCountries, getCountryConfig } from "@/lib/country-config"
import { getAllIndustryTemplates, getIndustryTemplate } from "@/lib/industry-templates"

interface EnhancedFormData {
  [key: string]: any; // Add index signature for dynamic property access

  // Step 1: Business Discovery
  primaryIndustry: string
  businessModel: string
  companyStage: string
  primaryGoal: string

  // Step 2: Company Identity & Branding
  companyName: string
  legalName: string
  tagline: string
  website: string
  logo: string
  brandColors: {
    primary: string
    secondary: string
    accent: string
  }

  // Step 3: Location & Legal Setup
  country: string
  state: string
  city: string
  address: string
  zipCode: string
  timezone: string
  language: string
  businessRegistrationNumber: string
  taxId: string
  vatNumber: string
  panNumber: string
  einNumber: string
  gstNumber: string

  // Step 4: Business Operations
  operatingHours: Record<string, { open: string; close: string; closed: boolean }>
  workingDays: string[]
  fiscalYearStart: string
  accountingMethod: string

  // Step 5: Financial Configuration
  defaultCurrency: string
  bankAccounts: Array<{
    bankName: string
    accountNumber: string
    routingNumber: string
    ifscCode: string
    accountType: string
    isPrimary: boolean
  }>
  paymentMethods: {
    cash: boolean
    card: boolean
    digitalWallet: boolean
    bankTransfer: boolean
  }

  // Step 6: Organizational Structure
  departments: Array<{
    name: string
    description: string
    budget: number
  }>
  locations: Array<{
    name: string
    address: string
    type: string
    capacity: number
  }>

  // Step 7: Sample Data & Tutorial
  generateSampleData: boolean
  sampleDataTypes: {
    customers: boolean
    products: boolean
    sales: boolean
    employees: boolean
    transactions: boolean
  }

  userEmail: string
}

const INITIAL_FORM_DATA: EnhancedFormData = {
  primaryIndustry: "",
  businessModel: "",
  companyStage: "",
  primaryGoal: "",
  companyName: "",
  legalName: "",
  tagline: "",
  website: "",
  logo: "",
  brandColors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#10b981"
  },
  country: "",
  state: "",
  city: "",
  address: "",
  zipCode: "",
  timezone: "",
  language: "en",
  businessRegistrationNumber: "",
  taxId: "",
  vatNumber: "",
  panNumber: "",
  einNumber: "",
  gstNumber: "",
  operatingHours: {
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { open: "09:00", close: "17:00", closed: true },
    sunday: { open: "09:00", close: "17:00", closed: true }
  },
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  fiscalYearStart: "January",
  accountingMethod: "accrual",
  defaultCurrency: "USD",
  bankAccounts: [],
  paymentMethods: {
    cash: true,
    card: false,
    digitalWallet: false,
    bankTransfer: false
  },
  departments: [],
  locations: [],
  generateSampleData: false,
  sampleDataTypes: {
    customers: false,
    products: false,
    sales: false,
    employees: false,
    transactions: false
  },
  userEmail: ""
}

export default function EnhancedOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 7
  const [formData, setFormData] = useState<EnhancedFormData>(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [countries] = useState(getAllCountries())
  const [industries] = useState(getAllIndustryTemplates())
  const [selectedCountryConfig, setSelectedCountryConfig] = useState<any>(null)
  const [selectedIndustryTemplate, setSelectedIndustryTemplate] = useState<any>(null)

  useEffect(() => {
    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail')
    if (userEmail) {
      setFormData(prev => ({ ...prev, userEmail }))
    }
  }, [])

  useEffect(() => {
    // Update country-specific configurations
    if (formData.country) {
      const config = getCountryConfig(formData.country)
      setSelectedCountryConfig(config)
      if (config) {
        setFormData(prev => ({
          ...prev,
          defaultCurrency: config.currency,
          fiscalYearStart: config.fiscalYear.split('-')[0]
        }))
      }
    }
  }, [formData.country])

  useEffect(() => {
    // Update industry-specific configurations
    if (formData.primaryIndustry) {
      const template = getIndustryTemplate(formData.primaryIndustry)
      setSelectedIndustryTemplate(template)
      if (template) {
        setFormData(prev => ({
          ...prev,
          departments: template.departments
            .filter(dept => dept.isRequired)
            .map(dept => ({
              name: dept.name,
              description: dept.description,
              budget: 0
            }))
        }))
      }
    }
  }, [formData.primaryIndustry])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.')
      if (keys.length === 1) {
        return { ...prev, [field]: value }
      } else {
        const newData = { ...prev }
        let current = newData
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        return newData
      }
    })
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        if (!formData.primaryIndustry || !formData.businessModel || !formData.companyStage) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required fields for business discovery.",
            variant: "destructive"
          })
          return false
        }
        break
      case 2:
        if (!formData.companyName) {
          toast({
            title: "Validation Error", 
            description: "Company name is required.",
            variant: "destructive"
          })
          return false
        }
        break
      case 3:
        if (!formData.country || !formData.state || !formData.city || !formData.address) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required location fields.",
            variant: "destructive"
          })
          return false
        }
        break
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    try {
      setIsLoading(true)

      if (!formData.userEmail) {
        toast({
          title: "Error",
          description: "User session expired. Please sign up again.",
          variant: "destructive"
        })
        window.location.href = '/auth/signup'
        return
      }

      console.log("Submitting enhanced onboarding data:", formData)

      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save company profile")
      }

      toast({
        title: "Success!",
        description: "Company profile created successfully! Redirecting to dashboard...",
        duration: 3000
      })

      localStorage.removeItem('userEmail')
      
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)

    } catch (error) {
      console.error("Failed to save company profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save company profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderBusinessDiscovery()
      case 2:
        return renderCompanyIdentity()
      case 3:
        return renderLocationLegal()
      case 4:
        return renderBusinessOperations()
      case 5:
        return renderFinancialConfig()
      case 6:
        return renderOrganizationalStructure()
      case 7:
        return renderSampleDataTutorial()
      default:
        return null
    }
  }

  const renderBusinessDiscovery = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Building2 className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          Help us customize the perfect ERP solution for your specific needs
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label>What industry are you in? *</Label>
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <Card
                key={industry.industry}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.primaryIndustry === industry.industry
                    ? 'ring-2 ring-primary bg-primary/5'
                    : ''
                }`}
                onClick={() => handleInputChange('primaryIndustry', industry.industry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{industry.icon}</span>
                    <div>
                      <h3 className="font-medium">{industry.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{industry.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Business Model *</Label>
            <Select value={formData.businessModel} onValueChange={(value) => handleInputChange('businessModel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                <SelectItem value="b2b2c">B2B2C (Business to Business to Consumer)</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="saas">SaaS (Software as a Service)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Company Stage *</Label>
            <Select value={formData.companyStage} onValueChange={(value) => handleInputChange('companyStage', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (0-2 years)</SelectItem>
                <SelectItem value="growing">Growing (2-5 years)</SelectItem>
                <SelectItem value="established">Established (5+ years)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Large corporation)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Primary Goal *</Label>
          <Select value={formData.primaryGoal} onValueChange={(value) => handleInputChange('primaryGoal', value)}>
            <SelectTrigger>
              <SelectValue placeholder="What's your main goal with this ERP?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory_management">Inventory Management</SelectItem>
              <SelectItem value="sales_tracking">Sales Tracking</SelectItem>
              <SelectItem value="employee_management">Employee Management</SelectItem>
              <SelectItem value="financial_control">Financial Control</SelectItem>
              <SelectItem value="project_management">Project Management</SelectItem>
              <SelectItem value="all_in_one">Complete Business Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const renderCompanyIdentity = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Globe className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Company Identity & Branding</CardTitle>
        <CardDescription>
          Set up your company's identity and branding elements
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Company Name *</Label>
            <Input
              placeholder="Enter your company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Legal Name</Label>
            <Input
              placeholder="Legal business name (if different)"
              value={formData.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Company Tagline</Label>
          <Input
            placeholder="Your company's tagline or motto"
            value={formData.tagline}
            onChange={(e) => handleInputChange('tagline', e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Website</Label>
          <Input
            placeholder="https://yourcompany.com"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          <Label>Brand Colors</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label className="text-sm">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.brandColors.primary}
                  onChange={(e) => handleInputChange('brandColors.primary', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.brandColors.primary}
                  onChange={(e) => handleInputChange('brandColors.primary', e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.brandColors.secondary}
                  onChange={(e) => handleInputChange('brandColors.secondary', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.brandColors.secondary}
                  onChange={(e) => handleInputChange('brandColors.secondary', e.target.value)}
                  placeholder="#64748b"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Accent Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.brandColors.accent}
                  onChange={(e) => handleInputChange('brandColors.accent', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.brandColors.accent}
                  onChange={(e) => handleInputChange('brandColors.accent', e.target.value)}
                  placeholder="#10b981"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Company Logo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Click to upload your company logo
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG up to 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLocationLegal = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Globe className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Location & Legal Setup</CardTitle>
        <CardDescription>
          Configure your business location and legal requirements
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Country *</Label>
          <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>State/Province *</Label>
            <Input
              placeholder="State or Province"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>City *</Label>
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Address *</Label>
          <Textarea
            placeholder="Complete business address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label>ZIP/Postal Code *</Label>
          <Input
            placeholder="ZIP or Postal Code"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>

        {selectedCountryConfig && (
          <div className="space-y-4">
            <Separator />
            <h3 className="font-medium">Legal Information for {selectedCountryConfig.name}</h3>
            <p className="text-sm text-muted-foreground">
              Tax System: {selectedCountryConfig.taxSystem}
            </p>

            {selectedCountryConfig.taxFields.map((field: any) => (
              <div key={field.name} className="grid gap-2">
                <Label>
                  {field.label} {field.required && '*'}
                </Label>
                <Input
                  placeholder={field.placeholder}
                  value={formData[field.name as keyof EnhancedFormData] as string || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderBusinessOperations = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Settings className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Business Operations</CardTitle>
        <CardDescription>
          Configure your business hours and operational settings
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <Label>Operating Hours</Label>
          {Object.entries(formData.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <Label className="capitalize">{day}</Label>
              </div>
              <Checkbox
                checked={!hours.closed}
                onCheckedChange={(checked) =>
                  handleInputChange(`operatingHours.${day}.closed`, !checked)
                }
              />
              <span className="text-sm">Open</span>
              {!hours.closed && (
                <>
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleInputChange(`operatingHours.${day}.open`, e.target.value)}
                    className="w-32"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleInputChange(`operatingHours.${day}.close`, e.target.value)}
                    className="w-32"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Accounting Method</Label>
            <Select value={formData.accountingMethod} onValueChange={(value) => handleInputChange('accountingMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select accounting method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash Basis</SelectItem>
                <SelectItem value="accrual">Accrual Basis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Fiscal Year Start</Label>
            <Select value={formData.fiscalYearStart} onValueChange={(value) => handleInputChange('fiscalYearStart', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fiscal year start" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="January">January</SelectItem>
                <SelectItem value="April">April</SelectItem>
                <SelectItem value="July">July</SelectItem>
                <SelectItem value="October">October</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancialConfig = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CreditCard className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Financial Configuration</CardTitle>
        <CardDescription>
          Set up your financial accounts and payment methods
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Default Currency</Label>
          <Input
            value={selectedCountryConfig?.currency || formData.defaultCurrency}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-muted-foreground">
            Currency is automatically set based on your country selection
          </p>
        </div>

        <div className="grid gap-4">
          <Label>Accepted Payment Methods</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.paymentMethods).map(([method, enabled]) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    handleInputChange(`paymentMethods.${method}`, checked)
                  }
                />
                <Label className="capitalize">{method.replace(/([A-Z])/g, ' $1')}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <Label>Bank Accounts</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newAccount = {
                  bankName: '',
                  accountNumber: '',
                  routingNumber: '',
                  ifscCode: '',
                  accountType: 'business',
                  isPrimary: formData.bankAccounts.length === 0
                }
                handleInputChange('bankAccounts', [...formData.bankAccounts, newAccount])
              }}
            >
              Add Bank Account
            </Button>
          </div>

          {formData.bankAccounts.map((account, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="Bank name"
                    value={account.bankName}
                    onChange={(e) => {
                      const newAccounts = [...formData.bankAccounts]
                      newAccounts[index].bankName = e.target.value
                      handleInputChange('bankAccounts', newAccounts)
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="Account number"
                    value={account.accountNumber}
                    onChange={(e) => {
                      const newAccounts = [...formData.bankAccounts]
                      newAccounts[index].accountNumber = e.target.value
                      handleInputChange('bankAccounts', newAccounts)
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderOrganizationalStructure = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Users className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Organizational Structure</CardTitle>
        <CardDescription>
          Set up your departments and organizational hierarchy
        </CardDescription>
      </div>

      <div className="grid gap-6">
        {selectedIndustryTemplate && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Departments for {selectedIndustryTemplate.displayName}</Label>
              <Badge variant="secondary">
                {selectedIndustryTemplate.departments.length} suggested
              </Badge>
            </div>

            <div className="grid gap-3">
              {selectedIndustryTemplate.departments.map((dept: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                      {dept.isRequired && (
                        <Badge variant="outline" className="mt-1">Required</Badge>
                      )}
                    </div>
                    <Checkbox
                      checked={formData.departments.some(d => d.name === dept.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('departments', [
                            ...formData.departments,
                            { name: dept.name, description: dept.description, budget: 0 }
                          ])
                        } else {
                          handleInputChange('departments',
                            formData.departments.filter(d => d.name !== dept.name)
                          )
                        }
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderSampleDataTutorial = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="mx-auto h-12 w-12 text-primary" />
        <CardTitle>Sample Data & Tutorial</CardTitle>
        <CardDescription>
          Get started quickly with sample data and guided tutorials
        </CardDescription>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.generateSampleData}
              onCheckedChange={(checked) => handleInputChange('generateSampleData', checked)}
            />
            <Label>Generate sample data to help you get started</Label>
          </div>

          {formData.generateSampleData && (
            <div className="ml-6 space-y-3">
              <Label className="text-sm font-medium">What sample data would you like?</Label>
              {Object.entries(formData.sampleDataTypes).map(([type, enabled]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handleInputChange(`sampleDataTypes.${type}`, checked)
                    }
                  />
                  <Label className="capitalize text-sm">
                    Sample {type.replace(/([A-Z])/g, ' $1')}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-medium">What happens next?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Your ERP system will be configured</p>
                <p className="text-muted-foreground">
                  Based on your industry and preferences
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Sample data will be created</p>
                <p className="text-muted-foreground">
                  If you selected this option, we'll add relevant sample data
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">You'll access your dashboard</p>
                <p className="text-muted-foreground">
                  Start managing your business immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold">Welcome to Your ERP Setup</CardTitle>
              <CardDescription className="text-lg">
                Let's configure your business management system in just a few steps
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-3" />
        </CardHeader>

        <CardContent className="mt-6">
          {renderStepContent()}
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={nextStep}>
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Creating Your ERP..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
