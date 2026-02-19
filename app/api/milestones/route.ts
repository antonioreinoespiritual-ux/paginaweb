import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { milestoneSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = milestoneSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });
  const created = await prisma.milestone.create({ data: { ...parsed.data, dueDate: new Date(parsed.data.dueDate) } });
  return NextResponse.json(created, { status: 201 });
}
