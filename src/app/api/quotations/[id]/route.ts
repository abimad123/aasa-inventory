import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/quotations/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && quotation.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(quotation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch quotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/quotations/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can approve or reject quotations
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { status: newStatus } = body; // APPROVED or REJECTED

    if (!newStatus || !["APPROVED", "REJECTED"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED or REJECTED." }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.status !== "PENDING") {
      return NextResponse.json({ error: `Quotation is in ${quotation.status} state and cannot be modified.` }, { status: 400 });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: { status: newStatus },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json(updatedQuotation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update quotation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
