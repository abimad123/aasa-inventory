import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const products = await prisma.product.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin can create products
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { sku, name, description, category, baseUnit, pricePerBaseUnit, stockQuantity } = body;

    // Validate fields
    if (!sku || !name || !baseUnit || pricePerBaseUnit === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku },
    });
    if (existing) {
      return NextResponse.json({ error: `Product with SKU "${sku}" already exists.` }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        description: description || "",
        category: category || "Uncategorized",
        baseUnit,
        pricePerBaseUnit: new Decimal(pricePerBaseUnit),
        stockQuantity: new Decimal(stockQuantity),
        isActive: true,
      },
    });

    // Create a transaction log
    await prisma.inventoryTransaction.create({
      data: {
        productId: newProduct.id,
        type: "IN",
        quantity: new Decimal(stockQuantity),
        notes: "Initial product creation",
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}