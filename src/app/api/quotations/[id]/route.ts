import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Role check: Admin can see any, seller can only see their own
    if (session.user.role !== "ADMIN" && quotation.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(quotation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch quotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
