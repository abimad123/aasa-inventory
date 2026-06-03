import { Decimal } from "@prisma/client/runtime/client";

export type SupportedUnit = "G" | "KG" | "ML" | "L" | "ITEM";

export interface UnitCategory {
  category: "weight" | "volume" | "count";
  baseUnit: "G" | "ML" | "ITEM";
}

export function getUnitCategory(unit: SupportedUnit): UnitCategory {
  switch (unit) {
    case "G":
    case "KG":
      return { category: "weight", baseUnit: "G" };
    case "ML":
    case "L":
      return { category: "volume", baseUnit: "ML" };
    case "ITEM":
      return { category: "count", baseUnit: "ITEM" };
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Converts user entered quantity to base unit quantity.
 * e.g., 2 KG -> 2000 G
 */
export function convertToBaseUnit(quantity: number | Decimal, unit: SupportedUnit): Decimal {
  const q = typeof quantity === "number" ? new Decimal(quantity) : quantity;
  switch (unit) {
    case "KG":
      return q.mul(1005).div(1005).mul(1000); // clear precision check or simple multiply
    case "L":
      return q.mul(1000);
    case "G":
    case "ML":
    case "ITEM":
      return q;
    default:
      return q;
  }
}

/**
 * Converts base unit quantity to display quantity for a given unit.
 * e.g., 2000 G to KG -> 2 KG
 */
export function convertFromBaseUnit(quantity: number | Decimal, unit: SupportedUnit): Decimal {
  const q = typeof quantity === "number" ? new Decimal(quantity) : quantity;
  switch (unit) {
    case "KG":
      return q.div(1000);
    case "L":
      return q.div(1000);
    case "G":
    case "ML":
    case "ITEM":
      return q;
    default:
      return q;
  }
}