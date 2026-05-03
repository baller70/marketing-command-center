import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const where: Record<string, string> = {};
  if (category) where.category = category;
  if (brand) where.brand = brand;
  const leadSources = await prisma.leadSource.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(leadSources);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const leadSource = await prisma.leadSource.create({ data: body });
  return NextResponse.json(leadSource, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const leadSource = await prisma.leadSource.update({ where: { id }, data });
  return NextResponse.json(leadSource);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const leadSource = await prisma.leadSource.update({ where: { id }, data });
  return NextResponse.json(leadSource);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.leadSource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
