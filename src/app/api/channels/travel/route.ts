import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const where = brand ? { brand } : {};
  const programs = await prisma.travelProgram.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const program = await prisma.travelProgram.create({ data: body });
  return NextResponse.json(program, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.travelProgram.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
