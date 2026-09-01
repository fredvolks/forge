import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MIR DESK — Toute la compagnie, une seule vue', description: 'Chantiers, commandes, équipes, fournisseurs et communications réunis dans MIR DESK.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
