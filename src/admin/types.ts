export interface CatalogProduct {
  barcode: string;
  name: string;
  price?: number; // preço de venda em R$
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
