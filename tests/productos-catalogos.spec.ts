import { test, expect } from "@playwright/test";

test.describe("Catálogos en /productos (Arte y Costura, Panadería y Navidad 2026)", () => {
  test("Carga por defecto con Arte y Costura activo, píldora de Navidad 2026 e insignia Temporada", async ({
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

    // Sin desbordamiento horizontal en ningún viewport
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test("Enlace directo con ancla /productos#navidad-2026 activa el catálogo navideño, muestra sus 3 líneas, 17 productos y PDF propio", async ({
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

    // 17 tarjetas de productos en el catálogo navideño
    const cards = panel.locator("article");
    await expect(cards).toHaveCount(17);

    // Cambiar de regreso a Arte y Costura
    const arteTab = tablist.getByRole("tab", { name: /Arte y Costura/i });
    await arteTab.click();
    await expect(arteTab).toHaveAttribute("aria-selected", "true");
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
