"use client";

import { Moon, Sun, Building2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserButton } from "@/components/user-button"
import { NotificationDropdown } from "./notification-dropdown"
import { NotificationCenter } from "@/components/realtime/notification-center"
import { useCompany } from "@/contexts/company-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

export function Header() {
  const { setTheme } = useTheme()
  const { company, loading: companyLoading } = useCompany()

  // Use company brand colors if available
  const headerStyle = company?.brandColors?.primary ? {
    borderBottomColor: company.brandColors.primary + '20', // 20% opacity
  } : {}

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={headerStyle}
    >
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-3">
            {/* Company Logo */}
            {company?.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} Logo`}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-white"
                  style={company?.brandColors?.primary ? {
                    backgroundColor: company.brandColors.primary
                  } : {}}
                >
                  {company?.name?.[0]?.toUpperCase() || <Building2 className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Company Name */}
            <span
              className="font-bold text-lg"
              style={company?.brandColors?.primary ? {
                color: company.brandColors.primary
              } : {}}
            >
              {companyLoading ? "Loading..." : company?.name || "ERP System"}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2">
          <nav className="flex items-center space-x-6">
            {/* Add navigation items here */}
          </nav>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}