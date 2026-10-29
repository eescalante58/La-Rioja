import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { matriculaContactSubmissionSchema } from "@/lib/validation/matricula";
import { calculatePayloadHash } from "@/lib/matricula/matricula-service";

// Rate limiting simple en memoria por IP (máximo 5 solicitudes por cada 10 minutos)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

  const current = ipRateLimits.get(ip);
  if (!current || now > current.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // 1. Control de Rate Limiting por IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Demasiados intentos. Por favor espera unos minutos antes de volver a intentar." },
        { status: 429 }
      );
    }

    // 2. Parsear y validar el cuerpo de la petición
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: "Cuerpo de solicitud inválido." },
        { status: 400 }
      );
    }

    // 3. Honeypot check: si un bot llenó el campo oculto hp_field, rechazar silenciosamente con éxito simulado
    if (rawBody.hp_field) {
      return NextResponse.json({
        success: true,
        data: { id: "00000000-0000-0000-0000-000000000000" },
      });
    }

    const validation = matriculaContactSubmissionSchema.safeParse(rawBody);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        { success: false, error: `Datos inválidos: ${errorMsg}` },
        { status: 400 }
      );
    }

    const data = validation.data;
    const currentHash = calculatePayloadHash({
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      message: data.message,
    });

    const supabase = createAdminClient();

    // 4. Control de Idempotencia Completa
    if (data.idempotency_key) {
      const { data: existing } = await supabase
        .from("contact_submissions")
        .select("id, payload_hash")
        .eq("idempotency_key", data.idempotency_key)
        .maybeSingle();

      if (existing) {
        // Si el hash coincide, es un reintento idéntico legítimo -> retornar éxito con el mismo ID sin duplicar
        if (existing.payload_hash === currentHash) {
          return NextResponse.json({
            success: true,
            data: { id: existing.id },
          });
        }

        // Si la clave ya fue usada con datos DIFERENTES, rechazar por conflicto de idempotencia
        return NextResponse.json(
          {
            success: false,
            error: "La clave de idempotencia ya fue utilizada con datos diferentes.",
          },
          { status: 409 }
        );
      }
    }

    // 5. Inserción directa en public.contact_submissions (cero correos, target_email null)
    const { data: inserted, error: insertError } = await supabase
      .from("contact_submissions")
      .insert({
        name: data.name,
        email: data.email || "",
        phone: data.phone,
        type: data.type,
        message: data.message,
        attribution: data.attribution as Record<string, unknown> | null,
        idempotency_key: data.idempotency_key || null,
        payload_hash: currentHash,
        target_email: null,
      })
      .select("id")
      .single();

    if (insertError) {
      // Manejar condición de carrera si dos peticiones idénticas llegaron en paralelo
      if (insertError.code === "23505" && data.idempotency_key) {
        const { data: raceExisting } = await supabase
          .from("contact_submissions")
          .select("id, payload_hash")
          .eq("idempotency_key", data.idempotency_key)
          .maybeSingle();

        if (raceExisting && raceExisting.payload_hash === currentHash) {
          return NextResponse.json({
            success: true,
            data: { id: raceExisting.id },
          });
        }
      }

      console.error("Error al persistir solicitud de matrícula:", insertError);
      return NextResponse.json(
        { success: false, error: "No se pudo guardar la solicitud. Por favor intenta nuevamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: inserted.id },
    });
  } catch (error) {
    console.error("Error interno en /api/public/matricula/contact:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
