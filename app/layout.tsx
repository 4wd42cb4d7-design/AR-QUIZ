import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cas Cliniques — Choc septique urinaire', description: 'Cas clinique interactif d’anesthésie-réanimation' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="fr"><body>{children}</body></html>; }
