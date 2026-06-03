import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { sku, name, description, category, baseUnit, pricePerBaseUnit, stockQuantity, isActive } = body;

    // Validate required fields
    if (!sku || !name || !baseUnit || pricePerBaseUnit === undefined) {
      return NextResponse.json({ error: "Missing required fields (sku, name, baseUnit, pricePerBaseUnit)" }, { status: 400 });
    }

    if (Number(pricePerBaseUnit) < 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    if (stockQuantity !== undefined && Number(stockQuantity) < 0) {
      return NextResponse.json({ error: "Stock quantity must be a positive number" }, { status: 400 });
    }

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check SKU uniqueness (exclude current product)
    if (sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuConflict) {
        return NextResponse.json({ error: `SKU "${sku}" is already in use by another product.` }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      sku,
      name,
      description: description ?? existing.description,
      category: category || existing.category,
      baseUnit,
      pricePerBaseUnit: new Decimal(pricePerBaseUnit),
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Track stock changes via InventoryTransaction
    if (stockQuantity !== undefined) {
      const newStock = new Decimal(stockQuantity);
      const oldStock = existing.stockQuantity;
      const diff = newStock.sub(oldStock);

      updateData.stockQuantity = newStock;

      if (!diff.isZero()) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: params.id,
            type: "ADJUSTMENT",
            quantity: diff.abs(),
            notes: diff.isPositive()
              ? `Stock increased by ${diff.toFixed(4)} via admin edit`
              : `Stock decreased by ${diff.abs().toFixed(4)} via admin edit`,
          },
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Soft delete: set isActive = false
    const deactivated = await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Log the deactivation
    await prisma.inventoryTransaction.create({
      data: {
        productId: params.id,
        type: "ADJUSTMENT",
        quantity: new Decimal(0),
        notes: `Product "${existing.name}" deactivated via admin action`,
      },
    });

    return NextResponse.json({ message: "Product deactivated successfully", product: deactivated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to deactivate product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
