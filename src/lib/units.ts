import { Decimal } from "decimal.js";

export type SupportedUnit = "G" | "KG" | "ML" | "L" | "ITEM";

export interface UnitCategory {
  category: "weight" | "volume" | "count";
  baseUnit: "G" | "ML" | "ITEM";
}

export function getUnitCategory(unit: SupportedUnit): UnitCategory {
  switch (unit.toUpperCase()) {
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
 * e.g., 2.5 KG -> 2500 G
 */
export function convertToBaseUnit(quantity: number | Decimal, unit: string): Decimal {
  const q = typeof quantity === "number" ? new Decimal(quantity) : quantity;
  switch (unit.toUpperCase()) {
    case "KG":
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
 * e.g., 2500 G to KG -> 2.5 KG
 */
export function convertFromBaseUnit(quantity: number | Decimal, unit: string): Decimal {
  const q = typeof quantity === "number" ? new Decimal(quantity) : quantity;
  switch (unit.toUpperCase()) {
    case "KG":
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

/**
 * Validates whether entered unit is compatible with the product's base unit.
 */
export function validateUnitCompatibility(enteredUnit: string, baseUnit: string): boolean {
  try {
    const enteredCat = getUnitCategory(enteredUnit as SupportedUnit);
    const baseCat = getUnitCategory(baseUnit as SupportedUnit);
    return enteredCat.category === baseCat.category;
  } catch {
    return false;
  }
}

/**
 * Calculates total price based on entered quantity, entered unit, and price per base unit.
 */
export function calculatePrice(quantity: number | Decimal, unit: string, pricePerBaseUnit: number | Decimal): Decimal {
  const baseQty = convertToBaseUnit(quantity, unit);
  const p = typeof pricePerBaseUnit === "number" ? new Decimal(pricePerBaseUnit) : pricePerBaseUnit;
  return baseQty.mul(p);
}