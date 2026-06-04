"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all students with their event names.
 */
export async function getStudents() {
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

/**
 * Server action to fetch events for dropdown.
 */
export async function getEvents() {
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

/**
 * Server action to save a student (create or update).
 */
export async function saveStudent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to delete a student.
 */
export async function deleteStudent(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to import multiple students.
 */
export async function importStudents(students: any[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Clean data for import (remove id to let db generate it)
  const cleanedStudents = students.map(({ id, event, ...rest }) => ({
    ...rest,
    updated_at: new Date().toISOString(),
  }));

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
  return { success: true };
}

/**
 * Server action to log export activity.
 */
export async function logExportActivity(count: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to fetch cards assigned to a specific student.
 */
export async function getStudentCards(
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

/**
 * Server action to assign a single card to a student.
 */
export async function assignCardToStudent(
  studentId: number,
  companyId: number,
  eventId: string,
  cardNumber: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to unassign a card from a student.
 */
export async function unassignCardFromStudent(
  studentId: number,
  companyId: number,
  eventId: string,
  cardNumber: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to bulk assign cards to students.
 */
export async function bulkAssignCards(assignments: any[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Server action to fetch all assigned cards for download.
 */
export async function getAllAssignedCards() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("students_cards").select(`
      card_number,
      company_id,
      event_id,
      student:students!fk_students_cards_student (
        student_name,
        student_level
      )
    `);

  if (error) {
    console.error("Error fetching all assigned cards:", error);
    return [];
  }

  return data.map((item) => ({
    card_number: item.card_number,
    company_id: item.company_id,
    event_id: item.event_id,
    student_name: (item.student as any)?.student_name,
    student_level: (item.student as any)?.student_level,
  }));
}
