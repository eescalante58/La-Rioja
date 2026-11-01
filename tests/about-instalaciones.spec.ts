import { test, expect } from "@playwright/test";

test.describe("Sección «Conoce nuestras instalaciones» en /about", () => {
  test("Estructura, accesibilidad y comportamiento interactivo de la galería", async ({
    page,
  }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });

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

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await firstTile.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    // Cerrar con Escape
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
  });

  test("Botón «Agendar una visita» en el pie del mosaico abre el formulario modal de admisión", async ({
    page,
  }) => {
    await page.goto("/about#instalaciones", { waitUntil: "domcontentloaded" });

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "Sección #instalaciones no presente.");
      return;
    }

    const visitBtn = section.getByRole("button", { name: /Agendar una visita/i });
    await expect(visitBtn).toBeVisible();

    // Verificar que se ubica después de «Ver galería completa»
    const isAfterViewAll = await section.evaluate((sec) => {
      const buttons = Array.from(sec.querySelectorAll("button"));
      const viewAll = buttons.find((b) =>
        b.textContent?.includes("Ver galería completa"),
      );
      const visit = buttons.find((b) =>
        b.textContent?.includes("Agendar una visita"),
      );
      if (!viewAll || !visit) return false;
      return Boolean(
        viewAll.compareDocumentPosition(visit) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(isAfterViewAll).toBe(true);

    // Verificar aviso de privacidad hacia /privacidad debajo del botón
    const privacyLink = section.locator('a[href="/privacidad"]');
    await expect(privacyLink).toBeVisible();

    // Al pulsar el botón se abre el modal de admisión (MatriculaModalForm)
    const modal = page.locator(
      'div[role="dialog"][aria-labelledby="matricula-modal-title"]',
    );
    await expect(async () => {
      if (!(await modal.isVisible())) {
        await visitBtn.click();
      }
      await expect(modal).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    // Cerrar el modal con Escape
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("Tamaño de foto y flechas flotantes en celular vertical (390 x 844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/about", { waitUntil: "domcontentloaded" });

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "Sección #instalaciones no presente.");
      return;
    }

    const firstTile = section.locator("button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible").first();
    await expect(firstTile).toBeVisible();

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await firstTile.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

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
    await page.goto("/about", { waitUntil: "domcontentloaded" });

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "Sección #instalaciones no presente.");
      return;
    }

    const firstTile = section.locator("button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible").first();
    await expect(firstTile).toBeVisible();

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await firstTile.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

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
