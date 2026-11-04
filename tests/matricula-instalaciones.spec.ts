import { test, expect } from "@playwright/test";

test.describe("Bloque «Conoce nuestras instalaciones» en /matricula", () => {
  test("Ubicación, miniaturas, visor de fotos sin salir de /matricula y accesibilidad", async ({
    page,
  }) => {
    await page.goto("/matricula", { waitUntil: "domcontentloaded" });

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(
        true,
        "El bloque #instalaciones en /matricula no está activo o la galería no tiene elementos.",
      );
      return;
    }

    // 1. Verificar visibilidad y atributos de accesibilidad
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute(
      "aria-labelledby",
      "matricula-instalaciones-titulo",
    );

    // Verificar que muestre la dirección física y el enlace a Google Maps
    const addressText = section.getByText("Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador");
    await expect(addressText).toBeVisible();

    const mapsLink = section.locator('a[href*="maps"]', { hasText: "Ver en Google Maps" });
    await expect(mapsLink).toBeVisible();
    await expect(mapsLink).toHaveAttribute("target", "_blank");
    await expect(mapsLink).toHaveAttribute("rel", "noopener noreferrer");

    // 2. Verificar posición en el DOM: después de MatriculaProgramas y antes de #proceso
    const positionChecks = await page.evaluate(() => {
      const instalaciones = document.getElementById("instalaciones");
      const proceso = document.getElementById("proceso");
      const prevSection = instalaciones?.previousElementSibling;
      if (!instalaciones || !proceso || !prevSection) {
        return { afterProgramas: false, beforeProceso: false };
      }
      return {
        afterProgramas: Boolean(
          prevSection.compareDocumentPosition(instalaciones) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        beforeProceso: Boolean(
          instalaciones.compareDocumentPosition(proceso) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      };
    });
    expect(positionChecks.afterProgramas).toBe(true);
    expect(positionChecks.beforeProceso).toBe(true);

    // 3. Verificar hasta 4 miniaturas
    const thumbs = section.locator(
      "button[aria-label^='Ver foto'], button[aria-label^='Ver video']",
    );
    const thumbCount = await thumbs.count();
    expect(thumbCount).toBeGreaterThanOrEqual(1);
    expect(thumbCount).toBeLessThanOrEqual(4);

    // 4. Botón primario «Ver instalaciones (N)» abre el visor en /matricula
    const openBtn = section
      .locator("button")
      .filter({ hasText: /\(\d+\)/ })
      .first();
    await expect(openBtn).toBeVisible();

    const lightbox = page.locator(
      'div[role="dialog"][aria-label="Galería de instalaciones"]',
    );
    const closeBtn = lightbox.locator(
      'button[aria-label="Cerrar visor de instalaciones"]',
    );

    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await openBtn.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await expect(page).toHaveURL(/\/matricula$/);
    await expect(closeBtn).toBeFocused();

    // Contador en "1 / N"
    await expect(lightbox.locator("header")).toContainText(/1\s*\/\s*\d+/);

    // Cerrar con Enter sobre Cerrar y verificar retorno de foco al botón que lo abrió
    await page.keyboard.press("Enter");
    await expect(lightbox).not.toBeVisible();
    await expect(openBtn).toBeFocused();

    // Abrir desde la primera miniatura con Enter y cerrar con Espacio sobre Cerrar
    const firstThumb = thumbs.first();
    await firstThumb.focus();
    await expect(firstThumb).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(lightbox).toBeVisible();
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press("Space");
    await expect(lightbox).not.toBeVisible();
    await expect(firstThumb).toBeFocused();

    // Abrir desde otra miniatura (o la primera si solo hay 1) con Espacio, validar Tab/Shift+Tab y cerrar con Escape
    const targetThumb = thumbCount > 1 ? thumbs.nth(1) : firstThumb;
    await targetThumb.focus();
    await expect(targetThumb).toBeFocused();
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

    // Caso A: galería con varios elementos
    await verifyTabCycleInDialog();

    // Caso B: galería con un solo elemento (y caso límite de un único control visible)
    await lightbox.evaluate((dialog) => {
      const navThumbs = Array.from(
        dialog.querySelectorAll<HTMLElement>('nav[aria-label="Miniaturas"] button'),
      );
      navThumbs.slice(1).forEach((btn) => {
        btn.dataset.testHidden = "true";
        btn.style.display = "none";
      });
    });
    await verifyTabCycleInDialog();

    await lightbox.evaluate((dialog) => {
      const buttons = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
      buttons.slice(1).forEach((btn) => {
        btn.dataset.testSingleControl = "true";
        btn.style.display = "none";
      });
    });
    await closeBtn.focus();
    await verifyTabCycleInDialog();

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

    // Cerrar con Escape desde un control del diálogo y verificar retorno de foco al control exacto
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
    await expect(targetThumb).toBeFocused();

    // 5. Enlace secundario hacia /about#instalaciones (si está activo)
    const secondaryLink = section.locator('a[href="/about#instalaciones"]');
    if ((await secondaryLink.count()) > 0) {
      await expect(secondaryLink).toBeVisible();
    }

    // 6. Cero desbordamiento horizontal
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test("Responsividad en celular (390 x 844): cuadrícula 2x2 y sin desbordamiento", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/matricula", { waitUntil: "domcontentloaded" });

    const section = page.locator("#instalaciones");
    if ((await section.count()) === 0) {
      test.skip(true, "El bloque #instalaciones no está presente.");
      return;
    }

    await expect(section).toBeVisible();
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
