import UnderConstruction from "@/components/layout/UnderConstruction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bingo - La Rioja",
};

export default function BingoPage() {
  return (
    <UnderConstruction 
      title="Bingo en Construcción" 
      description="Estamos preparando una plataforma de bingo emocionante y segura para que puedas participar y apoyar nuestra causa desde cualquier lugar."
    />
  );
}
