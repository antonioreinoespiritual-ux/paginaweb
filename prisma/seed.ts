import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@studio.com" },
    update: {},
    create: {
      email: "demo@studio.com",
      password,
      projects: {
        create: {
          name: "AI Assistant Launch",
          description: "Define launch strategy for AI assistant",
          segments: {
            create: [{ title: "SMBs", description: "Small teams automating workflows" }]
          },
          problems: {
            create: [{ description: "Manual repetitive operations", severity: 4 }]
          },
          solutions: {
            create: [{ description: "Automation copilot", impact: 5 }]
          },
          attributes: {
            create: [{ title: "Easy onboarding", description: "Setup under 10 minutes" }]
          },
          differentiators: {
            create: [{ title: "Vertical AI", description: "Industry-specific automation templates" }]
          },
          positionings: {
            create: [{ statement: "The fastest way for SMB teams to automate repetitive work." }]
          },
          userStories: {
            create: [{ role: "Ops Manager", feature: "automate invoice routing", benefit: "save 5 hours/week" }]
          },
          kpis: {
            create: [{ name: "Activation Rate", metricType: "percentage", value: 35, target: 50 }]
          },
          milestones: {
            create: [{ title: "Beta launch", dueDate: new Date(), status: "in-progress" }]
          }
        }
      }
    }
  });

  console.log("Seeded user:", user.email);
}

main().finally(async () => prisma.$disconnect());
