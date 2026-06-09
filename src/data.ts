import { Product } from './types';

export const PRODUCTS: Product[] = [
  // --- COMBOS ---
  {
    id: 'combo-filme',
    name: 'Combo Cinema no Sofá 🍿',
    description: '1 Pipoca de Micro-ondas premium sabor Manteiga + 1 Coca-Cola Original de 2 Litros.',
    price: 18.90,
    category: 'combos',
    icon: 'Film',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    unit: 'Combo'
  },
  {
    id: 'combo-cafe',
    name: 'Combo Bom Dia Airbnb ☕',
    description: '1 Pote Café Solúvel Nescafé (50g) + 1 Caixa de Torradas Bauducco + 1 Geleia de Morango (250g).',
    price: 24.90,
    category: 'combos',
    icon: 'Coffee',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    unit: 'Combo'
  },
  {
    id: 'combo-resenha',
    name: 'Combo Resenha & Brinde 🍻',
    description: '4 Cervejas Corona Extra (Long Neck 330ml) bem geladas + 1 Tubo Batata Pringles Original (120g).',
    price: 45.00,
    category: 'combos',
    icon: 'Beer',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    unit: 'Combo'
  },
  {
    id: 'combo-miojo-turbinado',
    name: 'Combo Larica da Madrugada 🍜',
    description: '2 Cup Noodles (sabores sortidos) + 1 Refrigerante em Lata + 1 barra de Chocolate Hershey\'s.',
    price: 26.50,
    category: 'combos',
    icon: 'Sparkles',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    unit: 'Combo'
  },

  // --- GELADEIRA ---
  {
    id: 'geladeira-coca',
    name: 'Coca-Cola Original',
    description: 'Bebida super gelada e refrescante para acompanhar seus momentos.',
    price: 6.00,
    category: 'geladeira',
    icon: 'CupSoda',
    color: 'bg-red-50 text-red-600 border-red-100',
    unit: 'Lata (350ml)'
  },
  {
    id: 'geladeira-agua-gas',
    name: 'Água Mineral com Gás',
    description: 'Água de fonte natural purificada com gás, trincando de gelada.',
    price: 4.00,
    category: 'geladeira',
    icon: 'Sparkles',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    unit: 'Garrafa (500ml)'
  },
  {
    id: 'geladeira-agua-sem',
    name: 'Água Mineral sem Gás',
    description: 'Água mineral cristalina natural. Garanta sua hidratação diária.',
    price: 3.50,
    category: 'geladeira',
    icon: 'Droplet',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    unit: 'Garrafa (500ml)'
  },
  {
    id: 'geladeira-heineken',
    name: 'Cerveja Heineken Premium',
    description: 'Cerveja premium lager importada da Holanda, extremamente gelada.',
    price: 9.50,
    category: 'geladeira',
    icon: 'GlassWater',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    unit: 'Long Neck (330ml)'
  },
  {
    id: 'geladeira-redbull',
    name: 'Energético Red Bull',
    description: 'Red Bull Energy Drink te dá asas quando você mais precisa.',
    price: 12.00,
    category: 'geladeira',
    icon: 'Zap',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    unit: 'Lata (250ml)'
  },
  {
    id: 'geladeira-suco',
    name: 'Suco Integral de Laranja',
    description: 'Suco integral de laranja Pratt\'s, 100% fruta, sem conservantes.',
    price: 8.50,
    category: 'geladeira',
    icon: 'Citrus',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    unit: 'Garrafa (300ml)'
  },

  // --- PRATELEIRA ---
  {
    id: 'prateleira-pringles',
    name: 'Batata Pringles Original',
    description: 'Batata em chip clássica e crocante, sabor único na embalagem em tubo.',
    price: 15.90,
    category: 'prateleira',
    icon: 'Package',
    color: 'bg-red-50 text-red-500 border-red-100',
    unit: 'Tubo (120g)'
  },
  {
    id: 'prateleira-milka',
    name: 'Chocolate Milka Alpine',
    description: 'Famoso chocolate ao leite alpino importado que derrete na boca.',
    price: 16.90,
    category: 'prateleira',
    icon: 'Cookie',
    color: 'bg-indigo-50 text-indigo-500 border-indigo-100',
    unit: 'Barra (100g)'
  },
  {
    id: 'prateleira-noodles',
    name: 'Cup Noodles Galinha',
    description: 'Macarrão instantâneo prático e reconfortante para a larica rápida.',
    price: 7.50,
    category: 'prateleira',
    icon: 'Flame',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    unit: 'Copo (70g)'
  },
  {
    id: 'prateleira-cereal',
    name: 'Barra de Cereal Nutry',
    description: 'Barra rica em nutrientes sabor avelã, chocolate e deliciosos grãos.',
    price: 3.50,
    category: 'prateleira',
    icon: 'Heart',
    color: 'bg-green-50 text-green-600 border-green-100',
    unit: 'Unidade'
  },
  {
    id: 'prateleira-amendoim',
    name: 'Amendoim Mendorato',
    description: 'O tradicional e crocante amendoim japonês salgadinho ideal com cerveja.',
    price: 6.00,
    category: 'prateleira',
    icon: 'Nut',
    color: 'bg-amber-50 text-amber-800 border-amber-100',
    unit: 'Pacote (120g)'
  },

  // --- EMERGÊNCIA ---
  {
    id: 'emergencia-carregador',
    name: 'Carregador Celular USB-C',
    description: 'Esqueceu o cabo? Carregador completo bivolt (fonte + cabo) compatível Android e novos iPhones.',
    price: 39.00,
    category: 'emergência',
    icon: 'Smartphone',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
    unit: 'Kit Completo'
  },
  {
    id: 'emergencia-advil',
    name: 'Advil Analgésico',
    description: 'Alívio rápido de dores de cabeça, dor muscular e sintomas de gripe.',
    price: 8.00,
    category: 'emergência',
    icon: 'HeartPulse',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    unit: 'Cartela 4 cápsulas'
  },
  {
    id: 'emergencia-escova',
    name: 'Kit Escova & Creme Dental',
    description: 'Contém 1 escova de dentes ultramacia profissional mais 1 pasta Colgate (50g).',
    price: 18.00,
    category: 'emergência',
    icon: 'Smile',
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    unit: 'Kit Higiene'
  },
  {
    id: 'emergencia-preservativo',
    name: 'Preservativo Prudence',
    description: 'Preservativo lubrificado clássico de alta resistência.',
    price: 9.00,
    category: 'emergência',
    icon: 'Shield',
    color: 'bg-slate-50 text-slate-700 border-slate-100',
    unit: 'Pacote com 3un'
  },
  {
    id: 'emergencia-engov',
    name: 'Engov Anti-Ressaca',
    description: 'Combate os sintomas da ressaca. Ideal para tomar antes e depois da festa.',
    price: 7.00,
    category: 'emergência',
    icon: 'Activity',
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    unit: 'Cartela com 4un'
  }
];
