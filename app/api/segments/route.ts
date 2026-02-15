import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { segmentSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = segmentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const created = await prisma.segment.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
