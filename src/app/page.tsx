
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

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
    <div className="relative w-full max-w-[380px] md:max-w-[550px] mx-auto h-[310px] sm:h-[360px] md:h-[550px] flex items-center justify-center perspective-1000 mt-10 md:mt-16 mb-8 md:mb-12 overflow-visible">
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
            scale = 1.05; // Leve aumento na central
            rotate = 0;
            translateX = "0%";
            opacity = 1;
          } else if (position === 1) { // Direita
            zIndex = 10;
            scale = 0.92;
            rotate = 8;
            translateX = "28%";
            opacity = 0.7;
          } else { // Esquerda
            zIndex = 10;
            scale = 0.92;
            rotate = -8;
            translateX = "-28%";
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
              <div className="relative w-[210px] h-[285px] sm:w-[260px] sm:h-[355px] md:w-[340px] md:h-[465px] rounded-[20px] md:rounded-[28px] overflow-hidden shadow-2xl animate-float bg-white">
                <Image
                  src={src}
                  alt={`Figurinha ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 210px, 340px"
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
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden selection:bg-primary selection:text-white">
      <section className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center text-center max-w-full">
        
        <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-8 mb-4 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
            <Trophy className="w-3 h-3 md:w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-[10px] md:text-xs tracking-widest uppercase">
              EDIÇÃO LIMITADA COPA
            </span>
          </div>
          
          <h1 className="font-headline text-[clamp(2.5rem,13vw,6rem)] text-primary leading-[0.85] drop-shadow-sm uppercase">
            TRANSFORME SEU FILHO <br />
            EM UM <span className="text-white drop-shadow-[0_2px_0_rgba(24,58,158,1)]">CRAQUE REAL!</span>
          </h1>
        </div>

        <StickerShowcase />

        <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-10 mt-8 md:mt-12">
          <p className="text-primary/90 text-[18px] md:text-2xl font-medium leading-relaxed md:leading-relaxed px-4">
            Responda algumas perguntas rápidas e crie uma figurinha exclusiva, com o nome, foto e estilo do seu pequeno craque.
          </p>

          <Link href="/quiz" className="block w-full">
            <Button 
              size="lg" 
              className="w-full md:w-auto h-16 md:h-20 px-10 md:px-14 text-xl md:text-2xl font-bold bg-primary hover:bg-primary/90 rounded-full shadow-xl md:shadow-2xl shadow-primary/40 pulse-button"
            >
              CRIAR AGORA
            </Button>
          </Link>
        </div>

      </section>

      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        .perspective-1000 {
          perspective: 1000px;
          overflow: visible !important;
        }
      `}</style>
    </main>
  );
}
