import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../assets/scss/main.scss";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const myshkin = localFont({
  src: "../assets/fonts/Myshkin2-Regular.woff2",
  variable: "--font-myshkin",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MИШKiN LAБS | Sound. Code. Experiments.",
  description:
    "Personal creative site for Myshkin Labs — experiments, notes, releases and instruments, plus browser tools for practising rhythm and melody.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${myshkin.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
