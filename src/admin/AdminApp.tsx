import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, Package, Search, Plus, Trash2,
  CheckCircle2, XCircle, X, Camera, Inbox, Edit2,
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import {
  getCatalog, getProductByBarcode, upsertCatalogProduct,
  deleteCatalogProduct, getApInventory, saveApInventory, clearApInventory,
  APARTMENTS, type ApKey, getSelectedAp, setSelectedAp as saveSelectedAp,
} from './storage';
import { CatalogProduct, ApInventoryItem, CheckoutItem } from './types';

interface Props { onLogout: () => void; }

type Screen = 'home' | 'abastecer' | 'conferir' | 'cadastro';

// ── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: 'ok' | 'warn' | 'err'; }
let _tid = 0;

/** "600" → "R$ 6,00" (cents string para preço formatado) */
function centsToReais(raw: string): string {
  const n = parseInt(raw || '0', 10);
  if (!n) return '';
  return `R$ ${(n / 100).toFixed(2).replace('.', ',')}`;
}
/** Preço float para cents string (6.0 → "600") */
function priceToCents(price?: number): string {
  if (price == null) return '';
  return String(Math.round(price * 100));
}

export default function AdminApp({ onLogout }: Props) {
  const [screen, setScreen]   = useState<Screen>('home');
  const [currentAp, setCurrentAp] = useState<ApKey>(getSelectedAp);
  const screenRef = useRef<Screen>('home');
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Intercepta botão de voltar do Android — navega dentro do admin ao invés de sair
  useEffect(() => {
    window.history.pushState({ admin: true }, '');
    const onPop = () => {
      if (screenRef.current !== 'home') setScreen('home');
      window.history.pushState({ admin: true }, '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, type: Toast['type'] = 'ok') => {
    const id = ++_tid;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2500);
  }, []);

  // ── ABASTECER ──────────────────────────────────────────────────────────────
  const [sessionItems, setSessionItems] = useState<ApInventoryItem[]>([]);
  const [unknownCode, setUnknownCode]   = useState<string | null>(null);
  const [newName, setNewName]           = useState('');
  const [newPrice, setNewPrice]         = useState('');

  const onAbastecerScan = useCallback((code: string) => {
    const prod = getProductByBarcode(code);
    if (prod) {
      setSessionItems(prev => {
        const hit = prev.find(i => i.barcode === code);
        if (hit) return prev.map(i => i.barcode === code ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { barcode: code, name: prod.name, quantity: 1, addedAt: Date.now() }];
      });
      toast(`${prod.name} +1`);
    } else {
      setUnknownCode(code);
    }
  }, [toast]);

  const registerUnknown = () => {
    if (!unknownCode || !newName.trim() || !newPrice.trim()) return;
    const price = parseInt(newPrice, 10) / 100;
    const prod: CatalogProduct = {
      barcode: unknownCode,
      name: newName.trim(),
      price: isNaN(price) ? undefined : price,
    };
    upsertCatalogProduct(prod);
    setSessionItems(prev => {
      const hit = prev.find(i => i.barcode === unknownCode);
      if (hit) return prev.map(i => i.barcode === unknownCode ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { barcode: unknownCode, name: prod.name, quantity: 1, addedAt: Date.now() }];
    });
    toast(`${prod.name} cadastrado!`);
    setUnknownCode(null);
    setNewName('');
    setNewPrice('');
  };

  const salvarAbastecimento = () => {
    if (!sessionItems.length) return;
    saveApInventory(currentAp, sessionItems);
    toast(`${sessionItems.reduce((a, i) => a + i.quantity, 0)} itens salvos no ap`);
    setSessionItems([]);
    setScreen('home');
  };

  // ── CONFERIR ───────────────────────────────────────────────────────────────
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [conferirDone, setConferirDone]   = useState(false);

  const startConferir = () => {
    setCheckoutItems(getApInventory(currentAp).map(i => ({ ...i, found: 0 })));
    setConferirDone(false);
    setScreen('conferir');
  };

  const onConferirScan = useCallback((code: string) => {
    setCheckoutItems(prev => {
      const item = prev.find(i => i.barcode === code);
      if (!item) { toast('Item não estava no ap', 'warn'); return prev; }
      if (item.found >= item.quantity) { toast(`${item.name} já completo`, 'warn'); return prev; }
      toast(`${item.name} ✓`);
      return prev.map(i => i.barcode === code ? { ...i, found: i.found + 1 } : i);
    });
  }, [toast]);

  const consumed  = checkoutItems.filter(i => i.found < i.quantity);
  const allFound  = checkoutItems.length > 0 && checkoutItems.every(i => i.found >= i.quantity);

  // ── CADASTRO ───────────────────────────────────────────────────────────────
  const [catalog, setCatalog]             = useState<CatalogProduct[]>([]);
  const [scanning, setScanning]           = useState(false);
  const [cadastroCode, setCadastroCode]   = useState<string | null>(null);
  const [cadastroName, setCadastroName]   = useState('');
  const [cadastroPrice, setCadastroPrice] = useState('');

  useEffect(() => { if (screen === 'cadastro') setCatalog(getCatalog()); }, [screen]);

  const onCadastroScan = useCallback((code: string) => {
    setScanning(false);
    const existing = getProductByBarcode(code);
    setCadastroCode(code);
    setCadastroName(existing?.name || '');
    setCadastroPrice(existing?.price != null ? priceToCents(existing.price) : '');
  }, []);

  const saveCadastro = () => {
    if (!cadastroCode || !cadastroName.trim() || !cadastroPrice.trim()) return;
    const price = parseInt(cadastroPrice, 10) / 100;
    upsertCatalogProduct({
      barcode: cadastroCode,
      name: cadastroName.trim(),
      price: isNaN(price) ? undefined : price,
    });
    setCatalog(getCatalog());
    setCadastroCode(null);
    setCadastroName('');
    setCadastroPrice('');
    toast('Produto salvo!');
  };

  // ── Dados para home ────────────────────────────────────────────────────────
  const inventory     = getApInventory(currentAp);
  const totalNoAp     = inventory.reduce((a, i) => a + i.quantity, 0);
  const catalogCount  = getCatalog().length;

  // ── Header reutilizável ────────────────────────────────────────────────────
  const goHome = () => setScreen('home');
  const Header = ({ title }: { title: string }) => (
    <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
      {screen !== 'home' ? (
        <button onClick={goHome} className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Voltar</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm font-black text-slate-800">Controle de Estoque</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {screen !== 'home' && (
          <div className="text-right">
            <p className="text-sm font-bold text-slate-600">{title}</p>
            <p className="text-[10px] font-bold text-orange-400">
              {APARTMENTS.find(a => a.key === currentAp)?.label}
            </p>
          </div>
        )}
        {screen === 'home' && (
          <button onClick={onLogout} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-xs cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 font-sans">
      <div className="w-full max-w-md h-screen md:h-[840px] md:rounded-[36px] md:shadow-2xl bg-slate-50 flex flex-col overflow-hidden relative">

        {/* Toasts */}
        <div className="absolute top-20 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg ${
                  t.type === 'ok' ? 'bg-emerald-500' : t.type === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                }`}
              >
                {t.msg}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── HOME ──────────────────────────────────────────────────────────── */}
        {screen === 'home' && (
          <>
            <Header title="" />
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Status */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-orange-400 mb-1">
                  {APARTMENTS.find(a => a.key === currentAp)?.label ?? 'Ap'}
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-orange-600">{totalNoAp}</span>
                  <span className="text-sm text-orange-500 font-bold pb-0.5">itens no ap</span>
                </div>
                {inventory.length > 0 && (
                  <p className="text-[11px] text-orange-400 mt-0.5">{inventory.length} produtos diferentes</p>
                )}
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setSessionItems([]); setScreen('abastecer'); }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer text-left active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Abastecer Ap</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Scan do que vai entrar</p>
                  </div>
                </button>

                <button
                  onClick={startConferir}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer text-left active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Search className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Conferir Checkout</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">O que foi consumido</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setScreen('cadastro')}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-300 hover:bg-violet-50/40 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-violet-500" />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800 text-sm">Cadastro de Produtos</p>
                  <p className="text-[11px] text-slate-400">{catalogCount} produtos cadastrados</p>
                </div>
              </button>

              {/* Seletor de Apartamento */}
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 px-1">
                  Apartamento ativo
                </p>
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                  {APARTMENTS.map(ap => {
                    const isActive = currentAp === ap.key;
                    const url = `${window.location.origin}/?ap=${encodeURIComponent(ap.apParam)}`;
                    return (
                      <button
                        key={ap.key}
                        onClick={() => { saveSelectedAp(ap.key); setCurrentAp(ap.key); }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors active:bg-slate-50 ${isActive ? 'bg-orange-50/60' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${isActive ? 'text-orange-700' : 'text-slate-600'}`}>
                            {ap.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{url}</p>
                        </div>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista do ap */}
              {inventory.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 px-1">No ap agora</p>
                  <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    {inventory.map(item => (
                      <div key={item.barcode} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                        <span className="text-sm font-black text-orange-500">{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ABASTECER ─────────────────────────────────────────────────────── */}
        {screen === 'abastecer' && (
          <>
            <Header title="Abastecer Ap" />
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-4">
                <BarcodeScanner onScan={onAbastecerScan} active={screen === 'abastecer' && !unknownCode} />
                <p className="text-center text-xs text-slate-400 mt-2">Aponte para o código de barras do produto</p>
              </div>

              {sessionItems.length > 0 && (
                <div className="px-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Escaneados — {sessionItems.reduce((a, i) => a + i.quantity, 0)} itens
                  </p>
                  <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    {sessionItems.map(item => (
                      <div key={item.barcode} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 flex-1 mr-2">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSessionItems(p =>
                              p.map(i => i.barcode === item.barcode ? { ...i, quantity: i.quantity - 1 } : i)
                               .filter(i => i.quantity > 0)
                            )}
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold cursor-pointer active:scale-90"
                          >−</button>
                          <span className="text-sm font-black text-orange-500 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => setSessionItems(p =>
                              p.map(i => i.barcode === item.barcode ? { ...i, quantity: i.quantity + 1 } : i)
                            )}
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold cursor-pointer active:scale-90"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 mt-auto">
                <button
                  onClick={salvarAbastecimento}
                  disabled={!sessionItems.length}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
                >
                  Salvar no Ap ({sessionItems.reduce((a, i) => a + i.quantity, 0)} itens)
                </button>
              </div>
            </div>

            {/* Modal produto desconhecido */}
            <AnimatePresence>
              {unknownCode && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-end z-40"
                >
                  <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full bg-white rounded-t-[28px] p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-slate-800">Produto novo detectado</h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{unknownCode}</p>
                      </div>
                      <button onClick={() => setUnknownCode(null)} className="text-slate-400 cursor-pointer">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Nome do produto..."
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      autoFocus
                    />
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Preço em centavos: 600 = R$ 6,00"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && registerUnknown()}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      {newPrice && (
                        <p className="text-xs font-bold text-orange-500 mt-1 ml-1">{centsToReais(newPrice)}</p>
                      )}
                    </div>
                    <button
                      onClick={registerUnknown}
                      disabled={!newName.trim() || !newPrice.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3 rounded-xl transition-all cursor-pointer"
                    >
                      Cadastrar e Adicionar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── CONFERIR ──────────────────────────────────────────────────────── */}
        {screen === 'conferir' && (
          <>
            <Header title="Conferir Checkout" />
            <div className="flex-1 overflow-y-auto flex flex-col">
              {!conferirDone ? (
                <>
                  <div className="p-4">
                    <BarcodeScanner onScan={onConferirScan} active={screen === 'conferir' && !conferirDone} />
                    <p className="text-center text-xs text-slate-400 mt-2">Escaneie os itens que ainda estão no ap</p>
                  </div>

                  {checkoutItems.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <div>
                        <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm font-semibold">Ap sem inventário</p>
                        <p className="text-slate-300 text-xs mt-1">Use "Abastecer Ap" primeiro.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                        {checkoutItems.filter(i => i.found >= i.quantity).length}/{checkoutItems.length} verificados
                      </p>
                      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                        {checkoutItems.map(item => {
                          const done = item.found >= item.quantity;
                          return (
                            <div key={item.barcode} className={`px-4 py-3 flex items-center justify-between ${done ? 'bg-emerald-50/60' : ''}`}>
                              <div className="flex items-center gap-2.5">
                                {done
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                }
                                <span className={`text-sm font-semibold ${done ? 'text-emerald-700' : 'text-slate-700'}`}>
                                  {item.name}
                                </span>
                              </div>
                              <span className={`text-xs font-black ${done ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {item.found}/{item.quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-4 mt-auto">
                    <button
                      onClick={() => setConferirDone(true)}
                      disabled={checkoutItems.length === 0}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
                    >
                      Fechar Conferência
                    </button>
                  </div>
                </>
              ) : (
                // ── Resultado da conferência ──
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                  {allFound ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="font-black text-emerald-700 text-base">Tudo certo!</p>
                      <p className="text-xs text-emerald-500 mt-1">Nenhum item foi consumido.</p>
                    </div>
                  ) : (
                    <>
                      {/* Cabeçalho resumo */}
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-red-400 mb-1">Consumido pelo hóspede</p>
                        <div className="flex items-end gap-1.5">
                          <span className="text-3xl font-black text-red-600">
                            {consumed.reduce((a, i) => a + (i.quantity - i.found), 0)}
                          </span>
                          <span className="text-sm text-red-400 font-bold pb-0.5">itens faltando</span>
                        </div>
                      </div>

                      {/* Lista de itens consumidos */}
                      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                        {consumed.map(item => {
                          const qtd   = item.quantity - item.found;
                          const prod  = getProductByBarcode(item.barcode);
                          const unit  = prod?.price;
                          const total = unit != null ? unit * qtd : null;
                          return (
                            <div key={item.barcode} className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 flex-1 mr-2">
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                                  <span className="text-[11px] text-slate-400 block">
                                    {qtd} unid{unit != null ? ` × R$ ${unit.toFixed(2).replace('.', ',')}` : ''}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-black text-red-500 text-right">
                                {total != null
                                  ? `R$ ${total.toFixed(2).replace('.', ',')}`
                                  : `${qtd} faltando`}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total a receber — só aparece se todos os itens consumidos têm preço */}
                      {consumed.every(i => getProductByBarcode(i.barcode)?.price != null) && (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-orange-400">Total a receber</p>
                            <p className="text-[11px] text-orange-400 mt-0.5">Verifique o extrato PIX</p>
                          </div>
                          <span className="text-2xl font-black text-orange-600">
                            R$ {consumed
                              .reduce((a, i) => {
                                const p = getProductByBarcode(i.barcode)?.price ?? 0;
                                return a + p * (i.quantity - i.found);
                              }, 0)
                              .toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}

                      {/* Aviso se algum item não tem preço cadastrado */}
                      {consumed.some(i => getProductByBarcode(i.barcode)?.price == null) && (
                        <p className="text-[11px] text-slate-400 text-center px-4">
                          ⚠️ Alguns itens sem preço cadastrado — total parcial não exibido.
                        </p>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => { clearApInventory(currentAp); setCheckoutItems([]); setConferirDone(false); setScreen('home'); }}
                    className="w-full bg-slate-900 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
                  >
                    Limpar Ap e Fechar
                  </button>
                  <button
                    onClick={() => { setConferirDone(false); setScreen('home'); }}
                    className="w-full border border-slate-200 text-slate-500 font-bold py-3 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    Voltar sem limpar
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CADASTRO ──────────────────────────────────────────────────────── */}
        {screen === 'cadastro' && (
          <>
            <Header title="Cadastro" />
            <div className="flex-1 overflow-y-auto flex flex-col">
              {scanning ? (
                <div className="p-4 flex flex-col gap-3">
                  <BarcodeScanner onScan={onCadastroScan} active={scanning} />
                  <button
                    onClick={() => setScanning(false)}
                    className="w-full border border-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : cadastroCode ? (
                <div className="p-4 flex flex-col gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Código de barras</p>
                    <p className="text-sm font-mono font-bold text-slate-700">{cadastroCode}</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Nome do produto..."
                    value={cadastroName}
                    onChange={e => setCadastroName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    autoFocus
                  />
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Preço em centavos: 600 = R$ 6,00"
                      value={cadastroPrice}
                      onChange={e => setCadastroPrice(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && saveCadastro()}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    {cadastroPrice && (
                      <p className="text-xs font-bold text-orange-500 mt-1 ml-1">{centsToReais(cadastroPrice)}</p>
                    )}
                  </div>
                  <button
                    onClick={saveCadastro}
                    disabled={!cadastroName.trim() || !cadastroPrice.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Salvar Produto
                  </button>
                  <button onClick={() => { setCadastroCode(null); setCadastroName(''); setCadastroPrice(''); }} className="text-slate-400 text-sm text-center cursor-pointer py-1">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <button
                    onClick={() => setScanning(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Escanear para Cadastrar
                  </button>

                  {catalog.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center py-10">
                      <div>
                        <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Nenhum produto cadastrado.</p>
                        <p className="text-slate-300 text-xs mt-1">Escaneie um item para começar.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                      {catalog.map(p => (
                        <div key={p.barcode} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-mono text-slate-400">{p.barcode}</p>
                              {p.price != null && (
                                <span className="text-[10px] font-bold text-orange-500">
                                  R$ {p.price.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setCadastroCode(p.barcode);
                                setCadastroName(p.name);
                                setCadastroPrice(priceToCents(p.price));
                              }}
                              className="text-slate-300 hover:text-blue-500 cursor-pointer p-1 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { deleteCatalogProduct(p.barcode); setCatalog(getCatalog()); }}
                              className="text-red-300 hover:text-red-500 cursor-pointer p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
