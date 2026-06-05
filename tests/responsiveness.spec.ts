import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/about',
  '/programs',
  '/faq',
  '/contact',
  '/login'
];

test.describe('Auditoría de Responsividad', () => {
  for (const pagePath of pages) {
    test(`Auditoría en ${pagePath}`, async ({ page }) => {
      // Ir a la página
      await page.goto(pagePath);
      
      // Esperar a que las animaciones de ScrollReveal o contenido dinámico carguen
      await page.waitForTimeout(1000); 

      // 1. Verificación automática de Scroll Horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll, `¡ERROR! Se detectó scroll horizontal en ${pagePath} (${test.info().project.name})`).toBe(false);

      // 2. Tomar captura de pantalla para revisión visual
      // Reemplazamos caracteres no válidos para nombres de archivo
      const projectName = test.info().project.name.replace(/ /g, '_').replace(/[()]/g, '');
      const pathName = pagePath === '/' ? 'home' : pagePath.replace(/\//g, '');
      
      await page.screenshot({ 
        path: `./playwright-report/screenshots/${projectName}-${pathName}.png`, 
        fullPage: true 
      });
    });
  }
});
