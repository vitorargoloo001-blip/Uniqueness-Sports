import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import BenefitsBar from "@/components/home/BenefitsBar";
import BestSellers from "@/components/home/BestSellers";
import Categories from "@/components/home/Categories";
import BrandLifestyle from "@/components/home/BrandLifestyle";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: { absolute: "Uniqueness Sports | O Esporte Como Identidade" },
  description:
    "Suplementos, roupas e acessórios esportivos para quem leva o treino como parte da própria identidade. Conheça a Uniqueness Sports.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <BenefitsBar />
      <BestSellers />
      <Categories />
      <BrandLifestyle />
      <FinalCTA />
    </>
  );
}
