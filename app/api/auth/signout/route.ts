import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log("Sign-out API called")
    
    const cookieStore = cookies()
    
    // Clear all authentication-related cookies
    const response = NextResponse.json({
      message: "Successfully signed out"
    }, { status: 200 })

    // Remove the auth token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    // Remove the employee flag cookie
    response.cookies.set('isEmployee', '', {
      path: '/',
      maxAge: 0, // Expire immediately
    })

    // Remove the hasCompletedSignup cookie
    response.cookies.set('hasCompletedSignup', '', {
      path: '/',
      maxAge: 0, // Expire immediately
    })

    console.log("Sign-out successful - cookies cleared")
    return response

  } catch (error) {
    console.error("Sign-out error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
