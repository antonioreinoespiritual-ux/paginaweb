import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const project = await prisma.project.create({ data: { ...parsed.data, userId: session.user.id } });
  return NextResponse.json(project, { status: 201 });
}
