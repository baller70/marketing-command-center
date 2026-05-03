import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const where: Record<string, string> = {};
  if (brand) where.brand = brand;
  const nurtureSequences = await prisma.nurtureSequence.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(nurtureSequences);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nurtureSequence = await prisma.nurtureSequence.create({ data: body });
  return NextResponse.json(nurtureSequence, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const nurtureSequence = await prisma.nurtureSequence.update({ where: { id }, data });
  return NextResponse.json(nurtureSequence);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const nurtureSequence = await prisma.nurtureSequence.update({ where: { id }, data });
  return NextResponse.json(nurtureSequence);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.nurtureSequence.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
