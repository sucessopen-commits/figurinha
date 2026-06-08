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
  ImageIcon,
  Shirt,
  CalendarDays,
  ShoppingCart,
  ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

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

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const BASE_PRICE_PER_UNIT = 12.90;

const getPricingInfo = (qty: number) => {
  const fullPrice = qty * BASE_PRICE_PER_UNIT;
  let total = fullPrice;
  let savings = 0;

  if (qty === 1) {
    total = 12.90;
    savings = 0;
  } else if (qty === 2) {
    total = 20.64;
    savings = fullPrice - total;
  } else if (qty === 3) {
    total = 23.22;
    savings = fullPrice - total;
  } else if (qty === 4) {
    total = 25.53;
    savings = fullPrice - total;
  }

  return {
    total,
    savings,
    fullPrice,
    discountPercent: Math.round((savings / fullPrice) * 100)
  };
};

export default function QuizPage() {
  const firestore = useFirestore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [photoLoadingProgress, setPhotoLoadingProgress] = useState(0);
  const [extraLoadingProgress, setExtraLoadingProgress] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [pendingUploadType, setPendingUploadType] = useState<'gallery' | 'camera' | null>(null);
  const [processingText, setProcessingText] = useState("Iniciando processamento...");
  
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [extraStickers, setExtraStickers] = useState<StickerData[]>([]);
  
  const [isFlying, setIsFlying] = useState(false);
  const [flyImage, setFlyImage] = useState<string | null>(null);
  const [showFlySuccess, setShowFlySuccess] = useState(false);

  // VSL Timer States
  const [vslTimer, setVslTimer] = useState(20);
  const [isVslButtonEnabled, setIsVslButtonEnabled] = useState(false);
  const [showVideoFallback, setShowVideoFallback] = useState(false);

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
    if (step === 11) {
      setExtraLoadingProgress(0);
      const duration = 5000;
      const interval = 50;
      const increment = (interval / duration) * 100;

      const timer = setInterval(() => {
        setExtraLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            completeExtraSticker();
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
      setVslTimer(20);
      setIsVslButtonEnabled(false);
      setShowVideoFallback(false);

      const timerInterval = setInterval(() => {
        setVslTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setIsVslButtonEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const fallbackTimer = setTimeout(() => {
        setShowVideoFallback(true);
      }, 5000);

      const phrases = [
        "Ajustando uniforme...",
        "Preparando o estilo da figurinha...",
        "Finalizando os detalhes do craque...",
        "Aplicando efeitos especiais...",
        "Quase pronto para o campo!",
      ];
      let i = 0;
      const textInterval = setInterval(() => {
        setProcessingText(phrases[i % phrases.length]);
        i++;
      }, 2500);

      return () => {
        clearInterval(timerInterval);
        clearInterval(textInterval);
        clearTimeout(fallbackTimer);
      };
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
          setFormData((prev) => ({ ...prev, photoDataUri: reader.result as string }));
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
      setFormData((prev) => ({ ...prev, birthDate: formattedValue }));
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
      await generateSoccerSticker({
        photoDataUri: formData.photoDataUri,
        childName: formData.childName,
        birthDate: formData.birthDate,
        club: formData.club,
        weight: formData.weight,
        height: formData.height,
      });
      setLoadingProgress(100);
    } catch (error) {
      console.error("Failed to generate sticker", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRedirect = () => {
    const checkoutLinks: Record<number, string> = {
      1: "https://compraonlinesegurada.org.ua/c/6e428a3a58",
      2: "https://compraonlinesegurada.org.ua/c/07bd6c3368",
      3: "https://compraonlinesegurada.org.ua/c/7d5eeddd1d",
      4: "https://compraonlinesegurada.org.ua/c/2e051724fe"
    };

    const quantity = totalQuantity || 1;
    const checkoutUrl = checkoutLinks[quantity] || checkoutLinks[1];

    const checkoutId = `${Date.now()}-${formData.email?.split('@')[0] || 'anonymous'}`;
    
    setDoc(doc(firestore, "checkouts", checkoutId), {
      childName: formData.childName,
      birthDate: formData.birthDate,
      email: formData.email,
      club: formData.club,
      weight: formData.weight,
      height: formData.height,
      extraStickers: extraStickers,
      cartQuantity: totalQuantity,
      checkoutUrl,
      checkoutStatus: "redirected_to_external_checkout",
      redirectedAt: new Date().toISOString()
    });

    window.location.href = checkoutUrl;
  };

  const handleAddExtraSticker = () => {
    if (!currentExtraData.childName || !currentExtraData.photoDataUri || (currentExtraData.birthDate?.length || 0) < 10) return;
    setStep(11);
  };

  const completeExtraSticker = () => {
    setFlyImage(currentExtraData.photoDataUri);
    setIsFlying(true);
    setShowFlySuccess(true);
    
    setTimeout(() => {
      setIsFlying(false);
      setFlyImage(null);
      const updatedExtras = [...extraStickers, currentExtraData];
      setExtraStickers(updatedExtras);
      
      if (updatedExtras.length < totalQuantity - 1) {
        setCurrentExtraData({ childName: "", birthDate: "", weight: 30, height: 120, club: "", photoDataUri: "" });
        setStep(9);
        setTimeout(() => setShowFlySuccess(false), 2000);
      } else {
        setStep(10);
      }
    }, 800);
  };

  const pricing = getPricingInfo(totalQuantity);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white relative overflow-x-hidden max-w-full">
      
      {isFlying && flyImage && (
        <div className="fixed z-[999] pointer-events-none animate-fly-to-cart" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
            {flyImage && <Image src={flyImage} alt="Fly" fill className="object-cover" />}
          </div>
        </div>
      )}

      <div className="w-full max-w-lg space-y-6 z-10 box-border overflow-x-hidden">
        
        {step < 5 && (
          <div className="space-y-4 max-w-full overflow-x-hidden">
            <div className="flex justify-between items-center px-1">
              <span className="text-primary font-bold text-sm tracking-widest uppercase">
                PASSO {step >= 1 && step <= 4 ? step : 4} de 4
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i <= (step >= 1 && step <= 4 ? step : 4) ? "bg-primary" : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Progress value={((step >= 1 && step <= 4 ? step : 4) / 4) * 100} className="h-3 bg-primary/10" />
          </div>
        )}

        {(step >= 8) && (
          <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500 max-w-full">
            <div className={cn(
              "flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-lg border-2 border-primary/20 transition-all min-w-fit w-auto max-w-[calc(100vw-32px)] box-border",
              showFlySuccess && "scale-110 border-accent bg-accent/5"
            )}>
              <div className="relative shrink-0">
                <ShoppingCart className={cn("w-5 h-5 text-primary", showFlySuccess && "text-accent animate-bounce")} />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {step === 9 || step === 11 ? extraStickers.length + 1 : totalQuantity}
                </span>
              </div>
              <span className="text-primary font-headline text-sm uppercase tracking-tight whitespace-nowrap overflow-visible">
                {step === 9 || step === 11 ? `FIGURINHA ${extraStickers.length + 1} de ${totalQuantity}` : `${totalQuantity} FIGURINHAS`}
              </span>
            </div>
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[24px] md:rounded-[32px] overflow-hidden bg-white max-w-full box-border">
          <CardContent className="p-6 md:p-8 box-border">
            
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">✍️</span>
                  <h2 className="font-headline text-3xl text-primary uppercase break-words">QUEM É O CRAQUE?</h2>
                  <p className="text-muted-foreground break-words">Conte-nos o nome que vai aparecer na figurinha.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-bold">NOME COMPLETO</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Miguel Santos"
                      className="h-12 border-2 focus:ring-primary rounded-xl w-full"
                      value={formData.childName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, childName: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-auto py-4 text-lg font-bold bg-primary rounded-full whitespace-normal"
                  disabled={!formData.childName}
                  onClick={() => setStep(2)}
                >
                  PRÓXIMO <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">📅</span>
                  <h2 className="font-headline text-3xl text-primary uppercase break-words">CONTATO E IDADE</h2>
                  <p className="text-muted-foreground break-words">Onde enviaremos a sua figurinha.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-primary font-bold">DATA DE NASCIMENTO</Label>
                    <Input
                      id="dob"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: 20/05/2018"
                      className="h-12 border-2 focus:ring-primary rounded-xl w-full"
                      value={formData.birthDate || ""}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary font-bold">E-MAIL</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-12 border-2 focus:ring-primary rounded-xl w-full"
                      value={formData.email || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    className="h-auto py-4 w-full text-lg font-bold bg-primary rounded-full whitespace-normal shadow-lg" 
                    disabled={(formData.birthDate?.length || 0) < 10 || !formData.email?.includes("@")}
                    onClick={() => setStep(3)}
                  >
                    PRÓXIMO <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => setStep(1)}
                  >
                    VOLTAR
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <span className="text-4xl">⚽</span>
                  <h2 className="font-headline text-3xl text-primary uppercase break-words">DADOS DO CRAQUE</h2>
                  <p className="text-muted-foreground break-words">Time, peso e altura para o card.</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="club" className="text-primary font-bold">TIME DO CORAÇÃO</Label>
                    <Input
                      id="club"
                      placeholder="Ex: Flamengo, Palmeiras, Real Madrid..."
                      className="h-12 border-2 focus:ring-primary rounded-xl w-full"
                      value={formData.club}
                      onChange={(e) => setFormData((prev) => ({ ...prev, club: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">PESO (KG)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl w-full"
                        value={formData.weight}
                        onChange={(e) => setFormData((prev) => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">ALTURA (CM)</Label>
                      <Input
                        type="number"
                        className="h-12 border-2 rounded-xl w-full"
                        value={formData.height}
                        onChange={(e) => setFormData((prev) => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    className="h-auto py-4 w-full text-lg font-bold bg-primary rounded-full whitespace-normal shadow-lg" 
                    disabled={!formData.club} 
                    onClick={() => setStep(4)}
                  >
                    PRÓXIMO <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => setStep(2)}
                  >
                    VOLTAR
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase leading-tight break-words">ENVIE A FOTO DO CRAQUE</h2>
                  <p className="text-muted-foreground text-sm break-words">Agora envie uma foto de rosto para criar a figurinha personalizada.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-4 sm:p-6 transition-all text-center space-y-2 box-border overflow-hidden"
                      onClick={() => handleOpenWarning('gallery')}
                    >
                      <ImageIcon className="w-6 h-6 text-primary mx-auto" />
                      <p className="text-primary font-bold text-[10px] uppercase break-words">GALERIA</p>
                    </div>

                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-4 sm:p-6 transition-all text-center space-y-2 box-border overflow-hidden"
                      onClick={() => handleOpenWarning('camera')}
                    >
                      <Camera className="w-6 h-6 text-primary mx-auto" />
                      <p className="text-primary font-bold text-[10px] uppercase break-words">CÂMERA</p>
                    </div>
                  </div>

                  {formData.photoDataUri && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                        <Image src={formData.photoDataUri} alt="Preview" fill className="object-cover" />
                      </div>
                      <p className="text-accent font-bold text-xs text-center flex items-center justify-center gap-1 break-words">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Foto enviada
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    className="h-auto py-4 w-full text-lg font-bold bg-primary rounded-full shadow-lg whitespace-normal" 
                    disabled={!formData.photoDataUri}
                    onClick={() => setStep(5)}
                  >
                    ANALISAR <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => setStep(3)}
                  >
                    VOLTAR
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 py-4 animate-in fade-in duration-500 text-center">
                <h2 className="font-headline text-3xl text-primary uppercase break-words">CARREGANDO FOTO</h2>
                <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] mx-auto rounded-[24px] overflow-hidden bg-primary/5 border-2 border-primary/10">
                   <Image src="https://media.tenor.com/COM78THbePQAAAAM/neymar.gif" alt="Analyzing" fill className="object-cover" unoptimized />
                </div>
                <p className="text-primary font-bold text-base sm:text-lg italic break-words">“Esse tem cara de jogador caro hein”</p>
                <Progress value={photoLoadingProgress} className="h-2 bg-primary/10" />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase break-words">CONFIRA OS DADOS</h2>
                </div>

                <div className="relative w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] mx-auto rounded-full overflow-hidden border-4 border-primary shadow-xl">
                   <Image src={formData.photoDataUri} alt="Confirm" fill className="object-cover" />
                </div>
                
                <div className="bg-muted/50 p-4 sm:p-5 rounded-2xl space-y-3 text-xs border border-primary/5 overflow-x-hidden">
                   <div className="flex justify-between border-b pb-2 gap-2"><span className="text-muted-foreground font-bold shrink-0">NOME</span><span className="text-primary font-bold break-all text-right">{formData.childName}</span></div>
                   <div className="flex justify-between border-b pb-2 gap-2"><span className="text-muted-foreground font-bold shrink-0">NASCIMENTO</span><span className="text-primary font-bold break-all text-right">{formData.birthDate}</span></div>
                   <div className="flex justify-between border-b pb-2 gap-2"><span className="text-muted-foreground font-bold shrink-0">E-MAIL</span><span className="text-primary font-bold break-all text-right">{formData.email}</span></div>
                   <div className="flex justify-between border-b pb-2 gap-2"><span className="text-muted-foreground font-bold shrink-0">PESO/ALT</span><span className="text-primary font-bold break-all text-right">{formData.weight}kg / {formData.height}cm</span></div>
                   <div className="flex justify-between gap-2"><span className="text-muted-foreground font-bold shrink-0">CLUBE</span><span className="text-primary font-bold break-all text-right">{formData.club}</span></div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full h-auto py-4 text-lg font-bold bg-primary rounded-full shadow-lg whitespace-normal" onClick={startGeneration}>
                    SIM, GERAR FIGURINHA ⚽
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => setStep(4)}
                  >
                    ALTERAR
                  </button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-10 animate-in fade-in duration-500 text-center max-w-full overflow-x-hidden flex flex-col items-center">
                <div className="space-y-2">
                  <h2 className="font-headline text-2xl sm:text-3xl text-primary uppercase leading-tight break-words">GERANDO SUA FIGURINHA</h2>
                  <p className="text-muted-foreground text-[10px] sm:text-xs font-bold break-words uppercase">Não saia dessa tela, leva até 2 minutos.</p>
                </div>

                <div className="relative aspect-[9/16] w-full max-w-[300px] bg-black rounded-[22px] overflow-hidden border-4 border-[#111] shadow-2xl">
                  {/* Vimeo Video Embed */}
                  <iframe 
                    src="https://player.vimeo.com/video/1199308861?badge=0&autopause=0&player_id=0&app_id=58479" 
                    title="Video Player"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write" 
                    allowFullScreen 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Floating Action Button inside Player */}
                  <div className="absolute inset-x-0 bottom-4 px-4 flex justify-center">
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="w-full max-w-[240px] h-11 text-[11px] uppercase font-bold gap-2 shadow-lg bg-white/95 hover:bg-white text-primary rounded-full"
                      onClick={() => window.open('https://vimeo.com/1199308861?share=copy&fl=sv&fe=ci', '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" /> Abrir Vídeo Externo
                    </Button>
                  </div>
                </div>

                <div className="space-y-8 w-full mt-4">
                  <h3 className="font-headline text-2xl sm:text-3xl text-primary uppercase leading-none tracking-tight break-words">
                    ALÉM DA FIGURINHA, VOCÊ TAMBÉM CONCORRE A:
                  </h3>
                  
                  <div className="space-y-3 w-full max-w-[400px] mx-auto">
                    <div className="bg-yellow-100 border-2 border-yellow-400 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-md flex items-center gap-3 sm:gap-4 text-left box-border overflow-hidden">
                        <Shirt className="w-6 h-6 text-primary shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <p className="text-primary font-extrabold text-[12px] sm:text-sm leading-tight uppercase break-words">1 CAMISA ORIGINAL AUTOGRAFADA</p>
                          <p className="text-primary font-extrabold text-[12px] sm:text-sm leading-tight uppercase break-words">POR JOGADORES DO BRASIL</p>
                        </div>
                    </div>
                    <div className="font-headline text-xl text-primary/30 uppercase">OU</div>
                    <div className="bg-accent/10 border-2 border-accent/30 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-md flex items-center gap-3 sm:gap-4 text-left box-border overflow-hidden">
                        <DollarSign className="w-6 h-6 text-accent shrink-0" />
                        <p className="text-accent font-black text-xl sm:text-2xl leading-none uppercase tracking-tighter break-words">💸 R$1.000 NO PIX</p>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1 box-border overflow-hidden max-w-[400px] mx-auto">
                    <div className="flex items-center gap-2 max-w-full">
                      <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-primary font-bold text-[10px] sm:text-xs uppercase break-words leading-tight">O sorteio será realizado no dia 11/06/2026 às 15:00 horas.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 w-full pt-4">
                  <p className="text-primary font-bold text-sm italic break-words">{processingText}</p>
                  <Progress value={loadingProgress} className="h-2 bg-primary/10" />
                  <Button 
                    className="w-full h-auto py-5 text-lg sm:text-xl font-bold bg-primary rounded-full shadow-2xl pulse-button whitespace-normal disabled:opacity-50 disabled:grayscale"
                    onClick={() => setStep(8)}
                    disabled={!isVslButtonEnabled}
                  >
                    {isVslButtonEnabled ? "RECEBER AGORA!" : `LIBERANDO EM ${vslTimer}s...`}
                  </Button>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center max-w-full overflow-x-hidden">
                <div className="text-center space-y-1">
                  <h2 className="font-headline text-4xl sm:text-5xl text-primary uppercase leading-none break-words">GOOLL!</h2>
                  <p className="text-muted-foreground font-bold break-words">Sua figurinha está pronta!</p>
                </div>

                <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto px-4 box-border">
                  <div className="relative aspect-[3/4] w-full overflow-hidden shadow-2xl rounded-2xl border-4 border-white">
                    <Image 
                      src="https://i.postimg.cc/DZG3Rd0p/Chat-GPT-Image-5-de-jun-de-2026-19-49-36.png" 
                      alt="Figurinha Preview" 
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 px-2 box-border">
                  <div className="flex flex-col items-center">
                    <div className="flex items-start gap-1">
                      <span className="text-accent font-bold text-xl mt-1">R$</span>
                      <span className="text-accent font-headline text-5xl sm:text-6xl leading-none">{pricing.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <Button className="w-full h-auto py-5 text-xl font-bold bg-primary rounded-full shadow-2xl pulse-button whitespace-normal" onClick={handleFinalRedirect}>
                    RECEBER AGORA!
                  </Button>
                  
                  <Button variant="outline" className="w-full h-auto py-3 rounded-full border-primary text-primary font-bold whitespace-normal text-sm sm:text-base" onClick={() => setShowUpsellModal(true)}>
                    CRIAR OUTRA FIGURINHA
                  </Button>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-2xl sm:text-3xl text-primary uppercase leading-tight break-words">DADOS DO CRAQUE EXTRA</h2>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase break-words">Figurinha {extraStickers.length + 2} de {totalQuantity}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-primary font-bold">NOME DO CRAQUE</Label>
                    <Input
                      placeholder="Ex: Pedro Silva"
                      className="h-12 border-2 rounded-xl w-full"
                      value={currentExtraData.childName}
                      onChange={(e) => setCurrentExtraData({ ...currentExtraData, childName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">NASCIMENTO</Label>
                      <Input
                        placeholder="DD/MM/AAAA"
                        className="h-12 border-2 rounded-xl w-full"
                        value={currentExtraData.birthDate}
                        onChange={(e) => handleDateChange(e, true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-bold">TIME</Label>
                      <Input
                        placeholder="Ex: Vasco"
                        className="h-12 border-2 rounded-xl w-full"
                        value={currentExtraData.club}
                        onChange={(e) => setCurrentExtraData({ ...currentExtraData, club: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-primary font-bold">PESO (KG)</Label><Input type="number" className="h-12 border-2 rounded-xl w-full" value={currentExtraData.weight} onChange={(e) => setCurrentExtraData({ ...currentExtraData, weight: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label className="text-primary font-bold">ALTURA (CM)</Label><Input type="number" className="h-12 border-2 rounded-xl w-full" value={currentExtraData.height} onChange={(e) => setCurrentExtraData({ ...currentExtraData, height: parseInt(e.target.value) || 0 })} /></div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-primary font-bold block text-center">FOTO DO CRAQUE</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1 whitespace-normal px-2" onClick={() => handleOpenWarning('gallery', true)}><ImageIcon className="w-3 h-3 shrink-0" /> Galeria</Button>
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1 whitespace-normal px-2" onClick={() => handleOpenWarning('camera', true)}><Camera className="w-3 h-3 shrink-0" /> Câmera</Button>
                    </div>
                    {currentExtraData.photoDataUri && (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-xl overflow-hidden border-2 border-primary/20 mt-4 shadow-lg"><Image src={currentExtraData.photoDataUri} alt="Extra Preview" fill className="object-cover" /></div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    className="h-auto py-4 w-full text-lg font-bold bg-primary rounded-full shadow-lg whitespace-normal" 
                    disabled={!currentExtraData.childName || !currentExtraData.photoDataUri || (currentExtraData.birthDate?.length || 0) < 10 || isFlying}
                    onClick={handleAddExtraSticker}
                  >
                    ADICIONAR AO CARRINHO <ChevronRight className="ml-2 w-5 h-5 shrink-0" />
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => {
                      if (extraStickers.length > 0) {
                        setStep(10);
                      } else {
                        setStep(8);
                      }
                    }}
                  >
                    VOLTAR
                  </button>
                </div>
              </div>
            )}

            {step === 11 && (
              <div className="space-y-8 py-4 sm:py-8 animate-in fade-in duration-500 text-center box-border">
                <div className="space-y-2">
                  <h2 className="font-headline text-2xl sm:text-3xl text-primary uppercase break-words">GERANDO FIGURINHA</h2>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase break-words">Estamos preparando essa figurinha para o carrinho.</p>
                </div>
                
                <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] mx-auto rounded-[24px] overflow-hidden border-4 border-primary/20 shadow-2xl bg-primary/5">
                   {currentExtraData.photoDataUri && <Image src={currentExtraData.photoDataUri} alt="Generating Extra" fill className="object-cover" />}
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                     <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin" />
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-primary font-bold text-sm italic break-words px-4">Finalizando os detalhes do craque...</p>
                  <div className="space-y-2 px-4 box-border">
                    <Progress value={extraLoadingProgress} className="h-3 bg-primary/10 w-full" />
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest break-words">Gerando {Math.round(extraLoadingProgress)}%</p>
                  </div>
                </div>
              </div>
            )}

            {step === 10 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-full overflow-x-hidden">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-2xl sm:text-3xl text-primary uppercase break-words">REVISE SEU PEDIDO</h2>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase break-words">Confira os craques escalados</p>
                </div>

                <div className="space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 box-border">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 relative"><Image src={formData.photoDataUri} alt="Orig" fill className="object-cover" /></div>
                    <div className="flex-1 min-w-0"><p className="text-primary font-bold text-xs sm:text-sm truncate">{formData.childName}</p><p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase truncate">Figurinha Principal</p></div>
                  </div>
                  {extraStickers.map((sticker, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/5 rounded-2xl border border-accent/10 overflow-hidden">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 relative"><Image src={sticker.photoDataUri} alt={`Extra ${i}`} fill className="object-cover" /></div>
                      <div className="flex-1 min-w-0"><p className="text-accent font-bold text-xs sm:text-sm truncate">{sticker.childName}</p><p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase truncate">Figurinha Extra {i+2}</p></div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl space-y-2 border-2 border-primary/10 box-border overflow-hidden">
                   <div className="flex justify-between text-[10px] sm:text-xs font-bold text-primary/60 gap-2">
                      <span className="shrink-0">VALOR CHEIO</span>
                      <span className="line-through whitespace-nowrap">R$ {pricing.fullPrice.toFixed(2).replace('.', ',')}</span>
                   </div>
                   {pricing.savings > 0 && (
                     <div className="flex justify-between text-[10px] sm:text-xs font-bold text-accent gap-2">
                        <span className="shrink-0 uppercase">DESCONTO PROGRESSIVO</span>
                        <span className="whitespace-nowrap">- R$ {pricing.savings.toFixed(2).replace('.', ',')}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-lg sm:text-xl pt-2 mt-2 border-t border-primary/10 gap-2 items-end">
                      <span className="text-primary font-headline uppercase">TOTAL:</span>
                      <span className="text-primary font-headline whitespace-nowrap">R$ {pricing.total.toFixed(2).replace('.', ',')}</span>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full h-auto py-5 text-lg sm:text-xl font-bold bg-primary rounded-full shadow-lg pulse-button whitespace-normal" onClick={handleFinalRedirect}>
                    RECEBER AGORA!
                  </Button>
                  <button 
                    className="text-muted-foreground hover:text-primary font-bold text-sm uppercase py-1 transition-colors mx-auto"
                    onClick={() => {
                      if (extraStickers.length > 0) {
                        setStep(9);
                      } else {
                        setStep(8);
                      }
                    }}
                  >
                    VOLTAR
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[420px] max-h-[92vh] rounded-[24px] sm:rounded-[32px] p-0 border-none bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 -webkit-overflow-scrolling-touch">
            <DialogTitle className="font-headline text-2xl sm:text-3xl text-primary uppercase text-center break-words">AVISO</DialogTitle>
            <div className="bg-primary px-4 py-6 rounded-[24px] flex flex-col items-center box-border overflow-hidden">
              <div className="relative w-full aspect-[4/5] max-w-[200px] sm:max-w-[240px] rounded-[16px] overflow-hidden border-4 border-white/10 shadow-lg">
                <Image src="https://i.postimg.cc/4NQDR03g/Chat-GPT-Image-5-de-jun-de-2026-18-07-41.png" alt="Exemplo" fill className="object-cover" />
              </div>
            </div>
            <p className="text-primary font-bold text-base sm:text-lg leading-tight text-center break-words">A foto precisa ser somente da pessoa, sem outras pessoas no enquadramento.</p>
            <Button className="w-full h-auto py-4 text-lg sm:text-xl font-bold bg-primary rounded-full shadow-lg whitespace-normal" onClick={confirmWarning}>ENTENDI</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[420px] max-h-[92vh] rounded-[24px] sm:rounded-[32px] p-0 border-none bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 -webkit-overflow-scrolling-touch box-border">
            <DialogTitle className="font-headline text-2xl sm:text-3xl text-primary uppercase text-center leading-tight break-words">CRIAR MAIS FIGURINHAS?</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-medium text-xs sm:text-sm break-words">Quanto mais figurinhas, maior a economia. Adicione mais craques e desbloqueie descontos progressivos no pacote.</DialogDescription>
            
            <div className="space-y-3 py-2 box-border">
               {[1, 2, 3, 4].map((qty) => {
                 const info = getPricingInfo(qty);
                 const isSelected = totalQuantity === qty;
                 return (
                   <div 
                     key={qty} 
                     className={cn(
                       "p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 box-border overflow-hidden", 
                       isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'
                     )} 
                     onClick={() => setTotalQuantity(qty)}
                   >
                     <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0", isSelected ? 'border-primary bg-primary' : 'border-primary/20')}>
                          {isSelected && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-primary font-bold text-xs sm:text-sm leading-none break-words">{qty} {qty === 1 ? 'Figurinha' : 'Figurinhas'}</p>
                          {qty > 1 && <p className="text-accent text-[8px] sm:text-[10px] font-black uppercase mt-1 break-words">{qty === 4 ? 'MAIOR ECONOMIA' : `PACOTE COM DESCONTO`}</p>}
                        </div>
                     </div>
                     <div className="text-right shrink-0">
                        {qty > 1 && <p className="text-muted-foreground line-through text-[9px] sm:text-[10px] font-bold whitespace-nowrap">R$ {info.fullPrice.toFixed(2).replace('.', ',')}</p>}
                        <p className="text-primary font-headline text-lg sm:text-xl leading-none whitespace-nowrap">R$ {info.total.toFixed(2).replace('.', ',')}</p>
                     </div>
                   </div>
                 );
               })}
            </div>

            <div className="bg-accent/10 p-4 rounded-2xl mb-4 text-center box-border overflow-hidden">
               <div className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 rounded-full mx-auto w-fit border-2 border-primary/10">
                 <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
                 <span className="text-primary font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">🛒 {totalQuantity} {totalQuantity === 1 ? 'FIGURINHA' : 'FIGURINHAS'}</span>
               </div>
               {pricing.savings > 0 && (
                 <p className="text-accent font-headline text-base sm:text-lg uppercase break-words leading-tight mt-1">Economia de R$ {pricing.savings.toFixed(2).replace('.', ',')}</p>
               )}
            </div>

            <Button 
              className="w-full h-auto py-5 text-lg sm:text-xl font-bold bg-primary rounded-full shadow-lg whitespace-normal leading-tight" 
              onClick={() => { 
                setShowUpsellModal(false); 
                if (totalQuantity > 1) { 
                  setExtraStickers([]); 
                  setStep(9); 
                } 
              }}
            >
              CONTINUAR COM {totalQuantity} {totalQuantity === 1 ? 'FIGURINHA' : 'FIGURINHAS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fly-to-cart {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(150px, -400px) scale(0.2); opacity: 0; }
        }
        .animate-fly-to-cart { animation: fly-to-cart 0.8s ease-in-out forwards; }
        
        .quiz-page-container {
          max-width: 100vw;
          overflow-x: hidden;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
