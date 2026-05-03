import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const where: Record<string, string> = {};
  if (brand) where.brand = brand;
  const recLeagueScouts = await prisma.recLeagueScout.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(recLeagueScouts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const recLeagueScout = await prisma.recLeagueScout.create({ data: body });
  return NextResponse.json(recLeagueScout, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const recLeagueScout = await prisma.recLeagueScout.update({ where: { id }, data });
  return NextResponse.json(recLeagueScout);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const recLeagueScout = await prisma.recLeagueScout.update({ where: { id }, data });
  return NextResponse.json(recLeagueScout);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.recLeagueScout.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
