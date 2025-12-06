import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: "Gym Tracker Pro",
  description: "Aplicación completa de seguimiento de entrenamientos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={montserrat.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
