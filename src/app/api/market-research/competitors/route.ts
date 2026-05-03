import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const type = searchParams.get("type");
  const where: Record<string, string> = {};
  if (brand) where.brand = brand;
  if (type) where.type = type;
  const competitors = await prisma.competitor.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(competitors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const competitor = await prisma.competitor.create({ data: body });
  return NextResponse.json(competitor, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const competitor = await prisma.competitor.update({ where: { id }, data });
  return NextResponse.json(competitor);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const competitor = await prisma.competitor.update({ where: { id }, data });
  return NextResponse.json(competitor);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.competitor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
