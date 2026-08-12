import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  await connectDB();

  const categories = await Category.find().sort({
    createdAt: -1,
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const slug = body.name.toLowerCase().replace(/\s+/g, "-");

  const exists = await Category.findOne({
    slug,
  });

  if (exists) {
    return NextResponse.json(
      {
        error: "Category already exists",
      },
      {
        status: 400,
      }
    );
  }

  const category = await Category.create({
    name: body.name,
    slug,
    image: body.image,
    status: body.status,
  });

  return NextResponse.json(category);
}