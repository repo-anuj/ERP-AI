"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

interface FormData {
  // Basic Info
  companyName: string;
  industry: string;
  companySize: string;
  description: string;
  
  // Contact & Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  
  // Business Operations
  businessType: string;
  operatingHours: string;
  mainProducts: string;
  
  // Industry Specific
  technologyStack: string;  // Changed to string for comma-separated values
  certifications: string;   // Changed to string for comma-separated values
  manufacturingCapacity: string;
  retailLocations: string;  // Changed to string, will convert to number when sending
  
  // Department Setup
  departments: string[];
  additionalInfo: string;
}

const INITIAL_FORM_DATA: FormData = {
  companyName: "",
  industry: "",
  companySize: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
  businessType: "",
  operatingHours: "",
  mainProducts: "",
  technologyStack: "",
  certifications: "",
  manufacturingCapacity: "",
  retailLocations: "",
  departments: [],
  additionalInfo: "",
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        if (!formData.companyName || !formData.industry) {
          alert("Please fill in all required fields.")
          return false
        }
        break
      case 2:
        if (!formData.address || !formData.city || !formData.country) {
          alert("Please fill in all required fields.")
          return false
        }
        break
      case 3:
        if (!formData.businessType || !formData.operatingHours) {
          alert("Please fill in all required fields.")
          return false
        }
        break
      case 4:
        if (formData.departments.length === 0) {
          alert("Please select at least one department.")
          return false
        }
        break
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsLoading(true)

      // Get the user's email from localStorage
      const userEmail = localStorage.getItem('userEmail')
      console.log("Retrieved user email:", userEmail)
      
      if (!userEmail) {
        toast({
          title: "Error",
          description: "User session expired. Please sign up again.",
          variant: "destructive",
          duration: 5000,
        })
        router.push('/auth/signup')
        return
      }

      console.log("Preparing onboarding data submission...")

      // Prepare the data
      const submitData = {
        ...formData,
        userEmail,
        companyName: formData.companyName,
        technologyStack: formData.technologyStack ? formData.technologyStack.split(',').map(item => item.trim()).filter(Boolean) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map(item => item.trim()).filter(Boolean) : [],
        retailLocations: formData.retailLocations ? parseInt(formData.retailLocations) : undefined,
        departments: formData.departments.filter(Boolean),
      }

      console.log("Submitting onboarding data:", submitData)

      // Call the onboarding API
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      console.log("API Response:", data)

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to save company profile")
      }

      // Show success message
      toast({
        title: "Success!",
        description: "Company profile created successfully! Redirecting to dashboard...",
        duration: 3000,
      })
      
      // Clear the stored email since we don't need it anymore
      localStorage.removeItem('userEmail')
      
      // Wait for toast to be visible
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to main page
      router.push("/")
      router.refresh() // Refresh the page to update any server components

    } catch (error) {
      console.error("Failed to save company profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save company profile",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderIndustrySpecificFields = () => {
    switch (formData.industry) {
      case "technology":
        return (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Technology Stack</Label>
              <Textarea
                placeholder="Enter technologies (comma-separated)"
                value={formData.technologyStack}
                onChange={(e) => handleInputChange("technologyStack", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter technologies separated by commas (e.g., "React, Node.js, MongoDB")
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Certifications</Label>
              <Textarea
                placeholder="Enter certifications (comma-separated)"
                value={formData.certifications}
                onChange={(e) => handleInputChange("certifications", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter certifications separated by commas (e.g., "ISO 9001, CMMI Level 5")
              </p>
            </div>
          </div>
        )
      case "manufacturing":
        return (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Manufacturing Capacity</Label>
              <Input
                placeholder="Annual production capacity"
                value={formData.manufacturingCapacity}
                onChange={(e) => handleInputChange("manufacturingCapacity", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Retail Locations</Label>
              <Input
                type="number"
                placeholder="Number of retail locations"
                value={formData.retailLocations}
                onChange={(e) => handleInputChange("retailLocations", e.target.value)}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderSummary = () => (
    <div className="space-y-6">
      <CardDescription>
        Review Your Information Before Completing Setup
      </CardDescription>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Basic Information</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p><span className="font-medium">Company Name:</span> {formData.companyName}</p>
            <p><span className="font-medium">Industry:</span> {formData.industry}</p>
            <p><span className="font-medium">Size:</span> {formData.companySize}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Contact & Location</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p>{formData.address}</p>
            <p>{formData.city}, {formData.state} {formData.zipCode}</p>
            <p>{formData.country}</p>
            <p>{formData.phone}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Business Operations</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p><span className="font-medium">Type:</span> {formData.businessType}</p>
            <p><span className="font-medium">Hours:</span> {formData.operatingHours}</p>
            <p><span className="font-medium">Main Products/Services:</span> {formData.mainProducts}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Departments</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p>{formData.departments.join(", ")}</p>
          </div>
        </div>

        {formData.industry === "technology" && (
          <div>
            <h3 className="font-medium">Technology Details</h3>
            <div className="mt-2 space-y-2 text-sm">
              <p><span className="font-medium">Tech Stack:</span> {formData.technologyStack}</p>
              <p><span className="font-medium">Certifications:</span> {formData.certifications}</p>
            </div>
          </div>
        )}

        {formData.industry === "manufacturing" && (
          <div>
            <h3 className="font-medium">Manufacturing Details</h3>
            <div className="mt-2 space-y-2 text-sm">
              <p><span className="font-medium">Manufacturing Capacity:</span> {formData.manufacturingCapacity}</p>
              <p><span className="font-medium">Retail Locations:</span> {formData.retailLocations}</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            By clicking "Complete Setup", your company profile will be created and you'll be redirected to the dashboard.
            You can edit this information later from your company settings.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-[800px]">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Company Setup</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </CardHeader>
        <CardContent className="mt-4">
          {step === 1 && (
            <div className="space-y-4">
              <CardDescription>Basic Company Information</CardDescription>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange("industry", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.industry && renderIndustrySpecificFields()}
                <div className="grid gap-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleInputChange("companySize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your company"
                    className="h-24"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <CardDescription>Contact & Location</CardDescription>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      placeholder="State/Province"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="ZIP/Postal Code"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <CardDescription>Business Operations</CardDescription>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange("businessType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B</SelectItem>
                      <SelectItem value="b2c">B2C</SelectItem>
                      <SelectItem value="both">Both B2B and B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="operatingHours">Operating Hours *</Label>
                  <Select
                    value={formData.operatingHours}
                    onValueChange={(value) => handleInputChange("operatingHours", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operating hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24-7">24/7 Operations</SelectItem>
                      <SelectItem value="business-hours">Standard Business Hours</SelectItem>
                      <SelectItem value="custom">Custom Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mainProducts">Main Products/Services *</Label>
                  <Textarea
                    id="mainProducts"
                    placeholder="List your main products or services"
                    className="h-24"
                    value={formData.mainProducts}
                    onChange={(e) => handleInputChange("mainProducts", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <CardDescription>Department Setup</CardDescription>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Active Departments *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {["Sales", "HR", "Finance", "Inventory", "Production", "IT"].map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept.toLowerCase()}
                          checked={formData.departments.includes(dept)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange("departments", [...formData.departments, dept])
                            } else {
                              handleInputChange(
                                "departments",
                                formData.departments.filter((d) => d !== dept)
                              )
                            }
                          }}
                        />
                        <Label htmlFor={dept.toLowerCase()}>{dept}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional information about your departments or organizational structure"
                    className="h-24"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && renderSummary()}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={nextStep} className={step === 1 ? "w-full" : ""}>
              Next
            </Button>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Completing Setup..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 