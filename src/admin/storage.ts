import { CatalogProduct, ApInventoryItem } from './types';
import { APARTMENTS, type ApKey } from '../apartments';

export { APARTMENTS, type ApKey };

const AP_SELECTED_KEY = 'hm_selected_ap';

export const getSelectedAp = (): ApKey => {
  const s = localStorage.getItem(AP_SELECTED_KEY) as ApKey | null;
  return s && APARTMENTS.some(a => a.key === s) ? s : 'hope_202';
};

export const setSelectedAp = (key: ApKey) =>
  localStorage.setItem(AP_SELECTED_KEY, key);

// ── Catálogo de produtos (compartilhado entre todos os aps) ──────────────────

const CATALOG_KEY = 'hm_catalog';

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

// ── Inventário por ap (cada ap tem sua própria chave) ────────────────────────

const invKey = (k: ApKey) => `hm_inv_${k}`;

export const getApInventory = (apKey: ApKey): ApInventoryItem[] => {
  try { return JSON.parse(localStorage.getItem(invKey(apKey)) || '[]'); }
  catch { return []; }
};

export const saveApInventory = (apKey: ApKey, inventory: ApInventoryItem[]) =>
  localStorage.setItem(invKey(apKey), JSON.stringify(inventory));

export const clearApInventory = (apKey: ApKey) =>
  localStorage.removeItem(invKey(apKey));
