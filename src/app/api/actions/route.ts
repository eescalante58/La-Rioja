import { NextRequest, NextResponse } from "next/server";

import {
  getWheels,
  getSoldCards,
  getWheelSpins,
  saveWheelConfig,
  saveWheelItems,
  toggleWheelPublished,
  deleteWheelConfig,
  getPublicWheelData,
  getPublicTombolaData,
} from "@/app/admin/bingo/wheel-actions";

import {
  updateSingleCard,
  updateCardType,
  updateCardRangeType,
  updateCardRangePlayer,
  uploadCardsBatch,
  clearEventCards,
  logUploadActivity,
  verifyUpload,
  generateCards,
  saveEvent,
  deleteEvent,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getPromoTemplates,
  syncCustomers,
  logPromoMessage,
  getBatchLogs,
  getBatchDetails,
  uploadPromoImage,
  sendWhatsAppAutomation,
  checkWhatsAppInstanceStatus,
} from "@/app/admin/bingo/actions";

import {
  saveStudent,
  deleteStudent,
  importStudents,
  logExportActivity as logExportActivityStudents,
  getStudentCards,
  assignCardToStudent,
  unassignCardFromStudent,
  bulkAssignCards,
  getAllAssignedCards,
  getEventCardsInfo,
  assignCardRangeToStudent,
  getUnsoldAssignedCardsReport,
  getDefaultReportEvent,
} from "@/app/admin/settings/students/actions";

import { saveCompany, deleteCompany } from "@/app/admin/settings/companies/actions";

import {
  saveCountryCode,
  deleteCountryCode,
  importCountryCodes,
  logExportActivity as logExportActivityCountries,
} from "@/app/admin/settings/countries/actions";

import {
  getContactSubmissions,
  deleteContactSubmission,
  resendContactEmail,
} from "@/app/admin/settings/contact/actions";

import { getTablePolicies } from "@/app/admin/settings/security/actions";

import { setRegistrationMode } from "@/app/admin/settings/registration-limits/actions";

import { cloneEventData } from "@/app/admin/settings/test-data/actions";

import {
  createNewUser,
  updateUser,
  uploadUserAvatar,
  deleteUser,
  createRole,
  updateRole,
  deleteRole,
  assignUserToCompany,
  removeUserFromCompany,
  updateUserCompanyRole,
  getUserCompanies,
} from "@/app/admin/settings/users/actions";

import {
  updateMyProfile,
  updateMyPassword,
} from "@/app/admin/profile/actions";

import {
  createCMSContent,
  updateCMSContent,
  deleteCMSContent,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  createFAQSection,
  updateFAQSection,
  deleteFAQSection,
} from "@/app/admin/cms/actions";

import {
  bulkUploadGalleryImages,
  deleteGalleryImage,
  updateGalleryImagesOrder,
} from "@/app/admin/cms/gallery-actions";

import { submitContactForm } from "@/app/actions/contact";

/**
 * Tipo de una función despachable: cualquier función async registrable.
 * Las acciones ya incorporan sus propios guards (withRole/withCompanyAccess),
 * por lo que la seguridad se preserva exactamente igual que en una llamada
 * directa desde un componente cliente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionFn = (...args: any[]) => Promise<unknown>;

/**
 * Whitelist de operaciones invocables desde el cliente vía JSON.
 * Solo se exponen las que ya eran Server Actions públicas; los nombres con
 * prefijo de dominio evitan colisiones entre archivos de acciones.
 */
const REGISTRY: Record<string, ActionFn> = {
  // Ruletas / tómbola (admin /admin/bingo + páginas públicas /ruleta /tombola)
  "bingo.getWheels": getWheels,
  "bingo.getSoldCards": getSoldCards,
  "bingo.getWheelSpins": getWheelSpins,
  "bingo.saveWheelConfig": saveWheelConfig,
  "bingo.saveWheelItems": saveWheelItems,
  "bingo.toggleWheelPublished": toggleWheelPublished,
  "bingo.deleteWheelConfig": deleteWheelConfig,
  "bingo.getPublicWheelData": getPublicWheelData,
  "bingo.getPublicTombolaData": getPublicTombolaData,

  // Cartones, cargas y eventos (/admin/bingo)
  "bingo.updateSingleCard": updateSingleCard,
  "bingo.updateCardType": updateCardType,
  "bingo.updateCardRangeType": updateCardRangeType,
  "bingo.updateCardRangePlayer": updateCardRangePlayer,
  "bingo.uploadCardsBatch": uploadCardsBatch,
  "bingo.clearEventCards": clearEventCards,
  "bingo.logUploadActivity": logUploadActivity,
  "bingo.verifyUpload": verifyUpload,
  "bingo.generateCards": generateCards,
  "bingo.saveEvent": saveEvent,
  "bingo.deleteEvent": deleteEvent,

  // Pestaña promocional (/admin/bingo)
  "bingo.getCustomers": getCustomers,
  "bingo.saveCustomer": saveCustomer,
  "bingo.deleteCustomer": deleteCustomer,
  "bingo.getPromoTemplates": getPromoTemplates,
  "bingo.syncCustomers": syncCustomers,
  "bingo.logPromoMessage": logPromoMessage,
  "bingo.getBatchLogs": getBatchLogs,
  "bingo.getBatchDetails": getBatchDetails,
  "bingo.uploadPromoImage": uploadPromoImage,
  "bingo.sendWhatsAppAutomation": sendWhatsAppAutomation,
  "bingo.checkWhatsAppInstanceStatus": checkWhatsAppInstanceStatus,

  // Settings — students
  "students.saveStudent": saveStudent,
  "students.deleteStudent": deleteStudent,
  "students.importStudents": importStudents,
  "students.logExportActivity": logExportActivityStudents,
  "students.getStudentCards": getStudentCards,
  "students.assignCardToStudent": assignCardToStudent,
  "students.unassignCardFromStudent": unassignCardFromStudent,
  "students.bulkAssignCards": bulkAssignCards,
  "students.getAllAssignedCards": getAllAssignedCards,
  "students.getEventCardsInfo": getEventCardsInfo,
  "students.assignCardRangeToStudent": assignCardRangeToStudent,
  "students.getUnsoldAssignedCardsReport": getUnsoldAssignedCardsReport,
  "students.getDefaultReportEvent": getDefaultReportEvent,

  // Settings — companies / countries / contact / security / limits
  "companies.saveCompany": saveCompany,
  "companies.deleteCompany": deleteCompany,
  "countries.saveCountryCode": saveCountryCode,
  "countries.deleteCountryCode": deleteCountryCode,
  "countries.importCountryCodes": importCountryCodes,
  "countries.logExportActivity": logExportActivityCountries,
  "contactSettings.getContactSubmissions": getContactSubmissions,
  "contactSettings.deleteContactSubmission": deleteContactSubmission,
  "contactSettings.resendContactEmail": resendContactEmail,
  "security.getTablePolicies": getTablePolicies,
  "registrationLimits.setRegistrationMode": setRegistrationMode,
  "testData.cloneEventData": cloneEventData,

  // Settings — users
  "users.createNewUser": createNewUser,
  "users.updateUser": updateUser,
  "users.uploadUserAvatar": uploadUserAvatar,
  "users.deleteUser": deleteUser,
  "users.createRole": createRole,
  "users.updateRole": updateRole,
  "users.deleteRole": deleteRole,
  "users.assignUserToCompany": assignUserToCompany,
  "users.removeUserFromCompany": removeUserFromCompany,
  "users.updateUserCompanyRole": updateUserCompanyRole,
  "users.getUserCompanies": getUserCompanies,

  // Perfil propio
  "profile.updateMyProfile": updateMyProfile,
  "profile.updateMyPassword": updateMyPassword,

  // CMS / FAQ / galería
  "cms.createCMSContent": createCMSContent,
  "cms.updateCMSContent": updateCMSContent,
  "cms.deleteCMSContent": deleteCMSContent,
  "cms.createFAQ": createFAQ,
  "cms.updateFAQ": updateFAQ,
  "cms.deleteFAQ": deleteFAQ,
  "cms.createFAQSection": createFAQSection,
  "cms.updateFAQSection": updateFAQSection,
  "cms.deleteFAQSection": deleteFAQSection,
  "cms.bulkUploadGalleryImages": bulkUploadGalleryImages,
  "cms.deleteGalleryImage": deleteGalleryImage,
  "cms.updateGalleryImagesOrder": updateGalleryImagesOrder,

  // Formulario de contacto público
  "contact.submitContactForm": submitContactForm,
};

/** Token que el cliente inserta en `args` donde debe ir el FormData recibido. */
const FORMDATA_TOKEN = "$formData";

/**
 * Ejecuta la acción registrada y devuelve su resultado tal cual en JSON
 * (las acciones ya responden con la forma `{ success, data, error }`).
 */
async function dispatch(name: string, args: unknown[]): Promise<NextResponse> {
  const fn = REGISTRY[name];
  if (!fn) {
    return NextResponse.json(
      { success: false, error: `Operación desconocida: ${name}` },
      { status: 400 },
    );
  }

  try {
    const result = await fn(...args);
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    console.error(`[api/actions] ${name} failed:`, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/actions — dispatcher JSON/multipart.
 *
 * JSON: `{ "name": "dominio.accion", "args": [...] }`
 * Multipart: campos `name` y `args` (JSON). Cada token "$formData" en `args`
 * se sustituye por el FormData de la petición (los campos `name`/`args`
 * internos se eliminan antes de entregarlo a la acción).
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "FormData inválido" },
        { status: 400 },
      );
    }

    const name = String(formData.get("name") ?? "");
    let args: unknown[] = [];
    try {
      args = JSON.parse(String(formData.get("args") ?? "[]"));
    } catch {
      return NextResponse.json(
        { success: false, error: "args JSON inválido" },
        { status: 400 },
      );
    }

    formData.delete("name");
    formData.delete("args");
    const resolvedArgs = args.map((a) => (a === FORMDATA_TOKEN ? formData : a));
    return dispatch(name, resolvedArgs);
  }

  let body: { name?: string; args?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  return dispatch(String(body.name ?? ""), Array.isArray(body.args) ? body.args : []);
}
