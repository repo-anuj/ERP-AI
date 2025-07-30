"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { useCompany } from "@/contexts/company-context"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Award, Shield, User, Building2, Award as Crown } from "lucide-react"
import Image from "next/image"

export function UserButton() {
  const router = useRouter()
  const { user, loading, refreshUser } = useUser()
  const { company, loading: companyLoading } = useCompany()
  const { toast } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const getInitials = () => {
    if (!user) return "?"
    const first = user.firstName?.[0] || ""
    const last = user.lastName?.[0] || ""
    return (first + last).toUpperCase() || user.email[0].toUpperCase()
  }

  const getDisplayName = () => {
    if (loading) return "Loading..."
    if (!user) return "Guest"
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split("@")[0]
  }

  const getUserRole = () => {
    if (!user) return { role: "Employee", icon: User, color: "bg-blue-100 text-blue-800" }

    // Check if user is company owner (first user or admin)
    if (user.role === "admin" || user.role === "owner") {
      return { role: "Owner", icon: Crown, color: "bg-yellow-100 text-yellow-800" }
    }

    // Check if user is manager
    if (user.role === "manager") {
      return { role: "Manager", icon: Shield, color: "bg-green-100 text-green-800" }
    }

    // For users without explicit role but who completed onboarding, they're likely owners
    if (company && !user.role) {
      return { role: "Owner", icon: Crown, color: "bg-yellow-100 text-yellow-800" }
    }

    // Default to employee
    return { role: "Employee", icon: User, color: "bg-blue-100 text-blue-800" }
  }

  const getCompanyLogo = () => {
    if (company?.logo) {
      return company.logo
    }
    return null
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }

      // Clear user context and redirect
      await refreshUser()
      window.location.href = "/auth/signin"

      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {getCompanyLogo() ? (
              <Image
                src={getCompanyLogo()!}
                alt={`${company?.name} Logo`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain rounded-full"
                unoptimized={false}
                priority
              />
            ) : (
              <AvatarFallback
                className="text-white"
                style={company?.brandColors?.primary ? {
                  backgroundColor: company.brandColors.primary
                } : {}}
              >
                {company?.name?.[0]?.toUpperCase() || <Building2 className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center space-x-3">
            {/* Company Logo */}
            {getCompanyLogo() ? (
              <Image
                src={getCompanyLogo()!}
                alt={`${company?.name} Logo`}
                width={40}
                height={40}
                className="h-10 w-10 object-contain rounded-lg border"
                unoptimized={false}
                priority
              />
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className="text-white"
                  style={company?.brandColors?.primary ? {
                    backgroundColor: company.brandColors.primary
                  } : {}}
                >
                  {company?.name?.[0]?.toUpperCase() || <Building2 className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            )}

            {/* User Info */}
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={`text-xs ${getUserRole().color}`}>
                  {(() => {
                    const RoleIcon = getUserRole().icon
                    return <RoleIcon className="h-3 w-3 mr-1" />
                  })()}
                  {getUserRole().role}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {loading ? "Loading..." : user?.email}
              </p>
              {company?.name && (
                <p className="text-xs leading-none text-muted-foreground">
                  {companyLoading ? "Loading..." : company.name}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
            Profile Settings
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>

          {/* Show Company Settings only for Owners/Admins */}
          {(getUserRole().role === "Owner" || getUserRole().role === "Manager") && (
            <DropdownMenuItem onClick={() => window.location.href = '/settings?tab=company'}>
              Company Settings
              <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          {/* Show HR Settings only for Owners/Admins */}
          {getUserRole().role === "Owner" && (
            <DropdownMenuItem onClick={() => window.location.href = '/hr'}>
              HR Management
              <DropdownMenuShortcut>⇧⌘H</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Log out"}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}