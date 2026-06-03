import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [products, orders, quotations, transactions] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.quotation.count(),
      prisma.inventoryTransaction.count(),
    ]);

    return NextResponse.json({
      products,
      orders,
      quotations,
      transactions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load statistics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
