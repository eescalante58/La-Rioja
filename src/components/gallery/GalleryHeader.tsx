import { Camera, Share2, Play } from "lucide-react";

export default function GalleryHeader() {
  return (
    <header className="w-full bg-white dark:bg-black py-12 px-6 border-b border-gray-100 dark:border-gray-900">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-montserrat font-black tracking-tighter text-larioja-azul dark:text-white uppercase">
            LA RIOJA <span className="text-larioja-amarillo">2026</span>
          </h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <Camera size={18} className="text-larioja-verde" />
            <span className="tracking-widest uppercase text-xs">Marlon Photographer</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
            <Share2 size={16} /> Compartir
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-larioja-azul text-white text-sm font-semibold hover:bg-larioja-azul/90 transition-all shadow-lg shadow-larioja-azul/20">
            <Play size={16} fill="currentColor" /> Diapositivas
          </button>
        </div>
      </div>
    </header>
  );
}
