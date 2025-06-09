import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the file to a cloud storage service (e.g., AWS S3, Cloudinary)
    // 2. Get back a URL for the uploaded file
    // For now, we'll return a placeholder URL
    const url = "/placeholder-avatar.jpg";

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[UPLOAD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
