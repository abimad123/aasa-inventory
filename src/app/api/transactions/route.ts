import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin can fetch transactions
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to latest 50 logs
    });
    return NextResponse.json(transactions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
