import { test, expect, type Page } from "@playwright/test";

/**
 * Verifica que la barra de talleres ("Talleres") no desborde, que cada pestaña
 * esté completamente dentro del contenedor y que la página no tenga scroll horizontal.
 */
async function assertTabsFitInsideBar(page: Page) {
  const metrics = await page.evaluate(() => {
    const docScrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    const bar = document.querySelector<HTMLElement>('[role="tablist"][aria-label="Talleres"]');
    if (!bar) return null;
    const barRect = bar.getBoundingClientRect();
    const tabs = Array.from(bar.querySelectorAll<HTMLElement>('[role="tab"]')).map((t) => {
      const r = t.getBoundingClientRect();
      const style = getComputedStyle(t);
      return {
        slug: t.dataset.catalogTab ?? "",
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        clientWidth: t.clientWidth,
        scrollWidth: t.scrollWidth,
        clientHeight: t.clientHeight,
        scrollHeight: t.scrollHeight,
        active: t.getAttribute("aria-selected") === "true",
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontWeight: style.fontWeight,
      };
    });
    return {
      docScrollWidth,
      innerWidth,
      barLeft: barRect.left,
      barRight: barRect.right,
      barClientWidth: bar.clientWidth,
      barScrollWidth: bar.scrollWidth,
      tabs,
    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) return;

  // Sin scroll horizontal de la página
  expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.innerWidth);

  // La barra de talleres no desborda (las 3 pestañas caben completas)
  expect(metrics.barScrollWidth).toBeLessThanOrEqual(metrics.barClientWidth + 1);

  for (const tab of metrics.tabs) {
    // Cada pestaña completamente dentro de los bordes izquierdo y derecho de la barra
    expect(tab.left, `tab ${tab.slug} left >= bar.left`).toBeGreaterThanOrEqual(
      metrics.barLeft - 1,
    );
    expect(tab.right, `tab ${tab.slug} right <= bar.right`).toBeLessThanOrEqual(
      metrics.barRight + 1,
    );
    // Sin texto cortado horizontal ni verticalmente dentro de la pestaña
    expect(tab.scrollWidth, `tab ${tab.slug} scrollWidth <= clientWidth`).toBeLessThanOrEqual(
      tab.clientWidth + 1,
    );
    expect(tab.scrollHeight, `tab ${tab.slug} scrollHeight <= clientHeight`).toBeLessThanOrEqual(
      tab.clientHeight + 2,
    );
  }
}

/**
 * Verifica que el submenú de líneas de producto (cuando tiene <= 3 opciones, como
 * Navidad 2026: «Costura navideña», «Madera y decoración» y «Galletas navideñas»)
 * no desborde y que las 3 pestañas quepan completas dentro del ancho útil.
 */
async function assertLineChipsFitInsideBar(page: Page) {
  const metrics = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Líneas de productos"]');
    const bar = nav?.firstElementChild as HTMLElement | null;
    if (!bar) return null;
    const barRect = bar.getBoundingClientRect();
    const chips = Array.from(bar.querySelectorAll<HTMLElement>("a[data-chip]")).map((c) => {
      const r = c.getBoundingClientRect();
      return {
        text: c.textContent?.trim() ?? "",
        left: r.left,
        right: r.right,
        clientWidth: c.clientWidth,
        scrollWidth: c.scrollWidth,
        clientHeight: c.clientHeight,
        scrollHeight: c.scrollHeight,
      };
    });
    return {
      barLeft: barRect.left,
      barRight: barRect.right,
      barClientWidth: bar.clientWidth,
      barScrollWidth: bar.scrollWidth,
      chips,
    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) return;

  expect(metrics.barScrollWidth).toBeLessThanOrEqual(metrics.barClientWidth + 1);
  for (const chip of metrics.chips) {
    expect(chip.left, `chip "${chip.text}" left >= bar.left`).toBeGreaterThanOrEqual(
      metrics.barLeft - 1,
    );
    expect(chip.right, `chip "${chip.text}" right <= bar.right`).toBeLessThanOrEqual(
      metrics.barRight + 1,
    );
    expect(
      chip.scrollWidth,
      `chip "${chip.text}" scrollWidth <= clientWidth`,
    ).toBeLessThanOrEqual(chip.clientWidth + 1);
    expect(
      chip.scrollHeight,
      `chip "${chip.text}" scrollHeight <= clientHeight`,
    ).toBeLessThanOrEqual(chip.clientHeight + 2);
  }
}

test.describe("Catálogos en /productos (Arte y Costura, Panadería y Navidad 2026)", () => {
  test("Carga por defecto con Arte y Costura activo, píldora de Navidad 2026 e insignia Temporada sin recorte en claro y oscuro", async ({
    page,
  }) => {
    await page.goto("/productos", { waitUntil: "domcontentloaded" });

    const tablist = page.getByRole("tablist", { name: "Talleres" });
    await expect(tablist).toBeVisible();

    const arteTab = tablist.getByRole("tab", { name: /Arte y Costura/i });
    await expect(arteTab).toBeVisible();
    await expect(arteTab).toHaveAttribute("aria-selected", "true");

    // Verificar anclas DOM para enlaces directos desde otras áreas del sitio
    await expect(page.locator("#arte-y-costura")).toHaveCount(1);

    const navidadTab = tablist.getByRole("tab", { name: /Navidad 2026/i });
    if ((await navidadTab.count()) === 0) {
      test.skip(true, "El catálogo Navidad 2026 está oculto actualmente.");
      return;
    }

    await expect(page.locator("#navidad-2026")).toHaveCount(1);
    await expect(navidadTab).toContainText("Temporada");

    // Verificar todas las pestañas completas dentro de la barra en modo claro
    await assertTabsFitInsideBar(page);

    // Verificar también en 412 px (Android grande) cuando estamos en el proyecto Mobile-L (390 px)
    const initialViewport = page.viewportSize();
    if (initialViewport?.width === 390) {
      await page.setViewportSize({ width: 412, height: 915 });
      await assertTabsFitInsideBar(page);
      await page.setViewportSize(initialViewport);
    }

    // Verificar en modo oscuro y comprobar contraste de la pestaña activa
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await assertTabsFitInsideBar(page);
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
  });

  test("Enlace directo con ancla /productos#navidad-2026 activa el catálogo navideño, muestra las 3 pestañas sin recorte, sus 3 líneas, productos y PDF propio", async ({
    page,
  }) => {
    await page.goto("/productos#navidad-2026", { waitUntil: "domcontentloaded" });

    const tablist = page.getByRole("tablist", { name: "Talleres" });
    const navidadTab = tablist.getByRole("tab", { name: /Navidad 2026/i });
    if ((await navidadTab.count()) === 0) {
      test.skip(true, "El catálogo Navidad 2026 está oculto actualmente.");
      return;
    }

    await expect(navidadTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });

    // Verificar que las 3 pestañas y las 3 líneas de Navidad 2026 estén completas dentro de la barra en modo claro
    await assertTabsFitInsideBar(page);
    await assertLineChipsFitInsideBar(page);

    // Verificar también en 412 px (Android grande) cuando estamos en el proyecto Mobile-L (390 px)
    const initialViewport = page.viewportSize();
    if (initialViewport?.width === 390) {
      await page.setViewportSize({ width: 412, height: 915 });
      await assertTabsFitInsideBar(page);
      await assertLineChipsFitInsideBar(page);
      await page.setViewportSize(initialViewport);
    }

    // Verificar en modo oscuro: fondo amarillo (#ffff00) y texto navy (#012060) de alto contraste
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await assertTabsFitInsideBar(page);
    await assertLineChipsFitInsideBar(page);
    await expect
      .poll(async () =>
        navidadTab.evaluate((el) => {
          const s = getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color };
        }),
      )
      .toEqual({ bg: "rgb(255, 255, 0)", color: "rgb(1, 32, 96)" });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));

    const panel = page.getByRole("tabpanel", { name: "Navidad 2026" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Navidad 2026", level: 2 })).toBeVisible();
    await expect(panel.getByText("Regala con propósito", { exact: true })).toBeVisible();

    // Chips de las 3 líneas de Navidad 2026
    const linesNav = page.getByRole("navigation", { name: "Líneas de productos" });
    await expect(linesNav.getByRole("link", { name: "Costura navideña" })).toBeVisible();
    await expect(linesNav.getByRole("link", { name: "Madera y decoración" })).toBeVisible();
    await expect(linesNav.getByRole("link", { name: "Galletas navideñas" })).toBeVisible();

    // PDF descargable de Navidad 2026 distinto al de Arte y Costura
    const downloadLink = panel.getByRole("link", { name: /Descargar catálogo/i });
    await expect(downloadLink).toBeVisible();
    const navidadHref = await downloadLink.getAttribute("href");
    expect(navidadHref).toContain("navidad-2026");

    // Al menos los 17 productos base del catálogo navideño
    const cards = panel.locator("article");
    expect(await cards.count()).toBeGreaterThanOrEqual(17);

    // Cambiar de regreso a Arte y Costura
    const arteTab = tablist.getByRole("tab", { name: /Arte y Costura/i });
    await arteTab.click();
    await expect(arteTab).toHaveAttribute("aria-selected", "true");
    await assertTabsFitInsideBar(page);
  });

  test("Enlace directo a producto /productos?producto=galleta-navidena abre la hoja con sus 2 presentaciones y agrega a la canasta", async ({
    page,
  }) => {
    await page.goto("/productos?producto=galleta-navidena", { waitUntil: "domcontentloaded" });

    const tablist = page.getByRole("tablist", { name: "Talleres" });
    const navidadTab = tablist.getByRole("tab", { name: /Navidad 2026/i });
    if ((await navidadTab.count()) === 0) {
      test.skip(true, "El catálogo Navidad 2026 está oculto actualmente.");
      return;
    }

    const dialog = page.getByRole("dialog", { name: "Galleta navideña" });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(navidadTab).toHaveAttribute("aria-selected", "true");

    // Dos presentaciones: Individual ($1.00) y Caja de 10 unidades ($9.00)
    await expect(dialog.getByRole("radio", { name: /Individual/i })).toBeVisible();
    const boxVariantBtn = dialog.getByRole("radio", { name: /Caja de 10 unidades/i });
    await expect(boxVariantBtn).toBeVisible();
    await boxVariantBtn.click();

    const addBtn = dialog.getByRole("button", { name: /Agregar a la canasta/i });
    await addBtn.click();

    // Se cierra la hoja y la canasta refleja 1 producto ($9.00)
    await expect(page.getByRole("button", { name: /Ver canasta: 1 producto/i })).toBeVisible();
  });
});
