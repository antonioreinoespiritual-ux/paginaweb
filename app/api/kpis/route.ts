import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kpiSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = kpiSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });
  const created = await prisma.kPI.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = body.id as string;
  const parsed = kpiSchema.partial().safeParse(body);
  if (!parsed.success || !id) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const updated = await prisma.kPI.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
