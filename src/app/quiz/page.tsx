"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { generateSoccerSticker } from "@/ai/flows/generate-soccer-sticker";
import { Camera, Upload, ChevronRight, ChevronLeft, Loader2, Trophy, DollarSign } from "lucide-react";

type QuizData = {
  childName: string;
  birthDate: string;
  weight: number;
  height: number;
  club: string;
  photoDataUri: string;
};

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuizData>({
    childName: "",
    birthDate: "",
    weight: 30,
    height: 120,
    club: "",
    photoDataUri: "",
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoDataUri: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    setLoading(true);
    setStep(4);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const { stickerMediaUri } = await generateSoccerSticker({
        photoDataUri: formData.photoDataUri,
        childName: formData.childName,
        birthDate: formData.birthDate,
        club: formData.club,
        weight: formData.weight,
        height: formData.height,
      });
      setResult(stickerMediaUri);
      setLoadingProgress(100);
    } catch (error) {
      console.error("Failed to generate sticker", error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress Bar Area */}
        {step < 5 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-primary font-bold text-sm tracking-widest uppercase">
                {step === 4 ? "PROCESSANDO" : `PASSO ${step} de 4`}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i <= step ? "bg-primary" : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Progress value={progressPercent} className="h-3 bg-primary/10" />
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[24px] overflow-hidden bg-white">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">✍️</span>
                  <h2 className="font-headline text-3xl text-primary">QUEM É O CRAQUE?</h2>
                  <p className="text-muted-foreground">Conte-nos o nome e data de nascimento.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-bold">NOME COMPLETO</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Miguel Santos"
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.childName}
                      onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-primary font-bold">DATA DE NASCIMENTO</Label>
                    <Input
                      id="dob"
                      type="date"
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold bg-primary rounded-full pulse-button"
                  disabled={!formData.childName || !formData.birthDate}
                  onClick={nextStep}
                >
                  CONTINUAR <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">⚽</span>
                  <h2 className="font-headline text-3xl text-primary">DADOS FÍSICOS</h2>
                  <p className="text-muted-foreground">Isso aparecerá na figurinha oficial.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-primary font-bold">PESO (KG)</Label>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold">
                        {formData.weight} kg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      className="w-full h-2 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-primary font-bold">ALTURA (CM)</Label>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold">
                        {formData.height} cm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="210"
                      step="1"
                      className="w-full h-2 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 w-1/3 rounded-full border-primary text-primary" onClick={prevStep}>
                    VOLTAR
                  </Button>
                  <Button className="h-14 flex-1 text-lg font-bold bg-primary rounded-full" onClick={nextStep}>
                    PRÓXIMO <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">⭐</span>
                  <h2 className="font-headline text-3xl text-primary">TIME E FOTO</h2>
                  <p className="text-muted-foreground">Escolha o time do coração e uma foto clara.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="club" className="text-primary font-bold">CLUBE FAVORITO</Label>
                    <Input
                      id="club"
                      placeholder="Ex: Flamengo, Palmeiras, Real Madrid..."
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.club}
                      onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-primary font-bold">FOTO DO CRAQUE</Label>
                    <div 
                      className="relative h-48 w-full border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                      onClick={() => document.getElementById("photo-upload")?.click()}
                    >
                      {formData.photoDataUri ? (
                        <div className="relative w-full h-full p-2">
                           <div className="relative w-full h-full rounded-xl overflow-hidden">
                             <Image src={formData.photoDataUri} alt="Preview" fill className="object-cover" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold flex items-center"><Camera className="mr-2" /> TROCAR</span>
                             </div>
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                          <span className="text-primary font-bold">SUBIR FOTO</span>
                          <span className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG</span>
                        </>
                      )}
                      <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                      💡 Dica: Use uma foto de rosto com boa iluminação.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 w-1/3 rounded-full border-primary text-primary" onClick={prevStep}>
                    VOLTAR
                  </Button>
                  <Button 
                    className="h-14 flex-1 text-lg font-bold bg-primary rounded-full shadow-lg" 
                    disabled={!formData.club || !formData.photoDataUri}
                    onClick={startGeneration}
                  >
                    GERAR FIGURINHA <Trophy className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 py-4 animate-in fade-in duration-500 text-center">
                {!result ? (
                  <div className="space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-2xl font-bold text-primary">{Math.round(loadingProgress)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="font-headline text-3xl text-primary">NOSSOS ROBÔS ESTÃO TRABALHANDO!</h2>
                      <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                         <p className="text-accent font-bold flex items-center justify-center">
                           <DollarSign className="mr-1 w-5 h-5" /> VOCÊ ESTÁ CONCORRENDO A UM PRÊMIO DE <span className="ml-1 text-2xl">MIL REAIS</span>
                         </p>
                         <p className="text-xs text-accent/80 mt-1">Após a geração, você receberá seu número da sorte.</p>
                      </div>
                      <p className="text-muted-foreground italic">"Estilizando uniforme... Ajustando cores... Aplicando efeitos de craque..."</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                      <span className="text-4xl">✅</span>
                      <h2 className="font-headline text-3xl text-primary">FIGURINHA GERADA!</h2>
                      <p className="text-muted-foreground">Veja como ficou o seu pequeno craque.</p>
                    </div>

                    <div className="relative aspect-[3/4] max-w-[280px] mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-primary">
                       <Image src={result} alt="Figurinha Preview" fill className="object-cover" />
                       <div className="absolute inset-0 watermark-overlay opacity-60 pointer-events-none" />
                       <div className="absolute inset-0 flex items-center justify-center rotate-[-35deg] pointer-events-none">
                          <span className="text-white/40 font-headline text-4xl border-4 border-white/40 px-4 py-2">PRÉVIA</span>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground line-through text-sm">De R$ 69,90</span>
                        <span className="text-accent font-headline text-5xl">R$ 29,90</span>
                        <p className="text-accent text-xs font-bold mt-1">PREÇO PROMOCIONAL POR TEMPO LIMITADO</p>
                      </div>

                      <Button className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-xl pulse-button">
                        BAIXAR EM ALTA RESOLUÇÃO
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">
                        Ao confirmar, você recebe o arquivo digital sem marca d'água pronto para imprimir e colecionar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="text-center">
          <p className="text-primary font-bold text-xs flex items-center justify-center gap-1 opacity-60">
            <ShieldCheck className="w-4 h-4" /> SEUS DADOS ESTÃO PROTEGIDOS
          </p>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}