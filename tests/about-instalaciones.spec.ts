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

    // Verificar que muestre la dirección física y el enlace a Google Maps
    const addressText = section.getByText("Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador");
    await expect(addressText).toBeVisible();

    const mapsLink = section.locator('a[href*="maps"]', { hasText: "Ver en Google Maps" });
    await expect(mapsLink).toBeVisible();
    await expect(mapsLink).toHaveAttribute("target", "_blank");
    await expect(mapsLink).toHaveAttribute("rel", "noopener noreferrer");

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

    // 4. Abrir lightbox interactivo con clic, foco inicial en Cerrar y cierre con Enter
    const visibleTiles = section.locator(
      "button[aria-label^='Ver foto']:visible, button[aria-label^='Ver video']:visible",
    );
    const tileCount = await visibleTiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(1);

    const firstTile = visibleTiles.first();
    await expect(firstTile).toBeVisible();

    const lightbox = page.locator('div[role="dialog"][aria-label="Galería de instalaciones"]');
    const closeBtn = lightbox.locator('button[aria-label="Cerrar visor de instalaciones"]');

    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await firstTile.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await expect(closeBtn).toBeFocused();

    // Cerrar con Enter sobre el botón Cerrar y verificar retorno de foco al control exacto
    await page.keyboard.press("Enter");
    await expect(lightbox).not.toBeVisible();
    await expect(firstTile).toBeFocused();

    // 5. Abrir desde otra miniatura (o la primera si solo hay 1) con Enter y cerrar con Espacio
    const secondTrigger = tileCount > 1 ? visibleTiles.nth(1) : firstTile;
    await secondTrigger.focus();
    await expect(secondTrigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(lightbox).toBeVisible();
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press("Space");
    await expect(lightbox).not.toBeVisible();
    await expect(secondTrigger).toBeFocused();

    // 6. Abrir desde «Ver galería completa» con Espacio, recorrer con Tab/Shift+Tab (varios y un solo elemento) y cerrar con Escape
    const viewAllBtn = section.getByRole("button", { name: /Ver galería completa/i });
    await expect(viewAllBtn).toBeVisible();
    await viewAllBtn.focus();
    await expect(viewAllBtn).toBeFocused();
    await page.keyboard.press("Space");
    await expect(lightbox).toBeVisible();
    await expect(closeBtn).toBeFocused();

    const verifyTabCycleInDialog = async () => {
      const visibleControlsCount = await lightbox.evaluate((dialog) => {
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        return nodes.filter(
          (el) =>
            el.getClientRects().length > 0 &&
            window.getComputedStyle(el).visibility !== "hidden",
        ).length;
      });
      expect(visibleControlsCount).toBeGreaterThanOrEqual(1);

      // Recorrer ciclo completo hacia adelante (Tab) y hacia atrás (Shift+Tab) sin orden fijo
      for (const key of ["Tab", "Shift+Tab"] as const) {
        const visitedLabels = new Set<string>();
        for (let i = 0; i < visibleControlsCount + 1; i++) {
          await page.keyboard.press(key);
          const focusState = await lightbox.evaluate((dialog) => {
            const active = document.activeElement as HTMLElement | null;
            if (!active) return { inside: false, visible: false, id: "" };
            const inside = dialog.contains(active);
            const visible =
              active.getClientRects().length > 0 &&
              window.getComputedStyle(active).visibility !== "hidden";
            const id =
              active.getAttribute("aria-label") ||
              active.textContent?.trim() ||
              active.tagName;
            return { inside, visible, id };
          });
          expect(focusState.inside).toBe(true);
          expect(focusState.visible).toBe(true);
          visitedLabels.add(focusState.id);
        }
        expect(visitedLabels.size).toBe(visibleControlsCount);
      }
    };

    // Caso A: galería con los elementos visibles actuales (varios elementos)
    await verifyTabCycleInDialog();

    // Caso B: galería con un solo elemento (ocultando miniaturas adicionales y probando también un único control visible)
    await lightbox.evaluate((dialog) => {
      const thumbs = Array.from(
        dialog.querySelectorAll<HTMLElement>('nav[aria-label="Miniaturas"] button'),
      );
      thumbs.slice(1).forEach((btn) => {
        btn.dataset.testHidden = "true";
        btn.style.display = "none";
      });
    });
    await verifyTabCycleInDialog();

    // Caso límite de un único control enfocable visible dentro del visor
    await lightbox.evaluate((dialog) => {
      const buttons = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
      buttons.slice(1).forEach((btn) => {
        btn.dataset.testSingleControl = "true";
        btn.style.display = "none";
      });
    });
    await closeBtn.focus();
    await verifyTabCycleInDialog();

    // Restaurar visibilidad de controles antes de probar Escape desde otro control del diálogo
    await lightbox.evaluate((dialog) => {
      dialog
        .querySelectorAll<HTMLElement>("[data-test-hidden], [data-test-single-control]")
        .forEach((btn) => {
          btn.style.display = "";
          delete btn.dataset.testHidden;
          delete btn.dataset.testSingleControl;
        });
    });

    await page.keyboard.press("Tab");
    const focusedInsideBeforeEsc = await lightbox.evaluate((dialog) =>
      dialog.contains(document.activeElement),
    );
    expect(focusedInsideBeforeEsc).toBe(true);

    // Cerrar con Escape cuando el foco está en los controles del propio diálogo
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
    await expect(viewAllBtn).toBeFocused();
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
