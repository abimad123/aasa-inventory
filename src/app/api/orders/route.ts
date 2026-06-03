import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";
import { convertToBaseUnit, calculatePrice } from "@/lib/units";

// GET /api/orders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: session.user.role === "ADMIN" ? {} : { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quotationId, items } = body;

    // 1. Quotation-to-Order Conversion Flow
    if (quotationId) {
      const order = await prisma.$transaction(async (tx) => {
        const quotation = await tx.quotation.findUnique({
          where: { id: quotationId },
          include: { items: { include: { product: true } } },
        });

        if (!quotation) {
          throw new Error("Quotation not found.");
        }

        if (quotation.status !== "APPROVED") {
          throw new Error(`Quotation status must be APPROVED to convert to order. Current status: ${quotation.status}`);
        }

        // Verify stock for all items
        for (const item of quotation.items) {
          const product = item.product;
          const reqStock = new Decimal(item.convertedQuantity.toString());
          const availStock = new Decimal(product.stockQuantity.toString());

          if (availStock.lt(reqStock)) {
            throw new Error(
              `Insufficient stock for "${product.name}". Required: ${reqStock.toNumber()} ${product.baseUnit}, Available: ${availStock.toNumber()} ${product.baseUnit}.`
            );
          }
        }

        // Create Order
        const newOrder = await tx.order.create({
          data: {
            userId: quotation.userId,
            status: "PENDING",
            totalAmount: quotation.totalAmount,
            items: {
              create: quotation.items.map((item) => ({
                productId: item.productId,
                enteredQuantity: item.enteredQuantity,
                enteredUnit: item.enteredUnit,
                convertedQuantity: item.convertedQuantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
              })),
            },
          },
          include: { items: true },
        });

        // Update Quotation status to CONVERTED
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: "CONVERTED" },
        });

        return newOrder;
      });

      return NextResponse.json(order, { status: 201 });
    }

    // 2. Direct Order Creation Flow (retrieving pricing securely from DB)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = new Decimal(0);
      const orderItemsData = [];

      for (const item of items) {
        const { productId, enteredQuantity, enteredUnit } = item;

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.name}" is inactive and cannot be ordered.`);
        }

        const qtyDecimal = new Decimal(enteredQuantity);
        if (qtyDecimal.lte(0)) {
          throw new Error(`Quantity for "${product.name}" must be greater than zero.`);
        }

        // Convert entered qty to base unit
        const convertedQty = convertToBaseUnit(qtyDecimal, enteredUnit);

        // Verify sufficient inventory exists (prevent overselling)
        const availStock = new Decimal(product.stockQuantity.toString());
        if (availStock.lt(convertedQty)) {
          throw new Error(
            `Insufficient stock for "${product.name}". Required: ${convertedQty.toNumber()} ${product.baseUnit}, Available: ${availStock.toNumber()} ${product.baseUnit}.`
          );
        }

        // Strictly use database-controlled price per base unit (prevent seller overrides)
        const pricePerBase = new Decimal(product.pricePerBaseUnit.toString());
        const lineTotal = calculatePrice(qtyDecimal, enteredUnit, pricePerBase);
        totalAmount = totalAmount.add(lineTotal);

        orderItemsData.push({
          productId,
          enteredQuantity: qtyDecimal,
          enteredUnit,
          convertedQuantity: convertedQty,
          unitPrice: pricePerBase, // store base unit price as record
          lineTotal,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          totalAmount,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}