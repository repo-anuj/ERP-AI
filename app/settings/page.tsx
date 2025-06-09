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
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/components/ui/use-toast"
import { useCompany } from "@/contexts/company-context"
import { useNotifications } from "@/contexts/notification-context"

function SettingsContent() {
  const { toast } = useToast()
  const { user, loading: userLoading, updateUser } = useUser()
  const { company, loading: companyLoading, updateCompany } = useCompany()
  const { notifications, loading: notificationLoading, markAsRead } = useNotifications()
  const [saving, setSaving] = useState(false)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload image")

      const { url } = await response.json()
      await updateUser({ image: url })
      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      })
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      const firstName = (document.getElementById("firstName") as HTMLInputElement).value
      const lastName = (document.getElementById("lastName") as HTMLInputElement).value
      const bio = (document.getElementById("bio") as HTMLTextAreaElement).value
      const role = (document.getElementById("role") as HTMLInputElement).value
      const location = (document.getElementById("location") as HTMLInputElement).value

      await updateUser({
        firstName,
        lastName,
        bio,
        role,
        location,
      })

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

  const handleUpdateCompany = async () => {
    try {
      setSaving(true)
      const name = (document.getElementById("company") as HTMLInputElement).value

      await updateCompany({
        name,
      })

      toast({
        title: "Success",
        description: "Company information updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company information. Please try again.",
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
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.image || "/placeholder-avatar.jpg"} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="picture">Profile Picture</Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={saving}
                  />
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
                    defaultValue={company?.name || ""}
                    placeholder="Company name"
                    disabled={saving}
                    onBlur={() => handleUpdateCompany()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role"
                    defaultValue={user?.role || ""}
                    placeholder="Your role"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  defaultValue={user?.location || ""}
                  placeholder="City, Country"
                  disabled={saving}
                />
              </div>

              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "Saving..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                View your recent notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationLoading ? (
                <div className="text-center py-4">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-muted" : "bg-background"
                      } cursor-pointer`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize your display preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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