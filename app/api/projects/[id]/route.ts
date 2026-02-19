import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canvasSchema } from "@/lib/validators";

async function validate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!project) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { project };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const validated = await validate(params.id);
  if (validated.error) return validated.error;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      segments: true,
      problems: true,
      solutions: true,
      attributes: true,
      differentiators: true,
      positionings: true,
      userStories: true,
      kpis: true,
      milestones: { orderBy: { dueDate: "asc" } }
    }
  });

  return NextResponse.json(project);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const validated = await validate(params.id);
  if (validated.error) return validated.error;

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const validated = await validate(params.id);
  if (validated.error) return validated.error;

  const parsed = canvasSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  await prisma.$transaction([
    prisma.attribute.deleteMany({ where: { projectId: params.id } }),
    prisma.differentiation.deleteMany({ where: { projectId: params.id } }),
    prisma.positioning.deleteMany({ where: { projectId: params.id } }),
    prisma.userStory.deleteMany({ where: { projectId: params.id } })
  ]);

  const { attributes, differentiators, positionings, userStories } = {
    attributes: parsed.data.attributes,
    differentiators: parsed.data.differentiators,
    positionings: parsed.data.positionings,
    userStories: parsed.data.userStories
  };

  await prisma.project.update({
    where: { id: params.id },
    data: {
      attributes: { create: attributes },
      differentiators: { create: differentiators },
      positionings: { create: positionings },
      userStories: { create: userStories }
    }
  });

  return NextResponse.json({ ok: true });
}
