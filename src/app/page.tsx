import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight, Trophy, Star, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const examples = PlaceHolderImages.filter(img => 
    ['helena-sticker', 'miguel-sticker', 'arthur-sticker'].includes(img.id)
  );

  const names = ['HELENA', 'MIGUEL', 'ARTHUR'];

  return (
    <main className="min-h-screen pb-12 overflow-x-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 text-center">
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
      </section>

      {/* Examples Grid */}
      <section className="container mx-auto px-4 mt-16">
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
            <span className="text-primary font-bold">PAGAMENTO SEGURO</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold">QUALIDADE PREMIUM</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold">IA DE ÚLTIMA GERAÇÃO</span>
          </div>
        </div>
      </section>
      
      {/* Floating Price Reveal */}
      <div className="fixed bottom-6 inset-x-0 px-4 flex justify-center md:hidden pointer-events-none">
         <div className="bg-white px-6 py-3 rounded-full shadow-2xl border-2 border-primary flex items-center gap-3">
            <span className="text-primary text-sm font-bold">OFERTA ÚNICA:</span>
            <span className="text-accent text-2xl font-headline">R$ 29,90</span>
         </div>
      </div>
    </main>
  );
}