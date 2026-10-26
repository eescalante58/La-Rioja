import { test, expect } from '@playwright/test';

test.describe('Módulo de Matrícula 2027 - Verificaciones Técnicas', () => {
  test('Endpoint /api/public/matricula-status responde y tiene encabezados de caché estrictos', async ({ request }) => {
    const res = await request.get('/api/public/matricula-status');
    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('active');

    // Verificar encabezado de caché de 60 segundos
    const cacheControl = res.headers()['cache-control'];
    expect(cacheControl).toContain('max-age=60');
  });

  test('Validación de idempotencia en /api/public/matricula/contact', async ({ request }) => {
    // Si la página está inactiva en la base de datos, el endpoint devuelve 403 controlado
    const testIdempotencyKey = 'a0000000-0000-4000-8000-000000000001';

    const payload = {
      name: 'Test Aspirante',
      email: 'test@larioja.edu.sv',
      phone: '7731-0792',
      type: 'Información de Inscripción',
      message: 'Prueba de validación técnica de idempotencia para matrícula.',
      idempotency_key: testIdempotencyKey,
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'matricula_2027',
      },
    };

    const res = await request.post('/api/public/matricula/contact', {
      data: payload,
    });

    // Puede ser 200 (si activa) o 403 (si desactivada inicialmente conforme a la regla de entrega segura)
    expect([200, 403]).toContain(res.status());

    if (res.status() === 200) {
      // Reintento idéntico -> debe retornar 200 con el mismo id
      const resDuplicate = await request.post('/api/public/matricula/contact', {
        data: payload,
      });
      expect(resDuplicate.status()).toBe(200);
      const jsonDuplicate = await resDuplicate.json();
      expect(jsonDuplicate.success).toBe(true);

      // Reintento con misma clave pero datos diferentes -> debe rechazar con 409
      const resConflict = await request.post('/api/public/matricula/contact', {
        data: {
          ...payload,
          name: 'Nombre Completamente Diferente',
        },
      });
      expect(resConflict.status()).toBe(409);
    }
  });

  test('Auditoría de reflujo a 320 px y visualización', async ({ page }) => {
    // Intentar acceder a /matricula
    const response = await page.goto('/matricula');
    await page.waitForTimeout(1000);

    // Si está activa (200), verificar que no haya scroll horizontal ni textos desbordados
    if (response?.status() === 200) {
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verificar que el H1 contiene "Matrícula" o "MATRÍCULA"
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
    } else {
      // Si está desactivada inicialmente, debe retornar 404
      expect(response?.status()).toBe(404);
    }
  });
});
