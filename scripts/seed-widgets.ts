import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedWidgets() {
  console.log("Seeding widgets...");

  // Create system widgets
  const widgets = [
    {
      slug: "system.time.simple",
      name: "Simple Clock",
      description: "A clean digital clock display",
      provider: "system",
      creator: "widget-box",
      size: "small",
      defaultWidth: 1,
      defaultHeight: 1,
      refreshIntervalSeconds: 60,
    },
    {
      slug: "system.weather.simple",
      name: "Weather Widget",
      description: "Current weather conditions",
      provider: "system",
      creator: "widget-box",
      size: "medium",
      defaultWidth: 2,
      defaultHeight: 2,
      refreshIntervalSeconds: 300,
    },
    {
      slug: "system.calendar.simple",
      name: "Calendar",
      description: "Today's date and upcoming events",
      provider: "system",
      creator: "widget-box",
      size: "large",
      defaultWidth: 3,
      defaultHeight: 2,
      refreshIntervalSeconds: 3600,
    },
    {
      slug: "system.notes.simple",
      name: "Quick Notes",
      description: "Take quick notes and reminders",
      provider: "system",
      creator: "widget-box",
      size: "medium",
      defaultWidth: 2,
      defaultHeight: 2,
      refreshIntervalSeconds: 0,
    },
    {
      slug: "system.stats.simple",
      name: "System Stats",
      description: "CPU, memory, and system information",
      provider: "system",
      creator: "widget-box",
      size: "small",
      defaultWidth: 1,
      defaultHeight: 1,
      refreshIntervalSeconds: 30,
    },
  ];

  for (const widget of widgets) {
    await prisma.widget.upsert({
      where: { slug: widget.slug },
      update: widget,
      create: widget,
    });
  }

  console.log("Widgets seeded successfully!");
}

async function main() {
  try {
    await seedWidgets();
  } catch (error) {
    console.error("Error seeding widgets:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
