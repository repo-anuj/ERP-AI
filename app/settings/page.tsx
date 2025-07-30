"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/components/ui/use-toast"
import { useCompany } from "@/contexts/company-context"
import { useNotifications } from "@/contexts/notification-context"
import { Building2, Globe, CreditCard, Settings, Upload, Award, Shield } from "lucide-react"

function SettingsContent() {
  const { toast } = useToast()
  const { user, loading: userLoading, updateUser } = useUser()
  const { company, loading: companyLoading, updateCompany } = useCompany()
  const { notifications, loading: notificationLoading, markAsRead } = useNotifications()
  const [saving, setSaving] = useState(false)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or JPEG image.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string

        await updateCompany({ logo: base64String })
        toast({
          title: "Success",
          description: "Company logo updated successfully.",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Failed to upload logo:", error)
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or JPEG image.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (1MB limit for stamp)
    const maxSize = 1 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 1MB.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string

        await updateCompany({ companyStamp: base64String })
        toast({
          title: "Success",
          description: "Company stamp updated successfully.",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Failed to upload stamp:", error)
      toast({
        title: "Error",
        description: "Failed to upload stamp. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }



  const handleUpdateCompanyIdentity = async () => {
    try {
      setSaving(true)

      const companyName = (document.getElementById("companyName") as HTMLInputElement)?.value
      const legalName = (document.getElementById("legalName") as HTMLInputElement)?.value
      const tagline = (document.getElementById("tagline") as HTMLInputElement)?.value
      const website = (document.getElementById("website") as HTMLInputElement)?.value

      const updates: any = {}
      if (companyName) updates.name = companyName
      if (legalName) updates.legalName = legalName
      if (tagline) updates.tagline = tagline
      if (website) updates.website = website

      await updateCompany(updates)

      toast({
        title: "Success",
        description: "Company identity updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company identity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLocation = async () => {
    try {
      setSaving(true)

      const state = (document.getElementById("state") as HTMLInputElement)?.value
      const city = (document.getElementById("city") as HTMLInputElement)?.value
      const zipCode = (document.getElementById("zipCode") as HTMLInputElement)?.value
      const address = (document.getElementById("address") as HTMLTextAreaElement)?.value
      const phone = (document.getElementById("phone") as HTMLInputElement)?.value
      const email = (document.getElementById("email") as HTMLInputElement)?.value

      const updates: any = {}
      if (state) updates.state = state
      if (city) updates.city = city
      if (zipCode) updates.zipCode = zipCode
      if (address) updates.address = address
      if (phone) updates.phone = phone
      if (email) updates.email = email

      await updateCompany(updates)

      toast({
        title: "Success",
        description: "Location & contact information updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateFinancial = async () => {
    try {
      setSaving(true)

      const timezone = (document.getElementById("timezone") as HTMLInputElement)?.value

      const updates: any = {}
      if (timezone) updates.timezone = timezone

      await updateCompany(updates)

      toast({
        title: "Success",
        description: "Financial settings updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update financial settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = async (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    try {
      const currentColors = company?.brandColors || { primary: "#3b82f6", secondary: "#64748b", accent: "#10b981" }
      const updatedColors = { ...currentColors, [colorType]: color }

      await updateCompany({ brandColors: updatedColors })

      toast({
        title: "Success",
        description: `${colorType.charAt(0).toUpperCase() + colorType.slice(1)} color updated successfully.`,
        duration: 2000
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand color. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)

      const firstName = (document.getElementById("firstName") as HTMLInputElement)?.value
      const lastName = (document.getElementById("lastName") as HTMLInputElement)?.value
      const bio = (document.getElementById("bio") as HTMLTextAreaElement)?.value

      const updates: any = {}
      if (firstName) updates.firstName = firstName
      if (lastName) updates.lastName = lastName
      if (bio) updates.bio = bio

      await updateUser(updates)

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (!user) return "?"
    const first = user.firstName?.[0] || ""
    const last = user.lastName?.[0] || ""
    return (first + last).toUpperCase() || user.email[0].toUpperCase()
  }

  if (userLoading || companyLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Owner Profile
              </CardTitle>
              <CardDescription>
                Manage your profile as the company owner/administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {company?.logo ? (
                    <img
                      src={company.logo}
                      alt="Company Logo"
                      className="h-24 w-24 object-contain border rounded-lg bg-white"
                    />
                  ) : (
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-lg">
                        {company?.name?.[0]?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Badge className="absolute -bottom-2 -right-2 bg-yellow-500 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <p className="text-sm text-muted-foreground">
                    Your company logo is displayed across the ERP system
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={saving}
                  >
                    Change Logo
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    defaultValue={user?.firstName || ""}
                    placeholder="Enter your first name"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    defaultValue={user?.lastName || ""}
                    placeholder="Enter your last name"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  defaultValue={user?.bio || ""}
                  placeholder="Write something about yourself"
                  className="h-32"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Company name can be changed in the Company tab
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="role"
                      value="Owner / Administrator"
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Award className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={company?.city && company?.country ? `${company.city}, ${company.country}` : user?.location || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Location is based on your company's registered address
                </p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "Saving..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <div className="space-y-6">
            {/* Company Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Identity & Branding
                </CardTitle>
                <CardDescription>
                  Manage your company's identity and branding elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      defaultValue={company?.name || ""}
                      placeholder="Enter company name"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      defaultValue={company?.legalName || ""}
                      placeholder="Legal business name"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Company Tagline</Label>
                  <Input
                    id="tagline"
                    defaultValue={company?.tagline || ""}
                    placeholder="Your company's tagline or motto"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    defaultValue={company?.website || ""}
                    placeholder="https://yourcompany.com"
                    disabled={saving}
                  />
                </div>

                {/* Brand Colors */}
                <div className="space-y-4">
                  <Label>Brand Colors</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={company?.brandColors?.primary || "#3b82f6"}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          disabled={saving}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <Input
                          value={company?.brandColors?.primary || "#3b82f6"}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          disabled={saving}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={company?.brandColors?.secondary || "#64748b"}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          disabled={saving}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <Input
                          value={company?.brandColors?.secondary || "#64748b"}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          disabled={saving}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Accent Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={company?.brandColors?.accent || "#10b981"}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          disabled={saving}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <Input
                          value={company?.brandColors?.accent || "#10b981"}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          disabled={saving}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo and Stamp */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    {company?.logo ? (
                      <div className="space-y-2">
                        <img
                          src={company.logo}
                          alt="Company Logo"
                          className="w-32 h-32 object-contain border rounded-lg bg-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={saving}
                        >
                          Change Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Upload company logo</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={saving}
                        >
                          Upload Logo
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Company Stamp</Label>
                    {company?.companyStamp ? (
                      <div className="space-y-2">
                        <img
                          src={company.companyStamp}
                          alt="Company Stamp"
                          className="w-24 h-24 object-contain border rounded-lg bg-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('stamp-upload')?.click()}
                          disabled={saving}
                        >
                          Change Stamp
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto h-6 w-6 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-600">Upload company stamp</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('stamp-upload')?.click()}
                          disabled={saving}
                        >
                          Upload Stamp
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleUpdateCompanyIdentity} disabled={saving}>
                  {saving ? "Saving..." : "Update Company Information"}
                </Button>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Location & Contact Information
                </CardTitle>
                <CardDescription>
                  Manage your company's location and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={company?.country || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      defaultValue={company?.state || ""}
                      placeholder="State or Province"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      defaultValue={company?.city || ""}
                      placeholder="City"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      defaultValue={company?.zipCode || ""}
                      placeholder="ZIP or Postal Code"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    defaultValue={company?.address || ""}
                    placeholder="Complete business address"
                    disabled={saving}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      defaultValue={company?.phone || ""}
                      placeholder="Business phone number"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue={company?.email || ""}
                      placeholder="Business email"
                      disabled={saving}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateLocation} disabled={saving}>
                  {saving ? "Saving..." : "Update Location & Contact"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="space-y-6">
            {/* Business Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Business Configuration
                </CardTitle>
                <CardDescription>
                  Manage your business type, industry, and operational settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={company?.industry || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessModel">Business Model</Label>
                    <Input
                      id="businessModel"
                      value={company?.businessModel || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyStage">Company Stage</Label>
                    <Input
                      id="companyStage"
                      value={company?.companyStage || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryGoal">Primary Goal</Label>
                    <Input
                      id="primaryGoal"
                      value={company?.primaryGoal || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <Separator />

                {/* Operating Hours */}
                <div className="space-y-4">
                  <Label>Operating Hours</Label>
                  {company?.operatingHours ? (
                    <div className="space-y-3">
                      {Object.entries(company.operatingHours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="w-20 capitalize font-medium">{day}</span>
                            {hours.closed ? (
                              <Badge variant="secondary">Closed</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {hours.open} - {hours.close}
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No operating hours configured</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                    <Input
                      id="fiscalYearStart"
                      value={company?.fiscalYearStart || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountingMethod">Accounting Method</Label>
                    <Input
                      id="accountingMethod"
                      value={company?.accountingMethod || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" disabled>
                    Business settings are configured during onboarding
                  </Button>
                  <Badge variant="secondary">Read-only</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="space-y-6">
            {/* Financial Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Financial Configuration
                </CardTitle>
                <CardDescription>
                  Manage your financial settings, currency, and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Input
                      id="defaultCurrency"
                      value={company?.defaultCurrency || "USD"}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Currency is set based on your country selection
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={company?.timezone || ""}
                      placeholder="Select timezone"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Legal Information */}
                <Separator />
                <div className="space-y-4">
                  <Label>Legal & Tax Information</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
                      <Input
                        id="businessRegistrationNumber"
                        value={company?.businessRegistrationNumber || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={company?.taxId || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  {company?.country === "IN" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          value={company?.gstNumber || ""}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number</Label>
                        <Input
                          id="panNumber"
                          value={company?.panNumber || ""}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  )}

                  {company?.country === "US" && (
                    <div className="space-y-2">
                      <Label htmlFor="einNumber">EIN Number</Label>
                      <Input
                        id="einNumber"
                        value={company?.einNumber || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <Separator />
                <div className="space-y-4">
                  <Label>Accepted Payment Methods</Label>
                  {company?.paymentMethods ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(company.paymentMethods).map(([method, enabled]: [string, any]) => (
                        <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="capitalize">{method.replace(/([A-Z])/g, ' $1')}</span>
                          <Badge variant={enabled ? "default" : "secondary"}>
                            {enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment methods configured</p>
                  )}
                </div>

                <Button onClick={handleUpdateFinancial} disabled={saving}>
                  {saving ? "Saving..." : "Update Financial Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>
              <Button>Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>
                  Customize your ERP system display and interface preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark mode
                    </p>
                  </div>
                  <Switch defaultChecked={user?.darkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more compact view for dense information
                    </p>
                  </div>
                  <Switch defaultChecked={user?.compactView} />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label>Language & Localization</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={company?.language || "en"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Display Currency</Label>
                      <Input
                        value={company?.defaultCurrency || "USD"}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  View your ERP system and onboarding information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Onboarding Status</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-green-500">
                        ✓ Completed
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Setup completed successfully
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Award className="h-3 w-3 mr-1" />
                        Owner Account
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company ID</Label>
                  <Input
                    value={company?.id || ""}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden file inputs */}
      <input
        id="logo-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        id="stamp-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleStampUpload}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10"><div className="text-center">Loading...</div></div>}>
      <SettingsContent />
    </Suspense>
  )
}