import { test, expect } from "@playwright/test";

test.describe("Conmutador de tema visual (ThemeToggle)", () => {
  test("login: flujo completo de accesibilidad, teclado y persistencia", async ({
    page,
  }) => {
    // 1. Configurar esquema claro inicial
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    // Esperar a que el botón se monte en el DOM (reemplazando al placeholder w-9 h-9)
    const toggleBtn = page.locator('button[aria-label^="Cambiar a modo"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // Con tema claro activo, el nombre accesible debe ser "Cambiar a modo oscuro"
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo oscuro");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // 2. Navegación secuencial con Tab y Shift+Tab hasta enfocar el botón
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();

    // Comprobar que el botón cuenta con las clases de foco visible de la marca
    const classList = (await toggleBtn.getAttribute("class")) || "";
    expect(classList).toContain("focus-visible:outline");
    expect(classList).toContain("focus-visible:outline-larioja-azul");
    expect(classList).toContain("dark:focus-visible:outline-larioja-amarillo");

    // Desplazar foco y regresar con Shift+Tab
    await page.keyboard.press("Tab");
    await expect(toggleBtn).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(toggleBtn).toBeFocused();

    // 3. Alternancia con Enter: pasa a modo oscuro y conserva el foco
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggleBtn).toBeFocused();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo claro");

    // 4. Alternancia con Espacio: pasa a modo claro y conserva el foco
    await page.keyboard.press("Space");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(toggleBtn).toBeFocused();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo oscuro");

    // 5. Preferencia «sistema»: emular esquema oscuro en el navegador con tema en "system"
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => localStorage.setItem("theme", "system"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo claro");

    // Preferencia «sistema»: emular esquema claro en el navegador con tema en "system"
    await page.emulateMedia({ colorScheme: "light" });
    await page.evaluate(() => localStorage.setItem("theme", "system"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo oscuro");

    // 6. Persistencia tras recarga tras seleccionar tema explícito
    await toggleBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo claro");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo claro");
  });

  test("reset-password: confirmación de ruta, contorno en ambos temas y nombre accesible", async ({
    page,
  }) => {
    // 1. Cargar ruta pública /auth/reset-password y confirmar que no redirija
    await page.goto("/auth/reset-password", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/reset-password$/);

    const toggleBtn = page.locator('button[aria-label^="Cambiar a modo"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // 2. Comprobar en modo claro
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo oscuro");

    const outlineStyleLight = await toggleBtn.evaluate((btn) => {
      const s = window.getComputedStyle(btn);
      return {
        outlineStyle: s.outlineStyle,
        classList: btn.className,
      };
    });
    expect(outlineStyleLight.classList).toContain("focus-visible:outline");
    expect(outlineStyleLight.classList).toContain("focus-visible:outline-larioja-azul");

    // 3. Comprobar en modo oscuro
    await toggleBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Cambiar a modo claro");

    const outlineStyleDark = await toggleBtn.evaluate((btn) => {
      const s = window.getComputedStyle(btn);
      return {
        outlineStyle: s.outlineStyle,
        classList: btn.className,
      };
    });
    expect(outlineStyleDark.classList).toContain("dark:focus-visible:outline-larioja-amarillo");
  });
});
