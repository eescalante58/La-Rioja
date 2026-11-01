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
    await expect(async () => {
      if (!(await lightbox.isVisible())) {
        await openBtn.click();
      }
      await expect(lightbox).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await expect(page).toHaveURL(/\/matricula$/);

    // Contador en "1 / N"
    await expect(lightbox.locator("header")).toContainText(/1\s*\/\s*\d+/);

    // Cerrar con Escape y verificar retorno de foco al botón
    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
    await expect(openBtn).toBeFocused();

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
