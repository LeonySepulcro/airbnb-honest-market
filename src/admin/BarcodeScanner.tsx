import { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  active?: boolean;
}

// BarcodeDetector não tem tipos oficiais no TS — declaramos manualmente
declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

// ── Validação de checksum EAN-13 ────────────────────────────────────────────
// Rejeita leituras parciais ou corrompidas antes mesmo de chegar no app
function isValidEAN(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;

  if (code.length === 13) {
    const d = code.split('').map(Number);
    const sum = d.slice(0, 12).reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10 === d[12];
  }

  if (code.length === 8) {
    // EAN-8: pesos invertidos (posições ímpares × 3, pares × 1)
    const d = code.split('').map(Number);
    const sum = d.slice(0, 7).reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === d[7];
  }

  return false;
}

export default function BarcodeScanner({ onScan, active = true }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const lastRef     = useRef<{ code: string; time: number } | null>(null);
  // Confirmação: exige 2 leituras idênticas consecutivas antes de disparar
  const pendingRef  = useRef<{ code: string; count: number } | null>(null);
  const onScanRef   = useRef(onScan);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    if (!active) return;

    if (!('BarcodeDetector' in window)) return;

    // Apenas formatos EAN — ignora QR, Code128, etc. que geram leituras espúrias
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8'] });

    let stopped = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const loop = async () => {
          if (stopped) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const results = await detector.detect(videoRef.current);
              if (results.length > 0) {
                const code = results[0].rawValue;

                // 1. Rejeita códigos que não passam no checksum EAN
                if (!isValidEAN(code)) {
                  pendingRef.current = null;
                  rafRef.current = requestAnimationFrame(loop);
                  return;
                }

                // 2. Confirmação dupla: mesmo código em frames consecutivos
                if (pendingRef.current?.code === code) {
                  pendingRef.current.count++;
                } else {
                  pendingRef.current = { code, count: 1 };
                }

                if (pendingRef.current.count >= 2) {
                  pendingRef.current = null;
                  const now = Date.now();
                  // 3. Cooldown de 3s por código para evitar adição repetida acidental
                  if (
                    !lastRef.current ||
                    lastRef.current.code !== code ||
                    now - lastRef.current.time > 3000
                  ) {
                    lastRef.current = { code, time: now };
                    onScanRef.current(code);
                  }
                }
              } else {
                // Nenhum código visível: reseta o candidato pendente
                pendingRef.current = null;
              }
            } catch { /* frame descartado */ }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error('[BarcodeScanner] Câmera falhou:', err);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  // Browser não suporta BarcodeDetector
  if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
    return (
      <div
        className="w-full rounded-2xl bg-slate-100 flex items-center justify-center p-8 text-center"
        style={{ aspectRatio: '4/3' }}
      >
        <div>
          <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Scanner não suportado</p>
          <p className="text-xs text-slate-400 mt-1">Use o Chrome no Android</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

      {/* Viewfinder overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-3/4 h-2/5 border border-orange-400/40 rounded-lg">
          {/* Cantos */}
          <span className="absolute top-0 left-0  w-5 h-5 border-t-[3px] border-l-[3px] border-orange-500 rounded-tl-sm" />
          <span className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-orange-500 rounded-tr-sm" />
          <span className="absolute bottom-0 left-0  w-5 h-5 border-b-[3px] border-l-[3px] border-orange-500 rounded-bl-sm" />
          <span className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-orange-500 rounded-br-sm" />
          {/* Linha de scan animada */}
          <span className="absolute inset-x-0 h-px bg-orange-500/70 top-1/2 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
