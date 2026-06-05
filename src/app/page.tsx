
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronRight, Trophy } from 'lucide-react';

const STICKER_IMAGES = [
  'https://i.postimg.cc/d1PGPQDM/Chat-GPT-Image-5-de-jun-de-2026-03-22-48.png', // Central
  'https://i.postimg.cc/RF5w5Chj/Chat-GPT-Image-5-de-jun-de-2026-03-22-52.png', // Left
  'https://i.postimg.cc/qRV2VBqP/Chat-GPT-Image-5-de-jun-de-2026-03-22-55.png', // Right
];

function StickerShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[320px] md:max-w-[450px] mx-auto h-[350px] md:h-[500px] flex items-center justify-center perspective-1000 mt-8 mb-8">
      <div className="relative w-full h-full flex items-center justify-center">
        {STICKER_IMAGES.map((src, index) => {
          let position = (index - activeIndex + 3) % 3;
          
          let zIndex = 0;
          let scale = 0.85;
          let rotate = 0;
          let translateX = "0%";
          let opacity = 0.6;

          if (position === 0) { // Centro
            zIndex = 30;
            scale = 1;
            rotate = 0;
            translateX = "0%";
            opacity = 1;
          } else if (position === 1) { // Direita
            zIndex = 10;
            scale = 0.88;
            rotate = 8;
            translateX = "35%";
            opacity = 0.7;
          } else { // Esquerda
            zIndex = 10;
            scale = 0.88;
            rotate = -8;
            translateX = "-35%";
            opacity = 0.7;
          }

          return (
            <div
              key={src}
              className="absolute transition-all duration-[2000ms] ease-in-out will-change-transform"
              style={{
                zIndex,
                transform: `translateX(${translateX}) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
              }}
            >
              <div className="relative w-[220px] h-[300px] md:w-[320px] md:h-[440px] rounded-[24px] overflow-hidden shadow-2xl animate-float bg-white">
                <Image
                  src={src}
                  alt={`Figurinha ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 220px, 320px"
                  priority
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen pb-12 overflow-x-hidden bg-background">
      <section className="container mx-auto px-4 pt-12 md:pt-20 flex flex-col items-center text-center">
        
        {/* 1. HEADLINE ACIMA DAS FIGURINHAS */}
        <div className="max-w-4xl mx-auto space-y-4 mb-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-full mb-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-xs tracking-widest uppercase">EDIÇÃO LIMITADA COPA</span>
          </div>
          
          <h1 className="font-headline text-5xl md:text-8xl text-primary leading-[0.9] drop-shadow-sm uppercase">
            TRANSFORME SEU FILHO <br />
            EM UM <span className="text-white drop-shadow-[0_2px_0_rgba(24,58,158,1)]">CRAQUE REAL!</span>
          </h1>
        </div>

        {/* 2. BLOCO DAS FIGURINHAS CENTRALIZADO */}
        <StickerShowcase />

        {/* 3. CTA ABAIXO DAS FIGURINHAS */}
        <div className="max-w-2xl mx-auto space-y-8 mt-4">
          <p className="text-primary/90 text-lg md:text-2xl font-medium leading-relaxed">
            Crie uma figurinha profissional e colecionável em segundos usando Inteligência Artificial.
          </p>

          <Link href="/quiz">
            <Button size="lg" className="h-20 px-12 text-2xl font-bold bg-primary hover:bg-primary/90 rounded-full shadow-2xl shadow-primary/40 pulse-button group">
              CRIAR MINHA FIGURINHA
              <ChevronRight className="ml-3 w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </section>

      {/* Estilos específicos para remover elementos e manter o visual limpo */}
      <style jsx global>{`
        /* Garantir que o container das figurinhas não corte o conteúdo */
        .perspective-1000 {
          perspective: 1000px;
          overflow: visible !important;
        }
      `}</style>
    </main>
  );
}
