"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export function UserButton() {
  const router = useRouter()
  const { user, loading } = useUser()

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
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.image || "/placeholder-avatar.jpg"} 
              alt={`${getDisplayName()}'s avatar`} 
            />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {loading ? "Loading..." : user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Profile Settings
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600"
          onClick={() => {
            fetch("/api/auth/signout", { method: "POST" })
              .then(() => router.push("/auth/signin"))
          }}
        >
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}