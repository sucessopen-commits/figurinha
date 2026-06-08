import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Figurinha Craque | Crie sua Figurinha Personalizada',
  description: 'Transforme a foto do seu pequeno em uma figurinha de craque de futebol profissional!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Anton&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-white">
        <Script id="utmify-pixel-config" strategy="afterInteractive">
          {`window.pixelId = "6a2640ac1c920b5a67171d35";`}
        </Script>
        <Script 
          src="https://cdn.utmify.com.br/scripts/pixel/pixel.js" 
          strategy="afterInteractive" 
          async 
          defer 
        />
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
