import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

// ── Storefront catalogue (material categories · types · dimensions) ─────────
// Hoisted in AppLayout so Material Categories settings and the All Materials
// page (Add Material picker + expandable types) read the SAME catalogue.

export type MaterialClassification = "Consumable" | "Reusable";

export interface MaterialDimension {
  standard: string; // Weight | Length | Width | Breadth | Thickness | Area | Volume | Custom
  value: string;
  unit: string;
}

export interface MaterialType {
  name: string;
  dimensions: MaterialDimension[];
  sku?: string;
}

export interface CategoryMaterial {
  name: string;
  classification: MaterialClassification;
  types: MaterialType[];
}

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  materials: CategoryMaterial[];
}

export const DIMENSION_STANDARDS = ["Weight", "Length", "Width", "Breadth", "Thickness", "Area", "Volume", "Custom"];

export const DIMENSION_UNITS = ["kg", "g", "tonne", "mm", "cm", "m", "inch", "ft", "m²", "ft²", "m³", "L", "bag", "box", "roll", "sheet", "pcs", "set"];

export const newDimension = (): MaterialDimension => ({ standard: "Length", value: "", unit: "mm" });

export const SEED_CATEGORIES: MaterialCategory[] = [
  { id: "1", name: "Concrete & Cement", description: "Cement bags, ready-mix concrete, and admixtures", color: "gray", materials: [
    { name: "Cement (50kg bag)", classification: "Consumable", types: [
      { name: "Ordinary Portland Cement", dimensions: [{ standard: "Weight", value: "50", unit: "kg" }], sku: "CEM-OPC-50" },
      { name: "Rapid-Hardening Cement", dimensions: [{ standard: "Weight", value: "50", unit: "kg" }], sku: "CEM-RHC-50" },
    ] },
    { name: "Concrete Block", classification: "Consumable", types: [
      { name: "Solid Block", dimensions: [{ standard: "Thickness", value: "9", unit: "inch" }], sku: "BLK-SLD-9" },
      { name: "Hollow Block", dimensions: [{ standard: "Thickness", value: "9", unit: "inch" }], sku: "BLK-HLW-9" },
    ] },
  ] },
  { id: "2", name: "Steel & Reinforcement", description: "Rebar, mesh, structural steel sections", color: "blue", materials: [
    { name: "Steel Rebar", classification: "Consumable", types: [
      { name: "Y12", dimensions: [{ standard: "Custom", value: "12", unit: "mm" }], sku: "STL-REB-Y12" },
      { name: "Y16", dimensions: [{ standard: "Custom", value: "16", unit: "mm" }], sku: "STL-REB-Y16" },
    ] },
  ] },
  { id: "3", name: "Electrical", description: "Cables, conduits, switches, and distribution boards", color: "amber", materials: [
    { name: "Cable", classification: "Consumable", types: [
      { name: "2.5mm Twin", dimensions: [{ standard: "Width", value: "2.5", unit: "mm" }], sku: "ELE-CAB-2.5" },
      { name: "4mm Single", dimensions: [{ standard: "Width", value: "4", unit: "mm" }], sku: "ELE-CAB-4.0" },
    ] },
  ] },
  { id: "4", name: "Plumbing & Drainage", description: "Pipes, fittings, valves, and drainage systems", color: "teal", materials: [
    { name: "PVC Pipe", classification: "Consumable", types: [
      { name: "2 Inch", dimensions: [{ standard: "Custom", value: "2", unit: "inch" }], sku: "PLB-PVC-2" },
      { name: "4 Inch", dimensions: [{ standard: "Custom", value: "4", unit: "inch" }], sku: "PLB-PVC-4" },
    ] },
  ] },
  { id: "5", name: "Timber & Formwork", description: "Planks, plywood sheets, and shuttering material", color: "orange", materials: [
    { name: "Plywood", classification: "Reusable", types: [
      { name: "12mm Sheet", dimensions: [
        { standard: "Length", value: "2440", unit: "mm" },
        { standard: "Breadth", value: "1220", unit: "mm" },
        { standard: "Thickness", value: "12", unit: "mm" },
      ], sku: "TMB-PLY-12" },
      { name: "18mm Sheet", dimensions: [
        { standard: "Length", value: "2440", unit: "mm" },
        { standard: "Breadth", value: "1220", unit: "mm" },
        { standard: "Thickness", value: "18", unit: "mm" },
      ], sku: "TMB-PLY-18" },
    ] },
  ] },
  { id: "6", name: "Finishing Materials", description: "Paints, tiles, screeds, and wall finishes", color: "purple", materials: [
    { name: "Granite Tiles", classification: "Consumable", types: [
      { name: "Wall Tile", dimensions: [
        { standard: "Length", value: "600", unit: "mm" },
        { standard: "Breadth", value: "600", unit: "mm" },
        { standard: "Thickness", value: "8", unit: "mm" },
        { standard: "Custom", value: "Matte", unit: "finish" },
      ], sku: "GT-W-600600-MAT" },
      { name: "Floor Tile", dimensions: [
        { standard: "Length", value: "600", unit: "mm" },
        { standard: "Breadth", value: "600", unit: "mm" },
        { standard: "Thickness", value: "10", unit: "mm" },
        { standard: "Custom", value: "Gloss", unit: "finish" },
      ], sku: "GT-F-600600-GLO" },
    ] },
  ] },
  { id: "7", name: "Aggregates & Fill", description: "Sharp sand, gravel, laterite, and hardcore fill", color: "green", materials: [
    { name: "Sharp Sand", classification: "Consumable", types: [
      { name: "River Sand", dimensions: [{ standard: "Weight", value: "1", unit: "tonne" }], sku: "AGG-SND-RIV" },
    ] },
  ] },
  { id: "8", name: "Plant & Equipment", description: "Consumables and accessories for plant operations", color: "red", materials: [] },
];

interface StorefrontContextValue {
  categories: MaterialCategory[];
  setCategories: Dispatch<SetStateAction<MaterialCategory[]>>;
  addCategory: (c: Omit<MaterialCategory, "id">) => void;
  updateCategory: (id: string, patch: Omit<MaterialCategory, "id">) => void;
  deleteCategory: (id: string) => void;
  allCategoryMaterials: { category: MaterialCategory; material: CategoryMaterial }[];
}

const StorefrontContext = createContext<StorefrontContextValue | undefined>(undefined);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MaterialCategory[]>(SEED_CATEGORIES);

  const addCategory = (c: Omit<MaterialCategory, "id">) =>
    setCategories(prev => [...prev, { ...c, id: String(Date.now()) }]);

  const updateCategory = (id: string, patch: Omit<MaterialCategory, "id">) =>
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const deleteCategory = (id: string) =>
    setCategories(prev => prev.filter(c => c.id !== id));

  const allCategoryMaterials = categories.flatMap(c =>
    c.materials.map(material => ({ category: c, material }))
  );

  return (
    <StorefrontContext.Provider value={{ categories, setCategories, addCategory, updateCategory, deleteCategory, allCategoryMaterials }}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error("useStorefront must be used within StorefrontProvider");
  return ctx;
}