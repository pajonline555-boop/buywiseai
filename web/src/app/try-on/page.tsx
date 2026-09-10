import { Metadata } from "next";
import VirtualTryOnStudio from "@/components/vto/VirtualTryOnStudio";

export const metadata: Metadata = {
  title: "✨ AI Virtual Try-On & Shopping Discovery | BuyWise AI",
  description: "Upload your photo and virtually try on sarees, dresses, suits, sherwanis, and jewellery from Amazon India, Myntra, Flipkart, and Meesho in real-time.",
};

export default function TryOnPage() {
  return (
    <main style={{ minHeight: "90vh", paddingTop: "20px" }} suppressHydrationWarning>
      <VirtualTryOnStudio />
    </main>
  );
}
