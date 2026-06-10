export interface CatalogProduct {
  barcode: string;
  name: string;
}

export interface ApInventoryItem {
  barcode: string;
  name: string;
  quantity: number;
  addedAt: number;
}

export interface CheckoutItem extends ApInventoryItem {
  found: number;
}

export type AdminScreen = 'home' | 'abastecer' | 'conferir' | 'cadastro';
