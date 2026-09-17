"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth/guards";

/**
 * Server action to fetch all students with their event names.
 */
async function getStudentsInternal() {
  const supabase = await createClient();

  // Fetch students, their associated event names and cards count
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      student_id,
      student_name,
      student_level,
      company_id,
      event_id,
      events!fk_students_event (
        event_name
      ),
      students_cards!fk_students_cards_student (
        count
      )
    `,
    )
    .order("student_name", { ascending: true });

  if (error) {
    console.error("Error fetching students:", error);
    // Fallback: try fetching without join if join fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("students")
      .select("*")
      .order("student_name", { ascending: true });

    if (fallbackError) return [];
    return fallbackData;
  }

  // Map the nested data to the format expected by the client
  return data.map((student) => ({
    ...student,
    event: student.events,
    cards_count: student.students_cards?.[0]?.count || 0,
  }));
}

export const getStudents = withRole(4, getStudentsInternal);

/**
 * Server action to fetch events for dropdown.
 */
async function getEventsInternal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("company_id, event_id, event_name")
    .order("event_name", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data;
}

export const getEvents = withRole(4, getEventsInternal);

/**
 * Server action to save a student (create or update).
 */
async function saveStudentInternal(formData: FormData, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

  const id = formData.get("id");
  const student_id = formData.get("student_id");
  const student_name = formData.get("student_name") as string;
  const student_level = formData.get("student_level") as string;
  const company_id = formData.get("company_id");
  const event_id = formData.get("event_id") as string;

  const studentData = {
    student_id: parseInt(student_id as string),
    student_name,
    student_level,
    company_id: parseInt(company_id as string),
    event_id,
    updated_at: new Date().toISOString(),
  };

  let error;
  let action: "INSERT" | "UPDATE" = id ? "UPDATE" : "INSERT";

  if (id) {
    const { error: updateError } = await supabase
      .from("students")
      .update(studentData)
      .eq("id", id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("students")
      .insert([studentData]);
    error = insertError;
  }

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: action,
      entity: "students",
      metadata: {
        student_name,
        student_id,
        student_level,
        event_id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true };
}

export const saveStudent = withRole(8, saveStudentInternal);

/**
 * Server action to delete a student.
 */
async function deleteStudentInternal(id: number, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

  // Get student details before deleting for the log
  const { data: student } = await supabase
    .from("students")
    .select("student_name, student_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE",
      entity: "students",
      metadata: {
        student_id: id,
        academic_id: student?.student_id,
        student_name: student?.student_name || "Unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true };
}

export const deleteStudent = withRole(8, deleteStudentInternal);

/**
 * Server action to import multiple students.
 */
async function importStudentsInternal(students: any[], context: { user: any }) {
  const { user } = context;
  // Se usa el cliente admin porque la importación hace UPSERT, que requiere
  // políticas de INSERT *y* UPDATE en RLS. El acceso ya está protegido a
  // nivel aplicación por withRole(8); el patrón coincide con gallery-actions.
  const supabase = createAdminClient();

  // Sanitizar: solo columnas reales de la tabla students. Un export JSON
  // incluye campos derivados (cards_count, event) que romperían el insert.
  const cleanedStudents = students.map((s) => ({
    student_id: parseInt(s.student_id) || 0,
    student_name: s.student_name,
    student_level: s.student_level,
    company_id: parseInt(s.company_id) || 0,
    event_id: s.event_id,
    updated_at: new Date().toISOString(),
  }));

  const invalid = cleanedStudents.some(
    (s) => !s.student_id || !s.student_name || !s.company_id || !s.event_id
  );
  if (invalid) {
    return { error: "Hay filas sin student_id, student_name, company_id o event_id válidos." };
  }

  // Contar cuántas filas ya existen para reportar nuevos vs. actualizados.
  const companyIds = [...new Set(cleanedStudents.map((s) => s.company_id))];
  const eventIds = [...new Set(cleanedStudents.map((s) => s.event_id))];
  const { data: existingRows } = await supabase
    .from("students")
    .select("company_id, event_id, student_id")
    .in("company_id", companyIds)
    .in("event_id", eventIds);

  const existingKeys = new Set(
    (existingRows || []).map(
      (r) => `${r.company_id}|${r.event_id}|${r.student_id}`
    )
  );
  const updatedCount = cleanedStudents.filter((s) =>
    existingKeys.has(`${s.company_id}|${s.event_id}|${s.student_id}`)
  ).length;
  const insertedCount = cleanedStudents.length - updatedCount;

  const { error } = await supabase.from("students").upsert(cleanedStudents, {
    onConflict: "company_id, event_id, student_id",
  });

  if (error) return { error: error.message };

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "IMPORT",
      entity: "students",
      metadata: {
        count: students.length,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true, inserted: insertedCount, updated: updatedCount };
}

export const importStudents = withRole(8, importStudentsInternal);

/**
 * Server action to log export activity.
 */
async function logExportActivityInternal(count: number, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "EXPORT",
      entity: "students",
      metadata: {
        count,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const logExportActivity = withRole(4, logExportActivityInternal);

/**
 * Server action to fetch cards assigned to a specific student.
 */
async function getStudentCardsInternal(
  studentId: number,
  companyId: number,
  eventId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students_cards")
    .select(
      `
      card_number,
      cards:cards!fk_students_cards_card (
        card_type,
        card_status,
        invoice_number,
        invoices:invoices (
          invoice_number,
          invoice_date,
          customer_name,
          customer_email,
          phone_area,
          phone_number,
          total_amount,
          payment_method,
          status
        )
      )
    `,
    )
    .eq("student_id", studentId)
    .eq("company_id", companyId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching student cards:", error);
    return [];
  }

  return data.map((item) => ({
    card_number: item.card_number,
    ...(item.cards as any),
  }));
}

export const getStudentCards = withRole(4, getStudentCardsInternal);

/**
 * Server action to assign a single card to a student.
 */
async function assignCardToStudentInternal(
  studentId: number,
  companyId: number,
  eventId: string,
  cardNumber: number,
  context: { user: any }
) {
  const { user } = context;
  const supabase = await createClient();

  // 1. Check if the card exists and is available
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("card_status")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber)
    .single();

  if (cardError || !card) {
    return { error: "El cartón no existe." };
  }

  if (card.card_status !== "Disponible") {
    return { error: `El cartón ya está ${card.card_status.toLowerCase()}.` };
  }

  // 2. Insert into students_cards
  const { error: assignError } = await supabase.from("students_cards").insert({
    student_id: studentId,
    company_id: companyId,
    event_id: eventId,
    card_number: cardNumber,
  });

  if (assignError) return { error: assignError.message };

  // 3. Update card status to 'Asignado'
  await supabase
    .from("cards")
    .update({ card_status: "Asignado", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber);

  // 4. Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "ASSIGN_CARD",
      entity: "students_cards",
      metadata: {
        student_id: studentId,
        card_number: cardNumber,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true };
}

export const assignCardToStudent = withRole(8, assignCardToStudentInternal);

/**
 * Server action to unassign a card from a student.
 */
async function unassignCardFromStudentInternal(
  studentId: number,
  companyId: number,
  eventId: string,
  cardNumber: number,
  context: { user: any }
) {
  const { user } = context;
  const supabase = await createClient();

  // 1. Delete from students_cards
  const { error: deleteError } = await supabase
    .from("students_cards")
    .delete()
    .eq("student_id", studentId)
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber);

  if (deleteError) return { error: deleteError.message };

  // 2. Restore card status to 'Disponible'
  await supabase
    .from("cards")
    .update({ card_status: "Disponible", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber);

  // 3. Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UNASSIGN_CARD",
      entity: "students_cards",
      metadata: {
        student_id: studentId,
        card_number: cardNumber,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true };
}

export const unassignCardFromStudent = withRole(8, unassignCardFromStudentInternal);

/**
 * Server action to bulk assign cards to students.
 */
async function bulkAssignCardsInternal(assignments: any[], context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

  if (!assignments || assignments.length === 0) {
    return { error: "No se proporcionaron asignaciones." };
  }

  // 1. Validar cada cartón antes de insertar
  for (const a of assignments) {
    const companyId = parseInt(a.company_id);
    const eventId = a.event_id;
    const cardNumber = parseInt(a.card_number);

    if (isNaN(companyId) || !eventId || isNaN(cardNumber)) {
      return {
        error: `Datos inválidos en una de las filas (Cartón: ${a.card_number}, Evento: ${a.event_id})`,
      };
    }

    // Verificar disponibilidad del cartón
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("card_status")
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .eq("card_number", cardNumber)
      .single();

    if (cardError || !card) {
      return {
        error: `El cartón ${cardNumber} no existe para el evento ${eventId}.`,
      };
    }

    if (card.card_status !== "Disponible") {
      return {
        error: `El cartón ${cardNumber} ya está ${card.card_status.toLowerCase()}.`,
      };
    }
  }

  // 2. Insertar en students_cards
  const { error: insertError } = await supabase.from("students_cards").insert(
    assignments.map((a) => ({
      student_id: parseInt(a.student_id),
      company_id: parseInt(a.company_id),
      event_id: a.event_id,
      card_number: parseInt(a.card_number),
    })),
  );

  if (insertError) return { error: insertError.message };

  // 3. Actualizar estado de los cartones a 'Asignado'
  for (const a of assignments) {
    await supabase
      .from("cards")
      .update({ card_status: "Asignado", updated_at: new Date().toISOString() })
      .eq("company_id", parseInt(a.company_id))
      .eq("event_id", a.event_id)
      .eq("card_number", parseInt(a.card_number));
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "BULK_ASSIGN_CARDS",
      entity: "students_cards",
      metadata: {
        count: assignments.length,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true };
}

export const bulkAssignCards = withRole(8, bulkAssignCardsInternal);

/**
 * Server action to fetch all assigned cards for download.
 */
async function getAllAssignedCardsInternal() {
  const supabase = await createClient();

  // Se consulta desde students con left join para incluir también a los
  // alumnos que no tienen ningún cartón asignado.
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      student_id,
      student_name,
      student_level,
      company_id,
      event_id,
      students_cards:students_cards!fk_students_cards_student (
        card_number,
        cards:cards!fk_students_cards_card (
          card_type,
          card_status
        )
      )
    `,
    )
    .order("event_id", { ascending: true })
    .order("student_id", { ascending: true });

  if (error) {
    console.error("Error fetching all assigned cards:", error);
    return [];
  }

  const rows: any[] = [];
  for (const s of data || []) {
    const cards = ((s as any).students_cards as any[]) || [];
    const base = {
      student_id: s.student_id,
      student_name: s.student_name,
      student_level: s.student_level,
      company_id: s.company_id,
      event_id: s.event_id,
    };

    if (cards.length === 0) {
      rows.push({
        ...base,
        card_number: "",
        card_type: "",
        card_status: "Sin asignar",
      });
    } else {
      cards.sort((a, b) => a.card_number - b.card_number);
      for (const c of cards) {
        rows.push({
          ...base,
          card_number: c.card_number,
          card_type: c.cards?.card_type,
          card_status: c.cards?.card_status,
        });
      }
    }
  }

  return rows;
}

export const getAllAssignedCards = withRole(4, getAllAssignedCardsInternal);

/**
 * Obtiene estadísticas de cartones de un evento: total, número máximo y
 * cantidad disponible. Sirve para validar rangos en la asignación.
 */
async function getEventCardsInfoInternal(companyId: number, eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select("card_number, card_status")
    .eq("company_id", companyId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event cards info:", error);
    return { error: error.message };
  }

  const max = (data || []).reduce((m, c) => Math.max(m, c.card_number), 0);
  const available = (data || []).filter(
    (c) => c.card_status === "Disponible",
  ).length;

  return { success: true, max, total: data?.length || 0, available };
}

export const getEventCardsInfo = withRole(4, getEventCardsInfoInternal);

/**
 * Asigna un rango de cartones [fromCard, toCard] a un alumno.
 * Valida que el rango exista en el evento, que ningún cartón esté asignado a
 * otro alumno y que todos estén disponibles antes de insertar.
 */
async function assignCardRangeToStudentInternal(
  studentId: number,
  companyId: number,
  eventId: string,
  fromCard: number,
  toCard: number,
  context: { user: any },
) {
  const { user } = context;
  const supabase = await createClient();

  if (isNaN(fromCard) || isNaN(toCard) || toCard < fromCard) {
    return {
      error: "El cartón 'hasta' debe ser igual o mayor que el cartón 'desde'.",
    };
  }

  // 1. El 'hasta' no puede superar el número de cartones del evento
  const { data: maxData } = await supabase
    .from("cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("card_number", { ascending: false })
    .limit(1);

  const maxCard = maxData?.[0]?.card_number || 0;
  if (toCard > maxCard) {
    return {
      error: `El cartón 'hasta' (${toCard}) supera el número de cartones del evento (máx. ${maxCard}).`,
    };
  }

  // 2. Verificar que todos los cartones del rango existan y estén disponibles
  const { data: cardsData, error: cardsError } = await supabase
    .from("cards")
    .select("card_number, card_status")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .gte("card_number", fromCard)
    .lte("card_number", toCard);

  if (cardsError) return { error: cardsError.message };

  const statusByNumber = new Map(
    (cardsData || []).map((c) => [c.card_number, c.card_status]),
  );
  const missing: number[] = [];
  const unavailable: number[] = [];
  for (let n = fromCard; n <= toCard; n++) {
    const status = statusByNumber.get(n);
    if (!status) missing.push(n);
    else if (status !== "Disponible") unavailable.push(n);
  }

  if (missing.length > 0) {
    return {
      error: `Los cartones ${missing.join(", ")} no existen en este evento.`,
    };
  }

  // 3. Verificar que ningún cartón del rango esté asignado a otro alumno
  const { data: assignedRows } = await supabase
    .from("students_cards")
    .select(
      `
      card_number,
      student_id,
      student:students!fk_students_cards_student (
        student_name
      )
    `,
    )
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .gte("card_number", fromCard)
    .lte("card_number", toCard);

  const assignedToOthers = (assignedRows || []).filter(
    (r) => r.student_id !== studentId,
  );
  if (assignedToOthers.length > 0) {
    const details = assignedToOthers
      .map(
        (r) =>
          `${r.card_number} → ID ${r.student_id} (${(r.student as any)?.student_name || "desconocido"})`,
      )
      .join(", ");
    return {
      error: `Cartones ya asignados a otros alumnos: ${details}.`,
    };
  }

  if (unavailable.length > 0) {
    return {
      error: `Los cartones ${unavailable.join(", ")} no están disponibles.`,
    };
  }

  // 4. Insertar solo los que aún no estén asignados a este mismo alumno
  const alreadyMine = new Set(
    (assignedRows || [])
      .filter((r) => r.student_id === studentId)
      .map((r) => r.card_number),
  );
  const toInsert = [];
  for (let n = fromCard; n <= toCard; n++) {
    if (!alreadyMine.has(n)) {
      toInsert.push({
        student_id: studentId,
        company_id: companyId,
        event_id: eventId,
        card_number: n,
      });
    }
  }

  if (toInsert.length === 0) {
    return {
      error: "Todos los cartones del rango ya están asignados a este alumno.",
    };
  }

  const { error: insertError } = await supabase
    .from("students_cards")
    .insert(toInsert);

  if (insertError) return { error: insertError.message };

  // 5. Marcar los cartones como 'Asignado'
  await supabase
    .from("cards")
    .update({ card_status: "Asignado", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .gte("card_number", fromCard)
    .lte("card_number", toCard);

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "ASSIGN_CARD_RANGE",
      entity: "students_cards",
      metadata: {
        student_id: studentId,
        company_id: companyId,
        event_id: eventId,
        from_card: fromCard,
        to_card: toCard,
        count: toInsert.length,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/students");
  return { success: true, count: toInsert.length };
}

export const assignCardRangeToStudent = withRole(
  8,
  assignCardRangeToStudentInternal,
);
