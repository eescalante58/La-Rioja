/**
 * Comprime una imagen en el navegador (WebP, lado mayor máx. `maxSide`,
 * 1920px por defecto) antes de subirla. Las funciones serverless de Vercel rechazan requests de más de
 * ~4.5MB, así que fotos pesadas deben reducirse del lado del cliente.
 * Si la compresión falla o no reduce el tamaño, devuelve el archivo original.
 */
export async function compressImage(file: File, maxSide = 1920): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
