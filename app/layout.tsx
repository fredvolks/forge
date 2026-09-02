import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FORGE — Votre chantier, tout au même endroit', description: 'Employés, heures, jobs, commandes, matériaux, extras et suivi de chantier dans un seul espace.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
