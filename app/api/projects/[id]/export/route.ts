import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      segments: true,
      problems: true,
      solutions: true,
      attributes: true,
      differentiators: true,
      positionings: true,
      userStories: true,
      kpis: true,
      milestones: true
    }
  });

  if (!project) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(project, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=project-${params.id}.json`
    }
  });
}
