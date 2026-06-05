
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
import { Camera, Upload, ChevronRight, ChevronLeft, Loader2, Trophy, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Image as ImageIcon } from "lucide-react";

type QuizData = {
  childName: string;
  birthDate: string;
  email: string;
  weight: number;
  height: number;
  club: string;
  photoDataUri: string;
};

// 1-4: Official Steps
// 5: Analysis/Loading Photo (5s)
// 6: Final Confirmation (with Summary)
// 7: AI Generating Result
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [photoLoadingProgress, setPhotoLoadingProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuizData>({
    childName: "",
    birthDate: "",
    email: "",
    weight: 30,
    height: 120,
    club: "",
    photoDataUri: "",
  });

  const calculateAge = (dateString: string) => {
    if (!dateString || dateString.length < 10) return 0;
    const parts = dateString.split('/');
    if (parts.length < 3) return 0;
    const [day, month, year] = parts.map(Number);
    const birthDate = new Date(year, month - 1, day);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle auto-transition for Step 5 (Analysis Loading)
  useEffect(() => {
    if (step === 5) {
      setPhotoLoadingProgress(0);
      const duration = 5000;
      const interval = 50;
      const increment = (interval / duration) * 100;

      const timer = setInterval(() => {
        setPhotoLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setStep(6);
            return 100;
          }
          return prev + increment;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [step]);

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

  const triggerUpload = (type: 'gallery' | 'camera') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') {
      input.setAttribute('capture', 'user');
    }
    input.onchange = (e: any) => handleFileChange(e);
    input.click();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    let formattedValue = "";
    if (value.length > 0) {
      formattedValue = value.slice(0, 2);
      if (value.length > 2) {
        formattedValue += "/" + value.slice(2, 4);
        if (value.length > 4) {
          formattedValue += "/" + value.slice(4, 8);
        }
      }
    }
    setFormData({ ...formData, birthDate: formattedValue });
  };

  const startGeneration = async () => {
    setLoading(true);
    setStep(7);
    
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

  const getOfficialStep = () => {
    if (step >= 1 && step <= 4) return step;
    return 4;
  };

  const officialStep = getOfficialStep();
  const progressPercent = (officialStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Progress Bar - Hidden in loading/result states */}
        {step < 5 && step !== 7 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-primary font-bold text-sm tracking-widest uppercase">
                PASSO {officialStep} de 4
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i <= officialStep ? "bg-primary" : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Progress value={progressPercent} className="h-3 bg-primary/10" />
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[24px] md:rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 md:p-8">
            
            {/* STEP 1: NOME */}
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">✍️</span>
                  <h2 className="font-headline text-3xl text-primary uppercase">QUEM É O CRAQUE?</h2>
                  <p className="text-muted-foreground">Conte-nos o nome que vai aparecer na figurinha.</p>
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
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold bg-primary rounded-full"
                  disabled={!formData.childName}
                  onClick={() => setStep(2)}
                >
                  PRÓXIMO <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {/* STEP 2: NASCIMENTO E EMAIL */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">📅</span>
                  <h2 className="font-headline text-3xl text-primary uppercase">CONTATO E IDADE</h2>
                  <p className="text-muted-foreground">Onde enviaremos a sua figurinha.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-primary font-bold">DATA DE NASCIMENTO</Label>
                    <Input
                      id="dob"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: 20/05/2018"
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.birthDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary font-bold">E-MAIL</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 w-1/3 rounded-full border-primary text-primary" onClick={() => setStep(1)}>
                    VOLTAR
                  </Button>
                  <Button 
                    className="h-14 flex-1 text-lg font-bold bg-primary rounded-full" 
                    disabled={formData.birthDate.length < 10 || !formData.email.includes("@")}
                    onClick={() => setStep(3)}
                  >
                    PRÓXIMO <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: CLUBE E DADOS */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">⚽</span>
                  <h2 className="font-headline text-3xl text-primary uppercase">DADOS DO CRAQUE</h2>
                  <p className="text-muted-foreground">Time, peso e altura para o card.</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="club" className="text-primary font-bold">TIME DO CORAÇÃO</Label>
                    <Input
                      id="club"
                      placeholder="Ex: Flamengo, Palmeiras, Real Madrid..."
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      value={formData.club}
                      onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">PESO (KG)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">ALTURA (CM)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 w-1/3 rounded-full border-primary text-primary" onClick={() => setStep(2)}>
                    VOLTAR
                  </Button>
                  <Button className="h-14 flex-1 text-lg font-bold bg-primary rounded-full" disabled={!formData.club} onClick={() => setStep(4)}>
                    PRÓXIMO <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: SOMENTE ENVIO DA FOTO */}
            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase leading-tight">ENVIE A FOTO DO CRAQUE</h2>
                  <p className="text-muted-foreground text-sm">Agora envie uma foto de rosto para criar a figurinha personalizada.</p>
                  <p className="text-primary font-bold text-xs bg-primary/5 py-2 rounded-xl px-4 inline-block mt-2">
                    Use uma foto clara, de frente e com o rosto bem visível.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opção 1: Arquivo */}
                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => triggerUpload('gallery')}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-primary font-bold text-sm uppercase">ESCOLHER ARQUIVO</p>
                        <p className="text-[10px] text-muted-foreground">Galeria do celular ou computador</p>
                      </div>
                    </div>

                    {/* Opção 2: Câmera */}
                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => triggerUpload('camera')}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-primary font-bold text-sm uppercase">TIRAR FOTO</p>
                        <p className="text-[10px] text-muted-foreground">Usar câmera do celular</p>
                      </div>
                    </div>
                  </div>

                  {formData.photoDataUri && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="relative w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                        <Image src={formData.photoDataUri} alt="Preview" fill className="object-cover" />
                      </div>
                      <p className="text-accent font-bold text-xs text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Foto enviada com sucesso
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 w-1/3 rounded-full border-primary text-primary" onClick={() => setStep(3)}>
                    VOLTAR
                  </Button>
                  <Button 
                    className="h-14 flex-1 text-lg font-bold bg-primary rounded-full shadow-lg" 
                    disabled={!formData.photoDataUri}
                    onClick={() => setStep(5)}
                  >
                    ANALISAR FOTO <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: TELA DE CARREGAMENTO / ANÁLISE */}
            {step === 5 && (
              <div className="space-y-8 py-4 animate-in fade-in duration-500 text-center">
                <h2 className="font-headline text-3xl text-primary uppercase">CARREGANDO FOTO</h2>
                
                <div className="relative w-[140px] h-[140px] mx-auto rounded-[24px] overflow-hidden bg-primary/5 border-2 border-primary/10 shadow-inner">
                   {formData.photoDataUri ? (
                     <Image src={formData.photoDataUri} alt="Analyzing" fill className="object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary/20 w-10 h-10" /></div>
                   )}
                </div>

                <p className="text-primary font-bold text-lg italic">“Esse tem cara de jogador caro hein”</p>

                <div className="space-y-2">
                   <div className="flex justify-between items-end text-primary font-bold text-xs uppercase">
                      <span>Carregando...</span>
                      <span>{Math.round(photoLoadingProgress)}%</span>
                   </div>
                   <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${photoLoadingProgress}%` }}
                      />
                   </div>
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRMAÇÃO FINAL COM RESUMO DOS DADOS */}
            {step === 6 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase">CONFIRA A FOTO E OS DADOS</h2>
                  <p className="text-muted-foreground text-sm">Veja se está tudo certo antes de gerar sua figurinha.</p>
                </div>

                <div className="relative w-[130px] h-[130px] mx-auto rounded-full overflow-hidden border-4 border-primary shadow-xl">
                   <Image src={formData.photoDataUri} alt="Confirm" fill className="object-cover" />
                </div>
                
                <p className="text-center text-primary font-bold text-[10px] uppercase tracking-tighter bg-primary/5 py-1 rounded-full px-4 inline-block mx-auto w-fit">
                  VERIFIQUE SE O ROSTO ESTÁ PRÓXIMO E BEM VISÍVEL
                </p>

                <div className="bg-muted/50 p-5 rounded-2xl space-y-3 text-xs border border-primary/5">
                   <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground font-bold">NOME</span>
                      <span className="text-primary font-bold">{formData.childName}</span>
                   </div>
                   <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground font-bold">NASCIMENTO / IDADE</span>
                      <span className="text-primary font-bold">{formData.birthDate} ({calculateAge(formData.birthDate)} anos)</span>
                   </div>
                   <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground font-bold">E-MAIL</span>
                      <span className="text-primary font-bold">{formData.email}</span>
                   </div>
                   <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground font-bold">PESO / ALT</span>
                      <span className="text-primary font-bold">{formData.weight}kg / {formData.height}cm</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground font-bold">CLUBE</span>
                      <span className="text-primary font-bold">{formData.club}</span>
                   </div>
                </div>

                <div className="text-center">
                   <p className="text-primary font-bold">Está tudo certo para continuar?</p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-14 text-lg font-bold bg-primary rounded-full shadow-lg pulse-button" onClick={startGeneration}>
                    SIM, GERAR FIGURINHA ⚽
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-full border-primary text-primary font-bold" onClick={() => setStep(4)}>
                    ALTERAR ALGUMA COISA
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 7: GERANDO FIGURINHA / RESULTADO */}
            {step === 7 && (
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
                      <h2 className="font-headline text-3xl text-primary uppercase leading-none">NOSSOS ROBÔS ESTÃO TRABALHANDO!</h2>
                      <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                         <p className="text-accent font-bold flex items-center justify-center text-sm md:text-base">
                           <DollarSign className="mr-1 w-5 h-5" /> VOCÊ ESTÁ CONCORRENDO A UM PRÊMIO DE <span className="ml-1 text-2xl">MIL REAIS</span>
                         </p>
                         <p className="text-xs text-accent/80 mt-1">Após a geração, você receberá seu número da sorte.</p>
                      </div>
                      <p className="text-muted-foreground italic text-sm">"Estilizando uniforme... Ajustando cores... Aplicando efeitos de craque..."</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                      <span className="text-4xl">✅</span>
                      <h2 className="font-headline text-3xl text-primary uppercase">FIGURINHA GERADA!</h2>
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
          <p className="text-primary font-bold text-[10px] md:text-xs flex items-center justify-center gap-1 opacity-60 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> SEUS DADOS ESTÃO PROTEGIDOS
          </p>
        </div>
      </div>
    </div>
  );
}
