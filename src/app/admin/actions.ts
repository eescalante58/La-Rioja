"use server";

import {
  getDashboardDataCore,
  getRegisteredCardsCore,
  getInvoicesByDateCore,
  getSalesByManagerCore,
  getInvoicesByManagerCore,
  getInvoiceCardsCore,
  getCardTypeSummaryCore,
  getAssignmentByLevelCore,
  getStudentCardsCore,
  getBingoCountriesCore,
} from "./dashboard-core";

/**
 * Server Actions del dashboard /admin.
 *
 * La lógica vive en dashboard-core.ts, compartida con el Route Handler
 * GET /api/dashboard. Estas acciones solo deben usarse desde Server
 * Components (carga inicial SSR): invocarlas desde el cliente
 * re-renderiza el RSC payload completo — para eso está /api/dashboard
 * (regla .devin/rules/no-rerender-completo.md).
 */

export async function getDashboardData() {
  return getDashboardDataCore();
}

export async function getRegisteredCards() {
  return getRegisteredCardsCore();
}

export async function getInvoicesByDate(date: string) {
  return getInvoicesByDateCore(date);
}

export async function getSalesByManager() {
  return getSalesByManagerCore();
}

export async function getInvoicesByManager(managerName: string) {
  return getInvoicesByManagerCore(managerName);
}

export async function getInvoiceCards(invoiceNumber: string) {
  return getInvoiceCardsCore(invoiceNumber);
}

export async function getCardTypeSummary() {
  return getCardTypeSummaryCore();
}

export async function getAssignmentByLevel() {
  return getAssignmentByLevelCore();
}

export async function getStudentCards(studentId: number) {
  return getStudentCardsCore(studentId);
}

export async function getBingoCountries() {
  return getBingoCountriesCore();
}
