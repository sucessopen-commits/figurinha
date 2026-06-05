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
import { 
  Camera, 
  ChevronRight, 
  Loader2, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Image as ImageIcon,
  Play,
  Shirt,
  ShoppingCart,
  Trash2,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type StickerData = {
  childName: string;
  birthDate: string;
  weight: number;
  height: number;
  club: string;
  photoDataUri: string;
};

type QuizData = StickerData & {
  email: string;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [photoLoadingProgress, setPhotoLoadingProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [pendingUploadType, setPendingUploadType] = useState<'gallery' | 'camera' | null>(null);
  const [processingText, setProcessingText] = useState("Iniciando processamento...");
  
  // Cart State
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [extraStickers, setExtraStickers] = useState<StickerData[]>([]);
  const [currentExtraIdx, setCurrentExtraIdx] = useState(0);

  const [formData, setFormData] = useState<QuizData>({
    childName: "",
    birthDate: "",
    email: "",
    weight: 30,
    height: 120,
    club: "",
    photoDataUri: "",
  });

  const [currentExtraData, setCurrentExtraData] = useState<StickerData>({
    childName: "",
    birthDate: "",
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

  useEffect(() => {
    if (step === 7) {
      const phrases = [
        "Ajustando uniforme...",
        "Preparando o estilo da figurinha...",
        "Finalizando os detalhes do craque...",
        "Aplicando efeitos especiais...",
        "Quase pronto para o campo!",
      ];
      let i = 0;
      const interval = setInterval(() => {
        setProcessingText(phrases[i % phrases.length]);
        i++;
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isExtra = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isExtra) {
          setCurrentExtraData({ ...currentExtraData, photoDataUri: reader.result as string });
        } else {
          setFormData({ ...formData, photoDataUri: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenWarning = (type: 'gallery' | 'camera', isExtra = false) => {
    setPendingUploadType(type);
    setShowWarning(true);
  };

  const confirmWarning = () => {
    setShowWarning(false);
    if (pendingUploadType) {
      triggerUpload(pendingUploadType, step === 9);
      setPendingUploadType(null);
    }
  };

  const triggerUpload = (type: 'gallery' | 'camera', isExtra = false) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') {
      input.setAttribute('capture', 'user');
    }
    input.onchange = (e: any) => handleFileChange(e, isExtra);
    input.click();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, isExtra = false) => {
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
    if (isExtra) {
      setCurrentExtraData({ ...currentExtraData, birthDate: formattedValue });
    } else {
      setFormData({ ...formData, birthDate: formattedValue });
    }
  };

  const startGeneration = async () => {
    setLoading(true);
    setStep(7);
    
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        return prev + Math.random() * 5;
      });
    }, 600);

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

  const handleContinueWithQuantity = (qty: number) => {
    setTotalQuantity(qty);
    setShowUpsellModal(false);
    if (qty > 1) {
      setExtraStickers([]);
      setCurrentExtraIdx(0);
      setCurrentExtraData({
        childName: "",
        birthDate: "",
        weight: 30,
        height: 120,
        club: "",
        photoDataUri: "",
      });
      setStep(9);
    }
  };

  const handleNextExtra = () => {
    const updatedExtras = [...extraStickers, currentExtraData];
    setExtraStickers(updatedExtras);
    
    if (updatedExtras.length < totalQuantity - 1) {
      setCurrentExtraIdx(updatedExtras.length);
      setCurrentExtraData({
        childName: "",
        birthDate: "",
        weight: 30,
        height: 120,
        club: "",
        photoDataUri: "",
      });
    } else {
      setStep(10);
    }
  };

  // Pricing
  const basePrice = 12.90;
  const extraPrice = 10.32; // 20% OFF
  const totalPrice = basePrice + (totalQuantity - 1) * extraPrice;
  const totalSavings = (totalQuantity - 1) * 2.58;

  const officialStep = step >= 1 && step <= 4 ? step : 4;
  const progressPercent = (officialStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white">
      <div className="w-full max-w-lg space-y-6">
        
        {step < 5 && (
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
                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => handleOpenWarning('gallery')}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-primary font-bold text-sm uppercase">ESCOLHER ARQUIVO</p>
                        <p className="text-[10px] text-muted-foreground">Galeria do celular ou computador</p>
                      </div>
                    </div>

                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => handleOpenWarning('camera')}
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

            {step === 7 && (
              <div className="space-y-8 animate-in fade-in duration-500 text-center">
                <div className="space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase">GERANDO SUA FIGURINHA</h2>
                  <p className="text-muted-foreground text-xs font-bold">Não saia dessa tela, leva até 2 minutos.</p>
                </div>

                <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto bg-muted rounded-3xl overflow-hidden border-4 border-primary/20 flex flex-col items-center justify-center group">
                  <div className="absolute top-4 left-4 right-4 bg-primary/10 py-2 rounded-xl z-10">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Assista enquanto fica pronto</p>
                  </div>
                  
                  <div className="absolute -right-6 top-1/4 w-24 h-32 rotate-12 opacity-40 grayscale blur-[1px] hidden md:block">
                     <Image src="https://i.postimg.cc/d1PGPQDM/Chat-GPT-Image-5-de-jun-de-2026-03-22-48.png" alt="Exemplo" fill className="object-cover rounded-xl" />
                  </div>

                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <Play className="text-white fill-white w-6 h-6 ml-1" />
                  </div>
                  
                  <div className="px-6 mt-4">
                    <p className="text-primary font-headline text-xl uppercase opacity-40">Espaço Reservado para VSL</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">Apresentação exclusiva</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-headline text-2xl text-primary uppercase leading-none tracking-tight">
                    ALÉM DA FIGURINHA, VOCÊ TAMBÉM CONCORRE A:
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white border-2 border-primary/10 p-5 rounded-[24px] shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Shirt className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-primary font-bold text-sm leading-tight uppercase">
                          🎽 1 Camisa Original Autografada por Jogadores do Brasil
                        </p>
                      </div>
                    </div>

                    <div className="font-headline text-xl text-primary/30 uppercase">OU</div>

                    <div className="bg-accent/10 border-2 border-accent/30 p-5 rounded-[24px] shadow-md shadow-accent/5">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-accent font-black text-xl leading-none uppercase tracking-tighter">
                            💸 R$1.000 NO PIX
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-primary/60 font-bold uppercase tracking-tight">
                    Após garantir sua figurinha, você participa automaticamente do sorteio.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-primary font-bold text-sm italic">{processingText}</p>
                    <div className="flex justify-between items-end text-primary font-black text-[10px] uppercase">
                      <span>Processando...</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <Progress value={loadingProgress} className="h-2 bg-primary/10" />
                  </div>

                  <Button 
                    className="w-full h-20 text-xl font-bold bg-primary rounded-full shadow-2xl shadow-primary/30 pulse-button flex flex-col items-center justify-center leading-none px-4"
                    onClick={() => setStep(8)}
                    disabled={!result}
                  >
                    <span>QUERO PARTICIPAR E RECEBER MINHA FIGURINHA</span>
                    <span className="text-[10px] font-medium opacity-80 mt-2 uppercase tracking-widest">
                      {result ? "Clique para finalizar" : "Preparando sua figurinha..."}
                    </span>
                  </Button>
                </div>

                <div className="text-center opacity-60">
                   <p className="text-[10px] font-bold text-primary flex items-center justify-center gap-1 uppercase">
                     <ShieldCheck className="w-3 h-3" /> Seus dados estão protegidos
                   </p>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center">
                <div className="text-center space-y-1">
                  <div className="flex justify-center mb-2">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <ShoppingCart className="w-3 h-3" /> {totalQuantity} {totalQuantity === 1 ? 'Figurinha' : 'Figurinhas'} no carrinho
                    </span>
                  </div>
                  <span className="text-5xl">⚽</span>
                  <h2 className="font-headline text-5xl text-primary uppercase leading-none mt-2">GOOLL!</h2>
                  <p className="text-muted-foreground font-bold">Sua figurinha está pronta!</p>
                </div>

                <div className="relative w-full max-w-[320px] mx-auto">
                  <div className="relative w-full aspect-[3/4]">
                    <Image 
                      src="https://i.postimg.cc/DZG3Rd0p/Chat-GPT-Image-5-de-jun-de-2026-19-49-36.png" 
                      alt="Figurinha Preview" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex flex-col items-center">
                    {totalQuantity > 1 && (
                      <span className="text-accent font-bold text-xs uppercase mb-1">Total para {totalQuantity} figurinhas</span>
                    )}
                    <div className="flex items-start gap-1">
                      <span className="text-accent font-bold text-xl mt-1">R$</span>
                      <span className="text-accent font-headline text-6xl leading-none">{totalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {totalSavings > 0 && (
                      <p className="text-accent text-xs font-black bg-accent/10 px-4 py-1 rounded-full mt-2 uppercase tracking-widest">
                        VOCÊ ECONOMIZA R$ {totalSavings.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>

                  <Button className="w-full h-20 text-xl font-bold bg-primary rounded-full shadow-2xl shadow-primary/40 pulse-button flex flex-col items-center justify-center leading-none">
                    <span>RECEBER MINHA FIGURINHA</span>
                    <span className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-widest">Acesso imediato via e-mail</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-full border-primary text-primary font-bold" 
                    onClick={() => setShowUpsellModal(true)}
                  >
                    CRIAR OUTRA FIGURINHA
                  </Button>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-1">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">FIGURINHA EXTRA {currentExtraIdx + 2} de {totalQuantity}</span>
                  </div>
                  <h2 className="font-headline text-3xl text-primary uppercase leading-tight">DADOS DO CRAQUE EXTRA</h2>
                  <p className="text-muted-foreground text-sm">Preencha apenas as informações das novas figurinhas.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-primary font-bold">NOME DO CRAQUE</Label>
                    <Input
                      placeholder="Ex: Pedro Silva"
                      className="h-12 border-2 rounded-xl"
                      value={currentExtraData.childName}
                      onChange={(e) => setCurrentExtraData({ ...currentExtraData, childName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">NASCIMENTO</Label>
                      <Input
                        placeholder="DD/MM/AAAA"
                        className="h-12 border-2 rounded-xl"
                        value={currentExtraData.birthDate}
                        onChange={(e) => handleDateChange(e, true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">TIME</Label>
                      <Input
                        placeholder="Ex: Vasco"
                        className="h-12 border-2 rounded-xl"
                        value={currentExtraData.club}
                        onChange={(e) => setCurrentExtraData({ ...currentExtraData, club: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">PESO (KG)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={currentExtraData.weight}
                        onChange={(e) => setCurrentExtraData({ ...currentExtraData, weight: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">ALTURA (CM)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={currentExtraData.height}
                        onChange={(e) => setCurrentExtraData({ ...currentExtraData, height: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-primary font-bold block text-center">FOTO DO CRAQUE</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1" onClick={() => handleOpenWarning('gallery', true)}>
                        <ImageIcon className="w-3 h-3" /> Galeria
                      </Button>
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1" onClick={() => handleOpenWarning('camera', true)}>
                        <Camera className="w-3 h-3" /> Câmera
                      </Button>
                    </div>
                    {currentExtraData.photoDataUri && (
                      <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-primary/20">
                         <Image src={currentExtraData.photoDataUri} alt="Extra Preview" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold bg-primary rounded-full shadow-lg"
                  disabled={!currentExtraData.childName || !currentExtraData.photoDataUri || currentExtraData.birthDate.length < 10}
                  onClick={handleNextExtra}
                >
                  {currentExtraIdx < totalQuantity - 2 ? 'PRÓXIMA FIGURINHA' : 'REVISAR PEDIDO'} <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 10 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase">REVISE SEU PEDIDO</h2>
                  <p className="text-muted-foreground text-sm">Confirme as figurinhas do seu carrinho.</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                       <Image src={formData.photoDataUri} alt="Orig" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-bold text-sm truncate">{formData.childName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Figurinha Principal</p>
                    </div>
                    <span className="text-primary font-bold text-sm">R$ 12,90</span>
                  </div>

                  {extraStickers.map((sticker, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/5 rounded-2xl border border-accent/10">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                         <Image src={sticker.photoDataUri} alt={`Extra ${i}`} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent font-bold text-sm truncate">{sticker.childName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Figurinha Extra {i+2}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent font-bold text-sm">R$ 10,32</p>
                        <p className="text-[8px] text-accent font-bold uppercase">20% OFF</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl space-y-2 border-2 border-primary/10">
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de figurinhas:</span>
                      <span className="text-primary font-bold">{totalQuantity}</span>
                   </div>
                   {totalSavings > 0 && (
                     <div className="flex justify-between text-sm">
                        <span className="text-accent font-bold">Desconto aplicado:</span>
                        <span className="text-accent font-bold">- R$ {totalSavings.toFixed(2).replace('.', ',')}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xl border-t border-primary/10 pt-2 mt-2">
                      <span className="text-primary font-headline uppercase">TOTAL:</span>
                      <span className="text-primary font-headline">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                   </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-lg pulse-button">
                    FINALIZAR PEDIDO <ChevronRight className="ml-2 w-6 h-6" />
                  </Button>
                  <Button variant="ghost" className="w-full h-10 text-primary font-bold text-sm uppercase" onClick={() => setStep(8)}>
                    VOLTAR PARA A FIGURINHA
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-primary font-bold text-[10px] md:text-xs flex items-center justify-center gap-1 opacity-60 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> SEUS DADOS ESTÃO PROTEGIDOS
          </p>
        </div>
      </div>

      {/* Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 border-none bg-white shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogTitle className="font-headline text-3xl text-primary uppercase text-center">AVISO</DialogTitle>
          <DialogDescription className="sr-only">
            Aviso sobre as diretrizes da foto para a figurinha.
          </DialogDescription>
          <div className="space-y-6 text-center">
            <div className="bg-primary px-4 py-6 rounded-[24px] flex flex-col items-center">
              <div className="relative w-full aspect-[4/5] max-w-[240px] rounded-[16px] overflow-hidden shadow-xl border-4 border-white/10">
                <Image 
                  src="https://i.postimg.cc/4NQDR03g/Chat-GPT-Image-5-de-jun-de-2026-18-07-41.png" 
                  alt="Exemplo de foto correta" 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 240px, 240px"
                />
              </div>
            </div>

            <p className="text-primary font-bold text-lg leading-tight px-2">
              A foto precisa ser somente da pessoa, sem outras pessoas no enquadramento.
            </p>

            <Button 
              className="w-full h-14 text-xl font-bold bg-primary hover:bg-primary/90 rounded-full shadow-lg"
              onClick={confirmWarning}
            >
              ENTENDI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upsell Modal */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 border-none bg-white shadow-2xl">
          <DialogTitle className="font-headline text-3xl text-primary uppercase text-center">CRIAR MAIS FIGURINHAS?</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground -mt-2">
            Você já tem 1 figurinha no carrinho. Adicione mais figurinhas e ganhe 20% de desconto em cada uma.
          </DialogDescription>
          
          <div className="space-y-3 py-4">
             {[1, 2, 3, 4].map((qty) => {
               const price = qty === 1 ? 12.90 : 12.90 + (qty - 1) * 10.32;
               const savings = (qty - 1) * 2.58;
               const isSelected = totalQuantity === qty;

               return (
                 <div 
                   key={qty}
                   className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                     isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-primary/10 hover:border-primary/30'
                   }`}
                   onClick={() => handleContinueWithQuantity(qty)}
                 >
                   <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-primary/20'}`}>
                         {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <p className="text-primary font-bold leading-none">{qty} {qty === 1 ? 'Figurinha' : 'Figurinhas'}</p>
                        {qty === 1 ? (
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Já adicionada</p>
                        ) : (
                          <p className="text-[10px] text-accent font-bold mt-1 uppercase">Até {qty-1} extras com 20% OFF</p>
                        )}
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-primary font-headline text-xl leading-none">R$ {price.toFixed(2).replace('.', ',')}</p>
                      {savings > 0 && (
                        <p className="text-[9px] text-accent font-black uppercase mt-1">Economize R$ {savings.toFixed(2).replace('.', ',')}</p>
                      )}
                   </div>
                 </div>
               );
             })}
          </div>

          <div className="space-y-3">
             <Button 
               className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-lg flex flex-col items-center justify-center leading-none"
               onClick={() => handleContinueWithQuantity(totalQuantity)}
             >
                <span>CONTINUAR COM {totalQuantity} {totalQuantity === 1 ? 'FIGURINHA' : 'FIGURINHAS'}</span>
                {totalQuantity > 1 && <span className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-widest">Total: R$ {totalPrice.toFixed(2).replace('.', ',')}</span>}
             </Button>
             <Button variant="ghost" className="w-full text-primary font-bold uppercase" onClick={() => setShowUpsellModal(false)}>
                VOLTAR
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
