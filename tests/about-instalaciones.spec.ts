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
    const firstTile = section.locator("button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible").first();
    await expect(firstTile).toBeVisible();
    await firstTile.click();

    // Diálogo debe estar presente
    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(lightbox).toBeVisible();

    // Cerrar con Escape
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
  });

  test("Tamaño de foto y flechas flotantes en celular vertical (390 x 844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/about");
    await page.waitForLoadState("domcontentloaded");

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "Sección #instalaciones no presente.");
      return;
    }

    const firstTile = section.locator("button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible").first();
    await expect(firstTile).toBeVisible();
    await firstTile.click();

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(lightbox).toBeVisible();

    // Fondo opaco y oscuro en ambos modos
    const bgColor = await lightbox.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe("rgb(10, 12, 20)");

    // Ancho de foto renderizada >= 98% del viewport (390 * 0.98)
    const imgLocator = lightbox.locator('img[alt]:not([alt=""])').first();
    if ((await imgLocator.count()) > 0) {
      await imgLocator.waitFor({ state: "visible" });
      const w = await imgLocator.evaluate((img: HTMLImageElement) => {
        const r = img.getBoundingClientRect();
        const ratio = (img.naturalWidth || 16) / (img.naturalHeight || 9);
        return Math.min(r.width, r.height * ratio);
      });
      expect(w).toBeGreaterThanOrEqual(390 * 0.98);
    }

    // Flechas de navegación: tamaño >= 44px
    const prevBtn = lightbox.locator('button[aria-label="Foto anterior"]');
    const nextBtn = lightbox.locator('button[aria-label="Foto siguiente"]');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    const prevBox = await prevBtn.boundingBox();
    const nextBox = await nextBtn.boundingBox();
    expect(prevBox?.width).toBeGreaterThanOrEqual(44);
    expect(prevBox?.height).toBeGreaterThanOrEqual(44);
    expect(nextBox?.width).toBeGreaterThanOrEqual(44);
    expect(nextBox?.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press("Escape");
  });

  test("Celular en horizontal (844 x 390): miniaturas ocultas y fondo oscuro", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/about");
    await page.waitForLoadState("domcontentloaded");

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "Sección #instalaciones no presente.");
      return;
    }

    const firstTile = section.locator("button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible").first();
    await expect(firstTile).toBeVisible();
    await firstTile.click();

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(lightbox).toBeVisible();

    // En horizontal, miniaturas ocultas
    const nav = lightbox.locator('nav[aria-label="Miniaturas"]');
    await expect(nav).toBeHidden();

    // Altura de foto >= 80% del viewport
    const imgLocator = lightbox.locator('img[alt]:not([alt=""])').first();
    if ((await imgLocator.count()) > 0) {
      await imgLocator.waitFor({ state: "visible" });
      const h = await imgLocator.evaluate((img: HTMLImageElement) => {
        const r = img.getBoundingClientRect();
        const ratio = (img.naturalWidth || 16) / (img.naturalHeight || 9);
        return Math.min(r.height, r.width / ratio);
      });
      expect(h).toBeGreaterThanOrEqual(390 * 0.8);
    }

    await page.keyboard.press("Escape");
  });
});
