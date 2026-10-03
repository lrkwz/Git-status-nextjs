import './globals.css';

export const metadata = {
  title: 'Git Status Dashboard',
  description: "Visualizzatore in tempo reale delle informazioni Git: ultimo tag, branch corrente, stato dirty e hash dell'ultimo commit.",
  openGraph: {
    title: 'Git Status Dashboard',
    description: "Visualizzatore in tempo reale delle informazioni Git: ultimo tag, branch corrente, stato dirty e hash dell'ultimo commit.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Git Status Dashboard',
    description: "Visualizzatore in tempo reale delle informazioni Git: ultimo tag, branch corrente, stato dirty e hash dell'ultimo commit.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
