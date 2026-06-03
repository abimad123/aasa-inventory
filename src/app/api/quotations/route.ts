import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";
import { convertToBaseUnit, calculatePrice } from "@/lib/units";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotations = await prisma.quotation.findMany({
      where: session.user.role === "ADMIN" ? {} : { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch quotations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body; // items array: { productId, enteredQuantity, enteredUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Quotation must contain at least one item." }, { status: 400 });
    }

    const quotation = await prisma.$transaction(async (tx) => {
      let totalAmount = new Decimal(0);
      const quotationItemsData = [];

      for (const item of items) {
        const { productId, enteredQuantity, enteredUnit } = item;

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.name}" is inactive.`);
        }

        const qtyDecimal = new Decimal(enteredQuantity);
        if (qtyDecimal.lte(0)) {
          throw new Error(`Quantity for "${product.name}" must be greater than zero.`);
        }

        // Convert quantity to base unit
        const convertedQty = convertToBaseUnit(qtyDecimal, enteredUnit);

        // Fetch price per base unit from database (prevent client override)
        const pricePerBase = new Decimal(product.pricePerBaseUnit.toString());
        const lineTotal = calculatePrice(qtyDecimal, enteredUnit, pricePerBase);
        totalAmount = totalAmount.add(lineTotal);

        quotationItemsData.push({
          productId,
          enteredQuantity: qtyDecimal,
          enteredUnit,
          convertedQuantity: convertedQty,
          unitPrice: pricePerBase,
          lineTotal,
        });
      }

      const newQuotation = await tx.quotation.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          totalAmount,
          items: {
            create: quotationItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return newQuotation;
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process quotation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
