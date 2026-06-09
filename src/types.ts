export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'combos' | 'geladeira' | 'prateleira' | 'emergência';
  icon: string; // Name of the Lucide-react icon to render dynamically
  color: string; // Accent color for the item container or icon background
  unit?: string; // e.g., "unidade", "lata (350ml)", "long neck (330ml)"
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Category = 'combos' | 'geladeira' | 'prateleira' | 'emergência';
