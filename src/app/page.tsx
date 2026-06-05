
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight, Trophy, Star, ShieldCheck } from 'lucide-react';

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
    }, 6000); // Transição lenta a cada 6 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] md:h-[550px] flex items-center justify-center perspective-1000">
      <div className="relative w-full h-full flex items-center justify-center">
        {STICKER_IMAGES.map((src, index) => {
          // Lógica de posicionamento: 0 é centro, 1 é direita, 2 é esquerda
          let position = (index - activeIndex + 3) % 3;
          
          let styles = "";
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
              <div className="relative w-[220px] h-[300px] md:w-[320px] md:h-[440px] rounded-[24px] overflow-hidden shadow-2xl animate-float">
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
  const examples = PlaceHolderImages.filter(img => 
    ['helena-sticker', 'miguel-sticker', 'arthur-sticker'].includes(img.id)
  );

  const names = ['HELENA', 'MIGUEL', 'ARTHUR'];

  return (
    <main className="min-h-screen pb-12 overflow-x-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-8 md:pt-12 flex flex-col items-center">
        {/* Banner/Showcase de Figurinhas no Topo */}
        <div className="w-full mb-8 md:mb-12">
          <StickerShowcase />
        </div>

        {/* Conteúdo de Texto abaixo das figurinhas */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-primary font-bold text-sm tracking-wide">EDICÃO LIMITADA COPA</span>
          </div>
          
          <h1 className="font-headline text-5xl md:text-7xl text-primary leading-tight mb-4 drop-shadow-sm">
            TRANSFORME SEU FILHO <br />
            EM UM <span className="text-white drop-shadow-[0_2px_2px_rgba(24,58,158,1)]">CRAQUE REAL!</span>
          </h1>
          
          <p className="text-primary/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
            Crie uma figurinha profissional e colecionável em segundos usando Inteligência Artificial.
          </p>

          <Link href="/quiz">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary hover:bg-primary/90 rounded-full shadow-xl shadow-primary/30 pulse-button group">
              CRIAR MINHA FIGURINHA
              <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Examples Grid */}
      <section className="container mx-auto px-4 mt-24">
        <h2 className="text-center font-headline text-3xl text-primary mb-12">MILHARES DE PAIS JÁ CRIARAM</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {examples.map((example, idx) => (
            <Card key={example.id} className="overflow-hidden border-none shadow-2xl rounded-[24px] bg-white group hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-0 relative aspect-[4/5]">
                <Image
                  src={example.imageUrl}
                  alt={example.description}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  data-ai-hint={example.imageHint}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-6 text-center">
                  <h3 className="font-headline text-3xl text-white">{names[idx]}</h3>
                  <div className="flex justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4 mt-20 text-center">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold uppercase text-xs tracking-tighter">PAGAMENTO SEGURO</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold uppercase text-xs tracking-tighter">QUALIDADE PREMIUM</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold uppercase text-xs tracking-tighter">IA DE ÚLTIMA GERAÇÃO</span>
          </div>
        </div>
      </section>
      
      {/* Floating Price Reveal */}
      <div className="fixed bottom-6 inset-x-0 px-4 flex justify-center md:hidden pointer-events-none z-50">
         <div className="bg-white px-6 py-3 rounded-full shadow-2xl border-2 border-primary flex items-center gap-3 pointer-events-auto">
            <span className="text-primary text-sm font-bold">OFERTA:</span>
            <span className="text-accent text-2xl font-headline">R$ 29,90</span>
         </div>
      </div>
    </main>
  );
}
