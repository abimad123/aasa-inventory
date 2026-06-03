import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/orders/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can update order status
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { status: newStatus } = body; // e.g. PROCESSING, COMPLETED, CANCELLED

    if (!newStatus || !["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status value provided." }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Fetch current order state
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      // Check transition validity
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}.`);
      }

      // If transitioning to COMPLETED, check stock and deduct inventory
      if (newStatus === "COMPLETED") {
        for (const item of order.items) {
          const product = item.product;
          const reqQty = new Decimal(item.convertedQuantity.toString());
          const currentStock = new Decimal(product.stockQuantity.toString());

          if (currentStock.lt(reqQty)) {
            throw new Error(
              `Insufficient stock to complete order. Product: "${product.name}", Required: ${reqQty.toNumber()} ${product.baseUnit}, Available: ${currentStock.toNumber()} ${product.baseUnit}.`
            );
          }

          // Deduct from Product stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: currentStock.sub(reqQty),
            },
          });

          // Log transaction OUT
          await tx.inventoryTransaction.create({
            data: {
              productId: product.id,
              type: "OUT",
              quantity: reqQty,
              notes: `Order #${order.id.slice(-6).toUpperCase()} completed. Deducting stock.`,
            },
          });
        }
      }

      // Update Order Status
      const updated = await tx.order.update({
        where: { id },
        data: { status: newStatus },
        include: { items: { include: { product: true } } },
      });

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
