import { test, expect } from "@playwright/test";

test.describe("Sección «Conoce nuestras instalaciones» en /about", () => {
  test("Estructura, accesibilidad y comportamiento interactivo de la galería", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.waitForLoadState("domcontentloaded");

    const section = page.locator("#instalaciones");
    const count = await section.count();

    // Si la sección no tiene elementos cargados en la base de datos aún, omitir limpiamente
    if (count === 0) {
      test.skip(true, "La sección #instalaciones no está activa o no tiene fotos/videos en la base de datos.");
      return;
    }

    // 1. Verificar accesibilidad y posición
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute("aria-labelledby", "instalaciones-titulo");

    // Verificar que esté después de #sostenibilidad en el DOM
    const isAfterSolidario = await page.evaluate(() => {
      const solidario = document.getElementById("sostenibilidad");
      const instalaciones = document.getElementById("instalaciones");
      if (!solidario || !instalaciones) return false;
      return Boolean(
        solidario.compareDocumentPosition(instalaciones) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(isAfterSolidario).toBe(true);

    // 2. Verificar chip en SectionNav
    const chip = page.locator('nav[aria-label="Secciones de la página"] a[href="#instalaciones"]');
    await expect(chip).toBeVisible();

    // 3. Verificar que no haya desbordamiento horizontal en el documento
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 4. Abrir lightbox interactivo
    const firstTile = section.locator("button[aria-label^='Ver foto'], button[aria-label^='Ver video']").first();
    await expect(firstTile).toBeVisible();
    await firstTile.click();

    // Diálogo debe estar presente
    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(lightbox).toBeVisible();

    // Cerrar con Escape
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
  });
});
