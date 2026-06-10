import { CatalogProduct, ApInventoryItem } from './types';

const CATALOG_KEY   = 'hm_catalog';
const INVENTORY_KEY = 'hm_ap_inventory';

// ── Catálogo de produtos ────────────────────────────────────────────────────

export const getCatalog = (): CatalogProduct[] => {
  try { return JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]'); }
  catch { return []; }
};

export const saveCatalog = (catalog: CatalogProduct[]) =>
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));

export const getProductByBarcode = (barcode: string): CatalogProduct | undefined =>
  getCatalog().find(p => p.barcode === barcode);

export const upsertCatalogProduct = (product: CatalogProduct) => {
  const catalog = getCatalog();
  const idx = catalog.findIndex(p => p.barcode === product.barcode);
  if (idx >= 0) catalog[idx] = product;
  else catalog.push(product);
  saveCatalog(catalog);
};

export const deleteCatalogProduct = (barcode: string) =>
  saveCatalog(getCatalog().filter(p => p.barcode !== barcode));

// ── Inventário do ap ────────────────────────────────────────────────────────

export const getApInventory = (): ApInventoryItem[] => {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]'); }
  catch { return []; }
};

export const saveApInventory = (inventory: ApInventoryItem[]) =>
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));

export const clearApInventory = () =>
  localStorage.removeItem(INVENTORY_KEY);
