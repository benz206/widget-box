import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WIDGET_SIZES } from "@/lib/widgets/types";

// GET /api/widgets - Get all available widgets
export async function GET() {
  try {
    const widgets = await prisma.widget.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Failed to fetch widgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch widgets" },
      { status: 500 }
    );
  }
}

// POST /api/widgets - Create a new widget instance for user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { widgetId, x, y, size } = body;

    if (!widgetId || x === undefined || y === undefined || !size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate size
    if (!WIDGET_SIZES[size as keyof typeof WIDGET_SIZES]) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }

    const sizeConfig = WIDGET_SIZES[size as keyof typeof WIDGET_SIZES];
    const w = sizeConfig.w;
    const h = sizeConfig.h;

    // Check if position is valid (within 5x5 grid)
    if (x < 0 || x > 4 || y < 0 || y > 4 || x + w > 5 || y + h > 5) {
      return NextResponse.json(
        { error: "Position out of bounds" },
        { status: 400 }
      );
    }

    // Check for overlapping widgets
    const overlapping = await prisma.userWidget.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          {
            AND: [
              { x: { gte: x } },
              { x: { lt: x + w } },
              { y: { gte: y } },
              { y: { lt: y + h } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Position occupied by another widget" },
        { status: 409 }
      );
    }

    // Create the widget instance
    const userWidget = await prisma.userWidget.create({
      data: {
        userId: session.user.id,
        widgetId,
        x,
        y,
        w,
        h,
        config: {},
      },
      include: {
        widget: true,
      },
    });

    return NextResponse.json({ userWidget });
  } catch (error) {
    console.error("Failed to create widget:", error);
    return NextResponse.json(
      { error: "Failed to create widget" },
      { status: 500 }
    );
  }
}
