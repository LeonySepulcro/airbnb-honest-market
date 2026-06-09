import { useState, useEffect, useMemo } from 'react';
import {
  Film, Coffee, Beer, Sparkles, CupSoda, Droplet, GlassWater,
  Zap, Citrus, Package, Cookie, Flame, Heart, Smartphone,
  HeartPulse, Smile, Shield, Activity, Nut, Plus, Minus,
  ShoppingBag, X, Check, Search, Copy, Edit3,
  CheckCircle2, Heart as HeartIcon, Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from './data';
import { Product, CartItem, Category } from './types';
import { generatePixPayload } from './utils/pixGenerator';

// ─── Configurações fixas do anfitrião ──────────────────────────────────────
const CHAVE_PIX     = 'd2fbcf69-07d1-4ea1-9544-6d2767eacf9a';
const MERCHANT_NAME = 'Leony da Cruz Sepulcro';
const MERCHANT_CITY = 'Vitoria';
const WHATSAPP_NUM  = '5527998171757';
// ───────────────────────────────────────────────────────────────────────────

// Map string icon names to actual Lucide component instances
const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const map: Record<string, any> = {
    Film, Coffee, Beer, Sparkles, CupSoda, Droplet, GlassWater,
    Zap, Citrus, Package, Cookie, Flame, Heart, Smartphone,
    HeartPulse, Smile, Shield, Activity, Nut,
  };
  const IconComponent = map[name] || ShoppingBag;
  return <IconComponent className={className} />;
};

export default function App() {
  // Navigation & Category
  const [selectedCategory, setSelectedCategory] = useState<Category>('combos');
  const [searchQuery, setSearchQuery] = useState('');

  // Apartment display (read-only from URL or default)
  const [apNumber, setApNumber] = useState('Ap 402 - Ed. Rio Arno');
  const [isEditingAp, setIsEditingAp] = useState(false);
  const [tempApNumber, setTempApNumber] = useState('Ap 402 - Ed. Rio Arno');
  const [guestName, setGuestName] = useState('');

  // Cart & checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  // ─── URL param + Android back-button handling ─────────────────────────────
  useEffect(() => {
    // 1. Lê o parâmetro ?ap= da URL
    const params = new URLSearchParams(window.location.search);
    const ap = params.get('ap');
    if (ap) {
      setApNumber(ap);
      setTempApNumber(ap);
    }

    // 2. Intercepta o botão Voltar do Android para fechar modais internamente
    //    em vez de sair do navegador/app.
    const handlePopState = () => {
      // Prioridade: tela de sucesso > checkout
      setIsSubmitSuccessful(prev => {
        if (prev) return false;          // fecha tela de sucesso
        setIsCheckoutOpen(inner => {
          if (inner) return false;       // fecha checkout
          // nada aberto → deixa o browser navegar normalmente
          window.history.go(-1);
          return inner;
        });
        return prev;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sempre que um modal abre, empurra um estado na história para que o botão
  // Voltar do Android acione o popstate acima em vez de sair.
  useEffect(() => {
    if (isCheckoutOpen || isSubmitSuccessful) {
      window.history.pushState({ modal: true }, '');
    }
  }, [isCheckoutOpen, isSubmitSuccessful]);
  // ──────────────────────────────────────────────────────────────────────────

  // Edição do número do apto no header
  const handleSaveAp = () => {
    if (tempApNumber.trim()) {
      setApNumber(tempApNumber.trim());
      setIsEditingAp(false);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('ap', tempApNumber.trim());
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(item => item.product.id !== product.id);
      return prev.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const getProductQuantityInCart = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalItems = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(prod => {
      const matchesCategory = prod.category === selectedCategory;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // PIX Copia e Cola dinâmico
  const pixPayload = useMemo(() => {
    return generatePixPayload({
      chavePix: CHAVE_PIX,
      merchantName: MERCHANT_NAME,
      merchantCity: MERCHANT_CITY,
      amount: totalPrice,
      infoAdicional: apNumber,
      txId: `HM${apNumber.replace(/\D/g, '').slice(0, 8) || 'ARNO'}`,
    });
  }, [totalPrice, apNumber]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const triggerReset = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setIsSubmitSuccessful(false);
    setGuestName('');
  };

  // Mensagem pré-preenchida para o WhatsApp do anfitrião
  const whatsappHref = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    `Olá! Sou o hóspede do ${apNumber}${guestName ? ` (${guestName})` : ''}. ` +
    `Acabei de confirmar o pagamento de *R$ ${totalPrice.toFixed(2).replace('.', ',')}* via PIX pelo Honest Market. 🛒\n\n` +
    `*Itens comprados:*\n${cart.map(i => `• ${i.quantity}x ${i.product.name}`).join('\n')}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 select-none font-sans" id="app-container">
      <div
        className="w-full max-w-md h-screen md:h-[840px] md:rounded-[36px] md:shadow-2xl md:ring-12 md:ring-slate-950/10 bg-slate-50 flex flex-col overflow-hidden relative"
        id="phone-wrapper"
      >

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0 z-20 sticky top-0" id="main-header">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Airbnb Checkout</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isEditingAp ? (
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      value={tempApNumber}
                      onChange={(e) => setTempApNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveAp()}
                      className="w-40 bg-transparent text-slate-800 font-black text-sm focus:outline-none"
                      placeholder="Ex: Ap 402 - Ed. Rio Arno"
                      maxLength={30}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAp}
                      className="text-emerald-600 hover:text-emerald-700 font-bold p-0.5 cursor-pointer"
                      aria-label="Confirmar"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingAp(true)}
                    className="text-lg font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer select-none group transition-colors"
                    id="btn-edit-apartment"
                  >
                    <span>{apNumber}</span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-0.5 opacity-80" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100/50">
              <span className="text-lg">🏠</span>
            </div>
          </div>

          {/* Banner de confiança — compacto */}
          <div className="mt-3 bg-orange-50/70 rounded-xl px-3 py-2 flex items-center gap-2 border border-orange-100/50">
            <HeartIcon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 font-medium">
              Nós <strong>confiamos em você</strong>, pague via PIX e sinta-se em casa.
            </span>
          </div>
        </header>

        {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-28 px-4 pt-4 flex flex-col gap-4 scrollbar-none" id="product-area">

          {/* Barra de pesquisa */}
          <div className="relative sticky top-0 z-10 bg-slate-50 py-1" id="search-bar-container">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cerveja, chocolate, escova..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium placeholder-slate-400 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas de categorias */}
          <div className="flex-shrink-0 bg-white p-1 rounded-2xl border border-slate-200/60 shadow-xs flex justify-between items-center overflow-x-auto scrollbar-none sticky top-14 z-10" id="tabs-category">
            {[
              { id: 'combos',     label: 'Combos',    emoji: '🍿' },
              { id: 'geladeira',  label: 'Geladeira', emoji: '🥤' },
              { id: 'prateleira', label: 'Prateleira',emoji: '🍪' },
              { id: 'emergência', label: 'Emergência',emoji: '🩹' },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as Category)}
                  className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-300 select-none cursor-pointer ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                  id={`tab-${cat.id}`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Lista de produtos */}
          <div className="flex flex-col gap-3 mt-1" id="products-list">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono px-1">
              {selectedCategory === 'combos'     && 'Combos Econômicos'}
              {selectedCategory === 'geladeira'  && 'Bebidas e Frios Gelados'}
              {selectedCategory === 'prateleira' && 'Snacks e Guloseimas'}
              {selectedCategory === 'emergência' && 'Utilidades e Conveniências'}
            </h3>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2">
                <Compass className="w-10 h-10 text-slate-300 animate-pulse" />
                <h4 className="font-bold text-slate-700 text-sm">Nenhum item localizado</h4>
                <p className="text-xs text-slate-400">Tente buscar por termos mais genéricos ou mude de categoria.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const quantity = getProductQuantityInCart(product.id);
                return (
                  <motion.div
                    layout
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className="bg-white rounded-[24px] border border-slate-200/80 p-3 flex gap-3 hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className={`w-18 h-18 rounded-2xl flex-shrink-0 flex items-center justify-center border ${product.color}`}>
                      <IconRenderer name={product.icon} className="w-8 h-8 stroke-[1.8]" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{product.name}</h4>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 rounded-sm px-1 flex-shrink-0 self-start mt-0.5 uppercase tracking-wide">
                            {product.unit}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug mt-1 line-clamp-2">{product.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-orange-600 text-sm font-black">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>

                        <div className="flex items-center bg-slate-50 rounded-full border border-slate-200/90 p-1">
                          {quantity > 0 && (
                            <>
                              <button
                                onClick={() => removeFromCart(product)}
                                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 active:scale-90 shadow-xs flex items-center justify-center text-slate-700 border border-slate-200/60 transition-all cursor-pointer"
                                aria-label="Remover"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <span className="w-7 text-center text-xs font-black text-slate-800">{quantity}</span>
                            </>
                          )}
                          <button
                            onClick={() => addToCart(product)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              quantity > 0
                                ? 'bg-orange-500 hover:bg-orange-600 text-white active:scale-90 shadow-md'
                                : 'bg-white hover:bg-slate-100 active:scale-90 text-slate-700 border border-slate-200/60'
                            }`}
                            aria-label="Adicionar"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>

        {/* ── BARRA DO CARRINHO FLUTUANTE ──────────────────────────────────── */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="absolute bottom-5 left-4 right-4 z-30"
              id="sticky-cart-bar"
            >
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold flex justify-between px-5 items-center shadow-lg shadow-orange-500/20 hover:bg-orange-700 active:scale-95 transition-all cursor-pointer"
                id="btn-open-checkout"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <span className="text-xl">🛒</span>
                    <span className="absolute -top-2.5 -right-2 bg-white text-orange-600 font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-orange-100">
                      {totalItems}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold tracking-tight">Ver Meu Carrinho</span>
                </div>
                <span className="bg-orange-700/90 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide border border-orange-400/20">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL DE CHECKOUT ────────────────────────────────────────────── */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-40" id="checkout-modal-overlay">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full bg-white rounded-t-[32px] max-h-[92%] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200"
                id="checkout-modal"
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Revisar e Pagar</h3>
                      <p className="text-[10px] text-slate-400">Total de {totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 scrollbar-none">

                  {/* Resumo dos itens */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono mb-2">Seus itens</h4>
                    <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-2xl p-1 bg-slate-50 divide-y divide-slate-200/50">
                      {cart.map((item) => (
                        <div key={item.product.id} className="p-3 flex justify-between items-center text-slate-800 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-orange-500 min-w-5">{item.quantity}x</span>
                            <div>
                              <span className="font-bold text-slate-800">{item.product.name}</span>
                              <span className="text-[9px] text-slate-400 block">{item.product.unit}</span>
                            </div>
                          </div>
                          <span className="font-semibold text-slate-600">
                            R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Identificação do hóspede */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Informações do Hóspede</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[9px] text-slate-500 block font-bold mb-0.5">Acomodação</label>
                        <input
                          type="text"
                          value={apNumber}
                          disabled
                          className="w-full border border-slate-200 rounded-xl bg-slate-100 p-2 text-xs font-bold text-slate-600 text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-slate-500 block font-bold mb-0.5">Seu Nome (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Pedro Silva"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco PIX */}
                  <div className="border border-teal-100 bg-teal-50/50 rounded-3xl p-4 flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5 text-teal-800 mb-2">
                      <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 fill-teal-600" viewBox="0 0 512 512">
                          <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M193.3,375.4l-75.1-75.1l75.1-75.1 l75.1,75.1L193.3,375.4z M256,312.7l-56.7-56.7l56.7-56.7l56.7,56.7L256,312.7z M318.7,375.4l-75.1-75.1l75.1-75.1l75.1,75.1 L318.7,375.4z M256,136.6l75.1,75.1L256,286.9l-75.1-75.1L256,136.6z" />
                        </svg>
                      </div>
                      <span className="text-xs font-black tracking-wide uppercase">Dados para Pagamento PIX</span>
                    </div>

                    {/* QR Code dinâmico */}
                    <div className="w-40 h-40 bg-white rounded-2xl border border-slate-100 p-2.5 flex items-center justify-center shadow-xs relative mb-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&qzone=1&data=${encodeURIComponent(pixPayload)}`}
                        alt="PIX QR Code"
                        className="w-full h-full select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-2.5 h-0.5 bg-orange-500/80 animate-bounce top-8 pointer-events-none" />
                    </div>

                    <p className="text-[10px] text-slate-500 mb-1.5 max-w-[240px]">
                      Aponte a câmera para o QR Code ou use o código Copia e Cola abaixo.
                    </p>
                    <div className="text-[10px] bg-slate-100/80 border border-slate-200/50 text-slate-600 px-2.5 py-1 mb-3 rounded-lg leading-relaxed max-w-[240px]">
                      Destinatário: <strong className="text-slate-800 font-bold">{MERCHANT_NAME}</strong><br />
                      Chave Pix: <strong className="text-slate-800 font-mono font-bold text-[9px]">{CHAVE_PIX}</strong>
                    </div>

                    <button
                      onClick={handleCopyPix}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all outline-none border cursor-pointer ${
                        copiedPix
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 active:scale-95'
                      }`}
                    >
                      {copiedPix ? (
                        <><Check className="w-4 h-4" /> Chave PIX Copiada!</>
                      ) : (
                        <><Copy className="w-4 h-4 opacity-75" /> Copiar Código PIX Copia e Cola</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-5 border-t border-slate-100 flex-shrink-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-600">Total a pagar:</span>
                    <span className="text-xl font-black text-orange-600" id="checkout-total-price">
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSubmitSuccessful(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-sm uppercase py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    id="btn-confirm-payment"
                  >
                    Confirmar Pagamento Realizado
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <p className="text-[9px] text-slate-400 text-center">
                    Ao confirmar, o status é registrado para o fechamento da acomodação.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── TELA DE SUCESSO ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {isSubmitSuccessful && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-6 z-50 overflow-y-auto"
              id="success-screen"
            >
              <div className="relative mb-5 flex justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100 scale-150 opacity-50 blur-md animate-pulse" />
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white z-10">
                  <Check className="w-10 h-10 stroke-[3.5]" />
                </div>
              </div>

              <span className="text-[10px] tracking-widest font-bold uppercase text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 font-mono mb-2">
                Compra Concluída com Sucesso!
              </span>

              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight max-w-[280px]">
                Obrigado pelo seu pagamento, {guestName || 'hóspede'}!
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mt-2.5">
                Sua transação para <strong>{apNumber}</strong> foi registrada. Os produtos estão liberados — sinta-se em casa!
              </p>

              <div className="mt-6 border border-slate-100 bg-slate-50 rounded-2xl p-4 w-full text-left text-xs divide-y divide-slate-200">
                <div className="pb-2.5 flex justify-between">
                  <span className="text-slate-500">Acomodação:</span>
                  <span className="font-bold text-slate-800">{apNumber}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Valor Pago:</span>
                  <span className="font-bold text-orange-600">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="pt-2.5 flex justify-between">
                  <span className="text-slate-500">Método:</span>
                  <span className="font-bold text-teal-600 flex items-center gap-1">
                    <svg className="w-3 h-3 fill-teal-600" viewBox="0 0 512 512">
                      <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M193.3,375.4l-75.1-75.1l75.1-75.1 l75.1,75.1L193.3,375.4z M256,312.7l-56.7-56.7l56.7-56.7l56.7,56.7L256,312.7z M318.7,375.4l-75.1-75.1l75.1-75.1l75.1,75.1 L318.7,375.4z M256,136.6l75.1,75.1L256,286.9l-75.1-75.1L256,136.6z" />
                    </svg>
                    PIX Instantâneo
                  </span>
                </div>
              </div>

              {/* Botão WhatsApp — sempre visível, número fixo */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition-all tracking-wide cursor-pointer shadow-lg shadow-green-500/20"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Avisar Anfitrião no WhatsApp
              </a>

              <button
                onClick={triggerReset}
                className="mt-3 w-full bg-slate-900 text-white font-bold text-xs uppercase py-3 rounded-xl hover:bg-slate-800 active:scale-95 transition-all tracking-wide cursor-pointer"
              >
                Voltar ao Cardápio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
