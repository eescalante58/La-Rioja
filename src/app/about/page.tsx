import UnderConstruction from "@/components/layout/UnderConstruction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nosotros - La Rioja",
};

export default function AboutPage() {
  return (
    <UnderConstruction 
      title="Página en Construcción" 
      description="Muy pronto podrás conocer más sobre nuestra historia, misión y el increíble equipo que forma parte de La Rioja."
    />
  );
}
