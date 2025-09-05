import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/widgets/position - Update multiple widget positions (for drag & drop)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { positions } = body; // Array of { id, x, y, w, h }

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "Positions must be an array" },
        { status: 400 }
      );
    }

    // Validate all positions first
    for (const pos of positions) {
      if (!pos.id || pos.x === undefined || pos.y === undefined) {
        return NextResponse.json(
          { error: "Missing required fields in position" },
          { status: 400 }
        );
      }

      if (pos.x < 0 || pos.x > 4 || pos.y < 0 || pos.y > 4) {
        return NextResponse.json(
          { error: "Position out of bounds" },
          { status: 400 }
        );
      }

      const w = pos.w ?? 1;
      const h = pos.h ?? 1;
      if (w < 1 || w > 5 || h < 1 || h > 5 || pos.x + w > 5 || pos.y + h > 5) {
        return NextResponse.json(
          { error: "Size out of bounds" },
          { status: 400 }
        );
      }
    }

    // Check for overlapping widgets
    for (let i = 0; i < positions.length; i++) {
      const pos1 = positions[i];
      for (let j = i + 1; j < positions.length; j++) {
        const pos2 = positions[j];
        
        const w1 = pos1.w ?? 1;
        const h1 = pos1.h ?? 1;
        const w2 = pos2.w ?? 1;
        const h2 = pos2.h ?? 1;

        // Check if rectangles overlap
        if (
          pos1.x < pos2.x + w2 &&
          pos1.x + w1 > pos2.x &&
          pos1.y < pos2.y + h2 &&
          pos1.y + h1 > pos2.y
        ) {
          return NextResponse.json(
            { error: "Widgets overlap" },
            { status: 409 }
          );
        }
      }
    }

    // Update all positions in a transaction
    const updates = positions.map((pos) =>
      prisma.userWidget.update({
        where: {
          id: pos.id,
          userId: session.user.id, // Ensure user owns the widget
        },
        data: {
          x: pos.x,
          y: pos.y,
          w: pos.w ?? 1,
          h: pos.h ?? 1,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update widget positions:", error);
    return NextResponse.json(
      { error: "Failed to update widget positions" },
      { status: 500 }
    );
  }
}
