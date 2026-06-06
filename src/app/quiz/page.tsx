
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
  Plus,
  CalendarDays,
  X,
  Trophy
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
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

type OrderBump = {
  id: string;
  title: string;
  description: string;
  price: number;
  selected: boolean;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const BASE_PRICE_PER_UNIT = 12.90;

const getPricingInfo = (qty: number) => {
  const fullPrice = qty * BASE_PRICE_PER_UNIT;
  let total = fullPrice;
  let savings = 0;

  if (qty === 1) {
    total = 12.90;
    savings = 0;
  } else if (qty === 2) {
    total = 20.64; // 20% OFF do total
    savings = fullPrice - total;
  } else if (qty === 3) {
    total = 23.22; // 40% OFF do total
    savings = fullPrice - total;
  } else if (qty === 4) {
    total = 25.53; // ~50.5% OFF
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
  const router = useRouter();
  const firestore = useFirestore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [photoLoadingProgress, setPhotoLoadingProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingUploadType, setPendingUploadType] = useState<'gallery' | 'camera' | null>(null);
  const [processingText, setProcessingText] = useState("Iniciando processamento...");
  
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [extraStickers, setExtraStickers] = useState<StickerData[]>([]);
  
  const [isFlying, setIsFlying] = useState(false);
  const [flyImage, setFlyImage] = useState<string | null>(null);
  const [showFlySuccess, setShowFlySuccess] = useState(false);

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

  // Checkout State
  const [checkoutData, setCheckoutData] = useState({
    name: "",
    whatsapp: "",
    email: formData.email
  });

  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([
    { id: "ob1", title: "Order bump 1", description: "Descrição do adicional será configurada depois.", price: 0, selected: false },
    { id: "ob2", title: "Order bump 2", description: "Descrição do adicional será configurada depois.", price: 0, selected: false },
    { id: "ob3", title: "Order bump 3", description: "Descrição do adicional será configurada depois.", price: 0, selected: false },
    { id: "ob4", title: "Order bump 4", description: "Descrição do adicional será configurada depois.", price: 0, selected: false },
    { id: "ob5", title: "Order bump 5", description: "Descrição do adicional será configurada depois.", price: 0, selected: false },
  ]);

  useEffect(() => {
    setCheckoutData(prev => ({ ...prev, email: formData.email }));
  }, [formData.email]);

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

  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
    return numbers.slice(0, 11);
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

  const handleOpenCheckout = () => {
    setShowCheckoutModal(true);
    const pricing = getPricingInfo(totalQuantity);
    const checkoutId = `${Date.now()}-${formData.email.split('@')[0]}`;
    
    setDoc(doc(firestore, "checkouts", checkoutId), {
      checkoutEmail: formData.email,
      cartQuantity: totalQuantity,
      cartTotal: pricing.total,
      checkoutStartedAt: new Date().toISOString(),
      checkoutStatus: "started"
    });
  };

  const handleFinishCheckout = () => {
    if (!checkoutData.name || checkoutData.whatsapp.length < 14 || !checkoutData.email.includes("@")) {
      return;
    }
    
    const pricing = getPricingInfo(totalQuantity);
    const checkoutId = `${Date.now()}-${checkoutData.email.split('@')[0]}`;
    
    setDoc(doc(firestore, "checkouts", checkoutId), {
      checkoutName: checkoutData.name,
      checkoutWhatsapp: checkoutData.whatsapp,
      checkoutEmail: checkoutData.email,
      cartQuantity: totalQuantity,
      selectedOrderBumps: orderBumps.filter(b => b.selected).map(b => b.id),
      cartTotal: pricing.total + orderBumps.reduce((acc, b) => acc + (b.selected ? b.price : 0), 0),
      checkoutStatus: "ready_for_payment"
    }, { merge: true });

    alert("Redirecionando para pagamento via PIX...");
  };

  const pricing = getPricingInfo(totalQuantity);
  const totalWithOrderBumps = pricing.total + orderBumps.reduce((acc, b) => acc + (b.selected ? b.price : 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white relative overflow-hidden">
      
      {isFlying && flyImage && (
        <div className="fixed z-[999] pointer-events-none animate-fly-to-cart" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
            <Image src={flyImage} alt="Fly" fill className="object-cover" />
          </div>
        </div>
      )}

      <div className="w-full max-w-lg space-y-6 z-10">
        
        {step < 5 && (
          <div className="space-y-4">
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
          <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={cn(
              "flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border-2 border-primary/20 transition-all",
              showFlySuccess && "scale-110 border-accent bg-accent/5"
            )}>
              <div className="relative">
                <ShoppingCart className={cn("w-5 h-5 text-primary", showFlySuccess && "text-accent animate-bounce")} />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {step === 9 ? extraStickers.length + 1 : totalQuantity}
                </span>
              </div>
              <span className="text-primary font-headline text-sm uppercase tracking-tight">
                {step === 9 ? `FIGURINHA ${extraStickers.length + 1} de ${totalQuantity}` : `${totalQuantity} FIGURINHAS`}
              </span>
            </div>
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
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => handleOpenWarning('gallery')}
                    >
                      <ImageIcon className="w-6 h-6 text-primary mx-auto" />
                      <p className="text-primary font-bold text-[10px] uppercase">GALERIA</p>
                    </div>

                    <div 
                      className="group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 transition-all text-center space-y-2"
                      onClick={() => handleOpenWarning('camera')}
                    >
                      <Camera className="w-6 h-6 text-primary mx-auto" />
                      <p className="text-primary font-bold text-[10px] uppercase">CÂMERA</p>
                    </div>
                  </div>

                  {formData.photoDataUri && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="relative w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                        <Image src={formData.photoDataUri} alt="Preview" fill className="object-cover" />
                      </div>
                      <p className="text-accent font-bold text-xs text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Foto enviada
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
                    ANALISAR <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 py-4 animate-in fade-in duration-500 text-center">
                <h2 className="font-headline text-3xl text-primary uppercase">CARREGANDO FOTO</h2>
                <div className="relative w-[140px] h-[140px] mx-auto rounded-[24px] overflow-hidden bg-primary/5 border-2 border-primary/10">
                   {formData.photoDataUri && <Image src={formData.photoDataUri} alt="Analyzing" fill className="object-cover" />}
                </div>
                <p className="text-primary font-bold text-lg italic">“Esse tem cara de jogador caro hein”</p>
                <Progress value={photoLoadingProgress} className="h-2 bg-primary/10" />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase">CONFIRA OS DADOS</h2>
                </div>

                <div className="relative w-[130px] h-[130px] mx-auto rounded-full overflow-hidden border-4 border-primary shadow-xl">
                   <Image src={formData.photoDataUri} alt="Confirm" fill className="object-cover" />
                </div>
                
                <div className="bg-muted/50 p-5 rounded-2xl space-y-3 text-xs border border-primary/5">
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-bold">NOME</span><span className="text-primary font-bold">{formData.childName}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-bold">NASCIMENTO</span><span className="text-primary font-bold">{formData.birthDate}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-bold">E-MAIL</span><span className="text-primary font-bold">{formData.email}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-bold">PESO/ALT</span><span className="text-primary font-bold">{formData.weight}kg / {formData.height}cm</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground font-bold">CLUBE</span><span className="text-primary font-bold">{formData.club}</span></div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-14 text-lg font-bold bg-primary rounded-full shadow-lg pulse-button" onClick={startGeneration}>
                    SIM, GERAR FIGURINHA ⚽
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-full border-primary text-primary font-bold" onClick={() => setStep(4)}>
                    ALTERAR
                  </Button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-8 animate-in fade-in duration-500 text-center">
                <div className="space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase leading-tight">GERANDO SUA FIGURINHA</h2>
                  <p className="text-muted-foreground text-xs font-bold">Não saia dessa tela, leva até 2 minutos.</p>
                </div>

                <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto bg-muted rounded-3xl overflow-hidden border-4 border-primary/20 flex flex-col items-center justify-center">
                  <div className="absolute top-4 left-4 right-4 bg-primary/10 py-2 rounded-xl z-10">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">ASSISTA ENQUANTO FICA PRONTO</p>
                  </div>
                  <Play className="text-white fill-white w-12 h-12" />
                  <p className="text-primary font-headline text-xl uppercase opacity-40 mt-4">ESPAÇO RESERVADO PARA VSL</p>
                </div>

                <div className="space-y-6">
                  <h3 className="font-headline text-3xl text-primary uppercase leading-none tracking-tight">
                    ALÉM DA FIGURINHA, VOCÊ TAMBÉM CONCORRE A:
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-yellow-100/50 border-2 border-yellow-400/30 p-5 rounded-[24px] shadow-md flex items-center gap-4 text-left">
                        <Shirt className="w-6 h-6 text-primary shrink-0" />
                        <div className="flex flex-col">
                          <p className="text-primary font-extrabold text-sm leading-tight uppercase">1 CAMISA ORIGINAL AUTOGRAFADA</p>
                          <p className="text-primary font-extrabold text-sm leading-tight uppercase">POR JOGADORES DO BRASIL</p>
                        </div>
                    </div>
                    <div className="font-headline text-xl text-primary/30 uppercase">OU</div>
                    <div className="bg-accent/10 border-2 border-accent/30 p-5 rounded-[24px] shadow-md flex items-center gap-4 text-left">
                        <DollarSign className="w-6 h-6 text-accent shrink-0" />
                        <p className="text-accent font-black text-2xl leading-none uppercase tracking-tighter">💸 R$1.000 NO PIX</p>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <p className="text-primary font-bold text-xs uppercase">O sorteio será realizado no dia 11/06/2026 às 15:00 horas.</p>
                    </div>
                    <p className="text-primary/60 text-[9px] uppercase font-bold">Seu número da sorte será enviado após a confirmação.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-primary font-bold text-sm italic">{processingText}</p>
                  <Progress value={loadingProgress} className="h-2 bg-primary/10" />
                  <Button 
                    className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-2xl pulse-button"
                    onClick={() => setStep(8)}
                  >
                    RECEBER FIGURINHA
                  </Button>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center">
                <div className="text-center space-y-1">
                  <h2 className="font-headline text-5xl text-primary uppercase leading-none">GOOLL!</h2>
                  <p className="text-muted-foreground font-bold">Sua figurinha está pronta!</p>
                </div>

                <div className="relative w-full max-w-[320px] mx-auto">
                  <div className="relative aspect-[3/4] w-full overflow-hidden shadow-2xl">
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
                    <div className="flex items-start gap-1">
                      <span className="text-accent font-bold text-xl mt-1">R$</span>
                      <span className="text-accent font-headline text-6xl leading-none">{pricing.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <Button className="w-full h-20 text-xl font-bold bg-primary rounded-full shadow-2xl pulse-button" onClick={handleOpenCheckout}>
                    RECEBER MINHA FIGURINHA
                  </Button>
                  
                  <Button variant="outline" className="w-full h-12 rounded-full border-primary text-primary font-bold" onClick={() => setShowUpsellModal(true)}>
                    CRIAR OUTRA FIGURINHA
                  </Button>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase leading-tight">DADOS DO CRAQUE EXTRA</h2>
                  <p className="text-muted-foreground text-xs font-bold uppercase">Figurinha {extraStickers.length + 2} de {totalQuantity}</p>
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
                    <div className="space-y-2"><Label className="text-primary font-bold">PESO (KG)</Label><Input type="number" className="h-12 border-2 rounded-xl" value={currentExtraData.weight} onChange={(e) => setCurrentExtraData({ ...currentExtraData, weight: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label className="text-primary font-bold">ALTURA (CM)</Label><Input type="number" className="h-12 border-2 rounded-xl" value={currentExtraData.height} onChange={(e) => setCurrentExtraData({ ...currentExtraData, height: parseInt(e.target.value) || 0 })} /></div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-primary font-bold block text-center">FOTO DO CRAQUE</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1" onClick={() => handleOpenWarning('gallery', true)}><ImageIcon className="w-3 h-3" /> Galeria</Button>
                      <Button variant="outline" className="h-12 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase gap-1" onClick={() => handleOpenWarning('camera', true)}><Camera className="w-3 h-3" /> Câmera</Button>
                    </div>
                    {currentExtraData.photoDataUri && (
                      <div className="relative w-24 h-24 mx-auto rounded-xl overflow-hidden border-2 border-primary/20 mt-4 shadow-lg"><Image src={currentExtraData.photoDataUri} alt="Extra Preview" fill className="object-cover" /></div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full h-16 text-lg font-bold bg-primary rounded-full shadow-lg"
                  disabled={!currentExtraData.childName || !currentExtraData.photoDataUri || currentExtraData.birthDate.length < 10 || isFlying}
                  onClick={() => {
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
                        setTimeout(() => setShowFlySuccess(false), 2000);
                      } else {
                        setStep(10);
                      }
                    }, 800);
                  }}
                >
                  <Plus className="mr-2 w-5 h-5" /> ADICIONAR AO CARRINHO
                </Button>
              </div>
            )}

            {step === 10 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="font-headline text-3xl text-primary uppercase">REVISE SEU PEDIDO</h2>
                  <p className="text-muted-foreground text-xs font-bold uppercase">Confira os craques escalados</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative"><Image src={formData.photoDataUri} alt="Orig" fill className="object-cover" /></div>
                    <div className="flex-1 min-w-0"><p className="text-primary font-bold text-sm truncate">{formData.childName}</p><p className="text-[10px] text-muted-foreground uppercase">Figurinha Principal</p></div>
                  </div>
                  {extraStickers.map((sticker, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/5 rounded-2xl border border-accent/10">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative"><Image src={sticker.photoDataUri} alt={`Extra ${i}`} fill className="object-cover" /></div>
                      <div className="flex-1 min-w-0"><p className="text-accent font-bold text-sm truncate">{sticker.childName}</p><p className="text-[10px] text-muted-foreground uppercase">Figurinha Extra {i+2}</p></div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl space-y-2 border-2 border-primary/10">
                   <div className="flex justify-between text-xs font-bold text-primary/60">
                      <span>VALOR TOTAL (VALOR CHEIO)</span>
                      <span className="line-through">R$ {pricing.fullPrice.toFixed(2).replace('.', ',')}</span>
                   </div>
                   {pricing.savings > 0 && (
                     <div className="flex justify-between text-xs font-bold text-accent">
                        <span>DESCONTO PROGRESSIVO ({pricing.discountPercent}% OFF)</span>
                        <span>- R$ {pricing.savings.toFixed(2).replace('.', ',')}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xl pt-2 mt-2 border-t border-primary/10">
                      <span className="text-primary font-headline uppercase">TOTAL:</span>
                      <span className="text-primary font-headline">R$ {pricing.total.toFixed(2).replace('.', ',')}</span>
                   </div>
                </div>

                <Button className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-lg pulse-button" onClick={handleOpenCheckout}>
                  FINALIZAR PEDIDO <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 border-none bg-white shadow-2xl">
          <DialogTitle className="font-headline text-3xl text-primary uppercase text-center">AVISO</DialogTitle>
          <div className="space-y-6 text-center">
            <div className="bg-primary px-4 py-6 rounded-[24px] flex flex-col items-center">
              <div className="relative w-full aspect-[4/5] max-w-[240px] rounded-[16px] overflow-hidden border-4 border-white/10">
                <Image src="https://i.postimg.cc/4NQDR03g/Chat-GPT-Image-5-de-jun-de-2026-18-07-41.png" alt="Exemplo" fill className="object-cover" />
              </div>
            </div>
            <p className="text-primary font-bold text-lg leading-tight">A foto precisa ser somente da pessoa, sem outras pessoas no enquadramento.</p>
            <Button className="w-full h-14 text-xl font-bold bg-primary rounded-full shadow-lg" onClick={confirmWarning}>ENTENDI</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upsell Modal */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 border-none bg-white shadow-2xl">
          <DialogTitle className="font-headline text-3xl text-primary uppercase text-center leading-tight">CRIAR MAIS FIGURINHAS?</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium">Quanto mais figurinhas, maior a economia. Adicione mais craques e desbloqueie descontos progressivos no pacote.</DialogDescription>
          
          <div className="space-y-3 py-4">
             {[1, 2, 3, 4].map((qty) => {
               const info = getPricingInfo(qty);
               const isSelected = totalQuantity === qty;
               return (
                 <div 
                   key={qty} 
                   className={cn(
                     "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between", 
                     isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'
                   )} 
                   onClick={() => setTotalQuantity(qty)}
                 >
                   <div className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", isSelected ? 'border-primary bg-primary' : 'border-primary/20')}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <p className="text-primary font-bold leading-none">{qty} {qty === 1 ? 'Figurinha' : 'Figurinhas'}</p>
                        {qty > 1 && <p className="text-accent text-[10px] font-black uppercase mt-1">{qty === 4 ? 'MAIOR ECONOMIA' : `PACOTE COM DESCONTO`}</p>}
                        {qty === 1 && <p className="text-muted-foreground text-[10px] font-bold uppercase mt-1">Pedido atual</p>}
                      </div>
                   </div>
                   <div className="text-right">
                      {qty > 1 && <p className="text-muted-foreground line-through text-[10px] font-bold">R$ {info.fullPrice.toFixed(2).replace('.', ',')}</p>}
                      <p className="text-primary font-headline text-xl leading-none">R$ {info.total.toFixed(2).replace('.', ',')}</p>
                   </div>
                 </div>
               );
             })}
          </div>

          <div className="bg-accent/10 p-4 rounded-2xl mb-4 text-center">
             <p className="text-accent font-bold text-sm">
                🛒 {totalQuantity} {totalQuantity === 1 ? 'figurinha' : 'figurinhas'} no carrinho
             </p>
             {pricing.savings > 0 && (
               <p className="text-accent font-headline text-lg uppercase">Economia de R$ {pricing.savings.toFixed(2).replace('.', ',')}</p>
             )}
          </div>

          <Button 
            className="w-full h-16 text-xl font-bold bg-primary rounded-full shadow-lg" 
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
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="max-w-[95%] sm:max-w-[540px] rounded-[32px] p-0 border-none bg-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
          {/* Header Fixo */}
          <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0">
            <div>
              <DialogTitle className="font-headline text-3xl uppercase leading-none">FINALIZAR PEDIDO</DialogTitle>
              <p className="text-white/80 text-xs mt-1">Preencha seus dados para receber sua figurinha.</p>
            </div>
            <DialogClose className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></DialogClose>
          </div>
          
          {/* Corpo Rolável */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            
            {/* PRÉVIA VISUAL DO PRODUTO */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-primary font-bold text-[10px] uppercase tracking-widest opacity-60">Sua Figurinha</p>
              <div className="relative w-[160px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-4 border-primary/10">
                <Image 
                  src={result || formData.photoDataUri || "https://i.postimg.cc/DZG3Rd0p/Chat-GPT-Image-5-de-jun-de-2026-19-49-36.png"} 
                  alt="Sua Figurinha" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full w-fit">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="text-primary font-bold text-xs uppercase tracking-widest">{totalQuantity} {totalQuantity === 1 ? 'FIGURINHA' : 'FIGURINHAS'} NO CARRINHO</span>
              </div>
            </div>

            {/* Formulário do Comprador */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-primary font-bold">NOME COMPLETO</Label>
                <input 
                  placeholder="Digite seu nome completo" 
                  className="w-full h-12 border-2 rounded-xl px-4 focus:outline-none focus:border-primary transition-colors"
                  value={checkoutData.name}
                  onChange={(e) => setCheckoutData({ ...checkoutData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-bold">NÚMERO DE WHATSAPP</Label>
                <input 
                  placeholder="(00) 00000-0000" 
                  className="w-full h-12 border-2 rounded-xl px-4 focus:outline-none focus:border-primary transition-colors"
                  value={checkoutData.whatsapp}
                  onChange={(e) => setCheckoutData({ ...checkoutData, whatsapp: formatWhatsapp(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-bold">E-MAIL</Label>
                <input 
                  type="email"
                  placeholder="exemplo@email.com" 
                  className="w-full h-12 border-2 rounded-xl px-4 focus:outline-none focus:border-primary transition-colors"
                  value={checkoutData.email}
                  onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Order Bumps */}
            <div className="space-y-4">
              <h3 className="font-headline text-xl text-primary uppercase">COMPLETE SEU PEDIDO</h3>
              <div className="space-y-3">
                {orderBumps.map((bump) => (
                  <div 
                    key={bump.id} 
                    className={cn(
                      "p-4 border-2 rounded-2xl flex items-center gap-4 transition-all cursor-pointer",
                      bump.selected ? "border-primary bg-primary/5" : "border-primary/10 hover:border-primary/20"
                    )}
                    onClick={() => setOrderBumps(orderBumps.map(b => b.id === bump.id ? { ...b, selected: !b.selected } : b))}
                  >
                    <Checkbox checked={bump.selected} onCheckedChange={() => {}} className="w-6 h-6 rounded-md" />
                    <div className="flex-1">
                      <p className="text-primary font-bold text-sm leading-tight">{bump.title}</p>
                      <p className="text-[10px] text-muted-foreground">{bump.description}</p>
                    </div>
                    <span className="text-primary font-headline text-lg">R$ {bump.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Final do Pedido */}
            <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
              <h4 className="font-headline text-xl text-primary uppercase border-b border-primary/10 pb-2">RESUMO DO PEDIDO</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-primary/70">
                  <span>{totalQuantity}X FIGURINHAS PERSONALIZADAS</span>
                  <span>R$ {pricing.fullPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {pricing.savings > 0 && (
                  <div className="flex justify-between text-xs font-bold text-accent">
                    <span>DESCONTO PROGRESSIVO</span>
                    <span>- R$ {pricing.savings.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                {orderBumps.filter(b => b.selected).map(b => (
                  <div key={b.id} className="flex justify-between text-xs font-bold text-primary/70">
                    <span>{b.title.toUpperCase()}</span>
                    <span>R$ {b.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-end">
                <span className="font-headline text-xl text-primary">TOTAL FINAL</span>
                <div className="text-right">
                  <span className="text-primary font-headline text-3xl">R$ {totalWithOrderBumps.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação no Final do Scroll */}
            <div className="space-y-4 pt-4 pb-8">
              <Button 
                className="w-full h-20 text-2xl font-bold bg-primary rounded-full shadow-2xl pulse-button"
                onClick={handleFinishCheckout}
                disabled={!checkoutData.name || checkoutData.whatsapp.length < 14 || !checkoutData.email.includes("@")}
              >
                GERAR PIX
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 text-primary font-bold uppercase text-xs" 
                onClick={() => setShowCheckoutModal(false)}
              >
                VOLTAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fly-to-cart {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(150px, -400px) scale(0.2); opacity: 0; }
        }
        .animate-fly-to-cart { animation: fly-to-cart 0.8s ease-in-out forwards; }
      `}</style>
    </div>
  );
}
