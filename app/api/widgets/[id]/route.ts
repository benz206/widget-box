import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WIDGET_SIZES } from "@/lib/widgets/types";

// GET /api/widgets/[id] - Get user's widget instances
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const userWidgets = await prisma.userWidget.findMany({
      where: { userId: session.user.id },
      include: { widget: true },
      orderBy: { zIndex: "desc" },
    });

    return NextResponse.json({ userWidgets });
  } catch (error) {
    console.error("Failed to fetch user widgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch user widgets" },
      { status: 500 }
    );
  }
}

// PUT /api/widgets/[id] - Update widget position or config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { x, y, w, h, config, size } = body;

    // Check if widget exists and belongs to user
    const { id } = await params;

    const existingWidget = await prisma.userWidget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWidget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Update position if provided
    if (x !== undefined && y !== undefined) {
      // Validate position
      if (x < 0 || x > 4 || y < 0 || y > 4) {
        return NextResponse.json(
          { error: "Position out of bounds" },
          { status: 400 }
        );
      }

      updateData.x = x;
      updateData.y = y;
    }

    // Update size if provided
    if (size && WIDGET_SIZES[size as keyof typeof WIDGET_SIZES]) {
      const sizeConfig = WIDGET_SIZES[size as keyof typeof WIDGET_SIZES];
      updateData.w = sizeConfig.w;
      updateData.h = sizeConfig.h;
    } else if (w !== undefined && h !== undefined) {
      // Validate custom size
      if (w < 1 || w > 5 || h < 1 || h > 5) {
        return NextResponse.json(
          { error: "Size out of bounds" },
          { status: 400 }
        );
      }
      updateData.w = w;
      updateData.h = h;
    }

    // Update config if provided
    if (config !== undefined) {
      updateData.config = config;
    }

    // Check for overlapping widgets (excluding current widget)
    if (updateData.x !== undefined || updateData.y !== undefined) {
      const finalX = updateData.x ?? existingWidget.x;
      const finalY = updateData.y ?? existingWidget.y;
      const finalW = updateData.w ?? existingWidget.w;
      const finalH = updateData.h ?? existingWidget.h;

      const overlapping = await prisma.userWidget.findFirst({
        where: {
          userId: session.user.id,
          id: { not: id },
          OR: [
            {
              AND: [
                { x: { gte: finalX } },
                { x: { lt: finalX + finalW } },
                { y: { gte: finalY } },
                { y: { lt: finalY + finalH } },
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
    }

    const updatedWidget = await prisma.userWidget.update({
      where: { id },
      data: updateData,
      include: { widget: true },
    });

    return NextResponse.json({ userWidget: updatedWidget });
  } catch (error) {
    console.error("Failed to update widget:", error);
    return NextResponse.json(
      { error: "Failed to update widget" },
      { status: 500 }
    );
  }
}

// DELETE /api/widgets/[id] - Delete widget instance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if widget exists and belongs to user
    const existingWidget = await prisma.userWidget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWidget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    await prisma.userWidget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete widget:", error);
    return NextResponse.json(
      { error: "Failed to delete widget" },
      { status: 500 }
    );
  }
}
