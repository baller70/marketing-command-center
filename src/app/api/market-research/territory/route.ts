import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const where: Record<string, string> = {};
  if (brand) where.brand = brand;
  const territoryZones = await prisma.territoryZone.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(territoryZones);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const territoryZone = await prisma.territoryZone.create({ data: body });
  return NextResponse.json(territoryZone, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const territoryZone = await prisma.territoryZone.update({ where: { id }, data });
  return NextResponse.json(territoryZone);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const territoryZone = await prisma.territoryZone.update({ where: { id }, data });
  return NextResponse.json(territoryZone);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.territoryZone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
