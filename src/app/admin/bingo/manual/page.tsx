"use client";

import React from "react";
import {
  Card,
  Title,
  Text,
  Divider,
  Grid,
  Flex,
  Badge,
} from "@tremor/react";
import {
  Calendar,
  Ticket,
  TrendingUp,
  Users,
  Dices,
  Info,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Monitor,
  History,
  Send,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  MousePointerClick,
  ShieldCheck,
  RotateCcw,
  Volume2,
  Maximize,
  FileText,
} from "lucide-react";
import Image from "next/image";

/**
 * Manual de Usuario: Gestión de Bingo.
 * Documenta las 5 pestañas del módulo en su orden visual:
 * Eventos → Inventario → Ventas → Promocional → Sorteos/Juegos.
 */
export default function BingoManualPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 pt-10">
        <div className="inline-flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
          <Image
            src="/logo.png"
            alt="La Rioja Logo"
            width={180}
            height={180}
            className="object-contain"
          />
        </div>
        <Title className="text-3xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
          Manual de Usuario: Gestión de Bingo
        </Title>
        <Text className="text-lg text-slate-500 max-w-2xl mx-auto">
          Guía operativa de las pestañas del módulo de Bingo: eventos,
          inventario, facturación, promoción y sorteos en vivo.
        </Text>
      </div>

      <Divider />

      {/* ============ 1. EVENTOS ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">1</Badge>
          <Title className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-larioja-azul" /> Pestaña: Eventos
          </Title>
        </div>

        <Card className="space-y-4">
          <Text>
            Punto de partida del módulo. Aquí se crean y administran los
            eventos de bingo (nombre, fecha, valor del cartón, meta y estado).
          </Text>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 font-bold">Función</th>
                  <th className="py-2 font-bold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Plus size={14} className="inline mr-1" /> Nuevo Evento
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Botón azul superior. Abre el formulario de creación con
                    nombre, fecha, valor del cartón, cantidad de cartones,
                    estado, meta económica, gestor responsable y fecha de
                    inicio de promoción.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Ticket size={14} className="inline mr-1" /> Generar Cartones
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Icono de ticket en cada fila. Permite definir el rango
                    (desde/hasta), tipo (Físico/Virtual) y precio, y luego
                    cargar los PDF de los cartones al almacenamiento.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Edit size={14} className="inline mr-1" /> Editar
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Modifica los datos del evento seleccionado.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Trash2 size={14} className="inline mr-1" /> Eliminar
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Elimina el evento (pide confirmación).{" "}
                    <strong className="text-rose-600">
                      No se puede deshacer
                    </strong>
                    : borra sus cartones y configuraciones asociadas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
            <Text className="text-sm font-bold text-blue-800 dark:text-blue-300">
              💡 El estado del evento se muestra con color: verde Activo, azul
              Realizado/Cerrado, rojo Cancelado.
            </Text>
          </div>
        </Card>
      </section>

      {/* ============ 2. INVENTARIO ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">2</Badge>
          <Title className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="text-larioja-azul" /> Pestaña: Inventario de
            Cartones
          </Title>
        </div>

        <Card className="space-y-4">
          <Text>
            Muestra una tarjeta por evento con su total de cartones.{" "}
            <strong>Ver Detalles</strong> abre el inventario completo;
            <strong> Cargar Cartones</strong> lanza el flujo de
            generación/carga de PDF directamente.
          </Text>

          <Title className="text-lg">Ventana "Inventario de Cartones"</Title>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 font-bold">Función</th>
                  <th className="py-2 font-bold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Search size={14} className="inline mr-1" /> Buscador
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Con <strong>números cortos (1–7 dígitos)</strong> busca
                    solo en N° de cartón y N° de factura. Con 8+ dígitos o
                    texto busca además en jugador, teléfono, vendedor, tipo y
                    estado.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <FileText size={14} className="inline mr-1" /> Informe
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    <strong>Informe de Cartones por Estado</strong>: selecciona
                    el estado (Disponible, Asignado, Vendido, Reservado,
                    Donado, Anulado o Todos) y un rango de cartones. Genera
                    CSV o PDF con vista previa. En cartones{" "}
                    <strong>Asignados</strong> la columna Cliente muestra el{" "}
                    <strong>nombre y nivel del alumno</strong>.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <UserCheck size={14} className="inline mr-1" /> Reasignar
                    Jugador
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Cambia <strong>nombre y teléfono del jugador</strong> en un
                    rango (Cartón Desde / Hasta). Muestra la vista previa con
                    el nombre y teléfono actuales de esos cartones, selector de
                    código de área con banderas, y exige el nombre del
                    funcionario que autoriza. Queda auditado.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <RefreshCw size={14} className="inline mr-1" /> Cambio en
                    Rango
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Cambia masivamente el <strong>tipo</strong> de cartón
                    (Virtual ↔ Físico) en un rango. Requiere funcionario
                    autorizante.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <RefreshCw size={14} className="inline mr-1" /> Cambio de
                    tipo (por fila)
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Icono junto al badge del tipo: alterna ese cartón entre
                    Físico y Virtual.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Eye size={14} className="inline mr-1" /> Ver PDF
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Abre la imagen/PDF del cartón en pestaña nueva (solo si
                    tiene archivo cargado).
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Edit size={14} className="inline mr-1" /> Editar Cartón
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Edita un solo cartón: nombre del jugador, teléfono con
                    código de área, correo y estado (Disponible, Vendido,
                    Asignado, Reservado, Donado, Anulado).
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <RefreshCw size={14} className="inline mr-1" /> Recargar
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Icono junto al badge de totales: fuerza la recarga del
                    inventario desde el servidor (el inventario queda en caché
                    por evento para abrir al instante).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500 space-y-1">
            <Text className="text-sm font-bold text-blue-800 dark:text-blue-300">
              💡 Rendimiento y navegación del inventario:
            </Text>
            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>
                <strong>Paginación</strong>: la tabla muestra{" "}
                <strong>100 cartones por página</strong> con flechas ←/→ y la
                leyenda "Mostrando X–Y de N". El buscador filtra sobre el
                inventario completo y vuelve a la página 1.
              </li>
              <li>
                <strong>Encabezado fijo</strong>: los títulos de columna
                permanecen visibles al hacer scroll dentro de la tabla.
              </li>
              <li>
                <strong>Columna "Jugador"</strong>: en cartones con estado{" "}
                <strong>Asignado</strong> muestra el{" "}
                <strong>nombre y nivel del alumno</strong> (ej. "Sebastian
                Arrieta · 2.Inicial") en lugar del comprador.
              </li>
            </ul>
          </div>
        </Card>
      </section>

      {/* ============ 3. VENTAS ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">3</Badge>
          <Title className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="text-larioja-azul" /> Pestaña: Ventas y
            Facturación
          </Title>
        </div>

        <Card className="space-y-4">
          <Text>
            Núcleo operativo del día del evento: registro rápido de ventas
            mientras los compradores hacen cola. El selector de evento se
            preselecciona automáticamente con el{" "}
            <strong>evento por defecto</strong> configurado en la empresa.
          </Text>

          <Title className="text-lg">Botones superiores</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>Nueva Factura Plus</strong>: único punto de creación de
              facturas (el formulario clásico "Nueva Factura" fue retirado; el
              lápiz ✏️ de la tabla sigue editando facturas existentes).
            </li>
            <li>
              <Ticket size={14} className="inline mx-1" />
              <strong>Inventario</strong>: abre el{" "}
              <strong>Inventario de Cartones</strong> del evento seleccionado
              como ventana superpuesta. Al cerrarlo regresa a esta pestaña con
              todo intacto.
            </li>
            <li>
              <FileText size={14} className="inline mx-1" />
              <strong>Informe por Fecha</strong>: reporte de facturas por día.
              La fecha se elige de una{" "}
              <strong>lista de fechas con facturas del evento</strong> (cada
              opción muestra su conteo). Columnas: N° Factura, Fecha, Cliente,
              WhatsApp, Gestor, Método de Pago, N° Cartones, Valor Cartón,
              Total y Estado — ordenado por número de factura. Salidas:{" "}
              <strong>CSV</strong>, <strong>PDF</strong> y{" "}
              <strong>vista previa</strong> en pestaña nueva. El encabezado
              del PDF jerarquiza: evento → ID → fecha → totales
              (facturas/cartones/ventas) <strong>+ desglose por método de
              pago</strong>.
            </li>
          </ul>

          <Title className="text-lg">Totales del día</Title>
          <Text className="text-sm text-slate-600 dark:text-slate-300">
            Tres chips junto al título:{" "}
            <Badge size="xs" color="blue">Facturas hoy</Badge>{" "}
            <Badge size="xs" color="emerald">Cartones hoy</Badge>{" "}
            <Badge size="xs" color="amber">$ Total hoy</Badge>. Se calculan
            por la <strong>fecha/hora real de registro</strong> de la factura
            (no por la fecha del documento).
          </Text>

          <Title className="text-lg">Nueva Factura Plus</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>N° de Factura</strong>: se autogenera; puede
              sobrescribirse.
            </li>
            <li>
              <strong>Cliente, Email, Observación</strong> y{" "}
              <strong>Teléfono/WhatsApp</strong> con{" "}
              <strong>Código de Área</strong>: al enfocar el campo se
              despliega la <strong>lista completa de países</strong> ordenada
              alfabéticamente (bandera + código + nombre); al escribir dígitos
              filtra por código. Por defecto{" "}
              <strong>+503 El Salvador</strong>; para códigos compartidos
              (ej. +1) se preselecciona Estados Unidos y la bandera elegida se
              respeta.
            </li>
            <li>
              <strong>Rango de cartones</strong>: el sistema verifica
              disponibilidad antes de guardar.
            </li>
            <li>
              <strong>Vendido por</strong>: lista de gestores/vendedores del
              evento.
            </li>
            <li>
              <Ticket size={14} className="inline mx-1" />
              <strong>Inventario</strong> (encabezado del formulario): abre el
              inventario del evento <strong>sin cerrar la factura</strong>; al
              volver, los datos capturados siguen intactos. Si presiona{" "}
              <strong>Salir</strong> con el inventario abierto, ambas ventanas
              se cierran.
            </li>
            <li>
              <strong>Imagen de Factura</strong>: adjunta el comprobante
              escaneado.
            </li>
            <li>
              <strong>[Guardar Factura]</strong> registra y limpia el
              formulario para la siguiente venta;{" "}
              <strong>[Cancelar]</strong> borra todos los campos (incluidos
              email y archivo) sin cerrar; <strong>[Salir]</strong> cierra el
              formulario.
            </li>
          </ul>

          <Title className="text-lg">Tabla de facturas</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>Orden</strong>: la más reciente primero (por fecha/hora
              real de registro, <code>created_at</code> descendente), para ver
              de inmediato la última venta.
            </li>
            <li>
              <strong>Buscador</strong>: por N° factura, cliente, gestor,
              teléfono, email o monto.
            </li>
            <li>
              <Eye size={14} className="inline mx-1" />
              <strong>Consulta</strong>: ficha completa de solo lectura, sin
              scroll.
            </li>
            <li>
              <Edit size={14} className="inline mx-1" />
              <strong>Editar</strong>: modifica datos y cartones de la
              factura.
            </li>
            <li>
              <Smartphone size={14} className="inline mx-1" />
              <strong>WhatsApp</strong>: envía el resumen de la factura al
              cliente (icono por fila).
            </li>
            <li>
              <Trash2 size={14} className="inline mx-1" />
              <strong>Eliminar</strong>: borra la factura y libera sus
              cartones.
            </li>
          </ul>
        </Card>
      </section>

      {/* ============ 4. PROMOCIONAL ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">4</Badge>
          <Title className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-larioja-azul" /> Pestaña: Mensajes
            Promocionales
          </Title>
        </div>

        <Card className="space-y-4">
          <Title className="text-lg">Columna Clientes (izquierda)</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>Marcar Todos / selección individual</strong>: define a
              quiénes se enviará el mensaje.
            </li>
            <li>
              <strong>Buscar</strong> por nombre o teléfono.
            </li>
            <li>
              <strong>Exportar</strong>: iconos de descarga CSV y JSON.
            </li>
            <li>
              <strong>Sincronizar desde Ventas</strong> (
              <RefreshCw size={14} className="inline" />): importa clientes
              desde las facturas y cartones vendidos del evento por defecto.
            </li>
            <li>
              <strong>Añadir / Editar / Eliminar</strong> cliente
              individualmente.
            </li>
          </ul>

          <Title className="text-lg">Envío Masivo (derecha)</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>Seleccionar Plantilla</strong>: carga el texto e imagen
              predefinidos (se administran en el CMS).
            </li>
            <li>
              <strong>Imagen del Mensaje</strong>: subir o quitar la imagen
              adjunta al WhatsApp.
            </li>
            <li>
              <strong>Vista previa</strong> del mensaje antes de enviar.
            </li>
            <li>
              <Send size={14} className="inline mx-1" />
              <strong>Enviar mensaje</strong>: dispara el envío masivo por
              WhatsApp con progreso en vivo (enviados/total).
            </li>
          </ul>

          <Title className="text-lg">Historial de Envíos Masivos</Title>
          <Text className="text-sm text-slate-600 dark:text-slate-300">
            Registro de cada campaña: fecha, cantidad de destinatarios,
            éxitos y errores. Cada lote permite abrir el{" "}
            <strong>detalle por destinatario</strong>.
          </Text>
        </Card>
      </section>

      {/* ============ 5. SORTEOS/JUEGOS ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">5</Badge>
          <Title className="text-2xl font-bold flex items-center gap-2">
            <Dices className="text-larioja-azul" /> Pestaña: Sorteos/Juegos
          </Title>
        </div>

        <Card className="space-y-4">
          <Text>
            Configuración de las ruletas del evento. El selector de evento
            también usa el <strong>evento por defecto</strong> de la empresa.
          </Text>

          <Title className="text-lg">Modos de ruleta</Title>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <Badge size="xs" color="amber">Premios</Badge> Ruleta de premios
              proyectada en <strong>/ruleta</strong>. Sus segmentos se editan
              manualmente.
            </li>
            <li>
              <Badge size="xs" color="blue">Cartones</Badge> Tómbola cuyos
              segmentos son los <strong>cartones vendidos</strong> (automático);
              se proyecta en <strong>/tombola</strong>.
            </li>
            <li>
              <Badge size="xs" color="purple">Participantes</Badge> Tómbola con
              cartones registrados por el público vía{" "}
              <strong>/registro</strong>.
            </li>
          </ul>

          <Title className="text-lg">Acciones por ruleta</Title>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 font-bold">Botón</th>
                  <th className="py-2 font-bold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <History size={14} className="inline mr-1" /> Historial
                    General
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Botón en el encabezado de la pestaña. Consulta{" "}
                    <strong>todos los giros del evento</strong> (todas las
                    ruletas y tómbolas) con una columna <em>Juego</em> que
                    identifica de cuál salió cada resultado.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    Nueva Ruleta
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Crea una ruleta: nombre, modo, giro manual o{" "}
                    <strong>automático</strong> (con segundos de espera) y{" "}
                    <strong>número máximo de premios</strong> (
                    <code>0</code> = sin límite; el contador se basa en el
                    historial y <em>no se reinicia</em> al recargar stock).
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    Editar/Ver Segmentos
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Mantiene los segmentos (nombre, color, stock inicial y
                    actual en <strong>negrita</strong>, activo, eliminar). El
                    área de segmentos muestra los <strong>primeros 7 sin
                    scroll</strong>; los demás se alcanzan con scroll interno.
                    En modo Premios incluye el bloque{" "}
                    <strong>"Segmentos sin derecho a premio"</strong>: se
                    indican cantidad y texto, y el sistema los distribuye
                    aleatoriamente <em>sin que queden adyacentes</em>. Desde
                    aquí también se abre la página pública (
                    <strong>Abrir Ruleta / Abrir Tómbola</strong>).
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    Datos
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Edita nombre y tipo de la ruleta.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    Publicar / Ocultar
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Activa o retira la ruleta de las páginas públicas. Solo una
                    tómbola "Participantes" publicada habilita el registro
                    público.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Monitor size={14} className="inline mr-1" /> Monitorear
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    (Solo Cartones/Participantes) Abre{" "}
                    <strong>/tombola/monitor</strong>: panel de resultados en
                    tiempo real para el staff.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <History size={14} className="inline mr-1" /> Historial
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Lista de giros de esa ruleta con su resultado. Incluye la
                    columna <strong>Integridad</strong>: badge{" "}
                    <em>Verificado</em> con el hash SHA-256 que firma el
                    registro (los giros anteriores a la mejora se marcan{" "}
                    <em>Legacy</em>).
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                    <Trash2 size={14} className="inline mr-1" /> Eliminar
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    Borra la ruleta y sus segmentos (con confirmación).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border-l-4 border-amber-500 space-y-2">
            <Text className="text-sm font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="inline mr-1" />
              Contador y fin del sorteo:
            </Text>
            <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800 dark:text-amber-300">
              <li>
                <strong>"Premios sorteados: X de Y"</strong> solo incrementa
                cuando sale un premio real. Los segmentos{" "}
                <em>sin derecho a premio</em> (ej. "Sigue participando") no
                consumen stock ni mueven el contador.
              </li>
              <li>
                Al llegar al límite configurado, la ruleta muestra la alerta y
                el indicador rojo pulsante <strong>"SORTEO FINALIZADO"</strong>;
                también finaliza si solo quedan segmentos sin premio.
              </li>
              <li>
                <strong>Recargar stock no reactiva</strong> una ruleta
                finalizada: el límite cuenta los premios del historial. Para
                una nueva ronda, amplíe el <em>Número de premios</em> en{" "}
                <strong>Datos</strong> (ej. de 7 a 14) o póngalo en{" "}
                <code>0</code> para operar solo por stock.
              </li>
              <li>
                <ShieldCheck size={14} className="inline mr-1" />
                <strong>Aleatoriedad criptográfica</strong>: el ganador lo
                decide el servidor con <code>crypto.randomInt</code> y{" "}
                <strong>probabilidad ponderada por stock</strong> (un premio
                con stock 10 tiene 10 veces más probabilidad que uno con 1 en
                el mismo giro). Cada giro queda firmado con un hash de
                verificación.
              </li>
            </ul>
          </div>
        </Card>
      </section>

      {/* ============ PÁGINAS PÚBLICAS ============ */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            <BookOpen size={16} />
          </Badge>
          <Title className="text-2xl font-bold">Páginas Públicas del Evento</Title>
        </div>
        <Grid numItems={1} numItemsSm={3} className="gap-4">
          <Card className="p-4 space-y-2">
            <Title className="text-sm font-bold text-larioja-azul">
              /registro
            </Title>
            <Text className="text-xs text-slate-600 dark:text-slate-300">
              Formulario público para que los asistentes registren sus números
              de cartón. Requiere una tómbola "Participantes" publicada. Con{" "}
              <code>?id=&lt;wheel_id&gt;</code> fija una ruleta específica.
            </Text>
          </Card>
          <Card className="p-4 space-y-2">
            <Title className="text-sm font-bold text-larioja-azul">
              /ruleta
            </Title>
            <Text className="text-xs text-slate-600 dark:text-slate-300">
              Ruleta de premios para proyectar. Acepta{" "}
              <code>?evento=&lt;id&gt;&amp;nombre=&lt;ruleta&gt;</code>. El logo
              de La Rioja lleva a la consola admin. Controles flotantes:{" "}
              <RotateCcw size={12} className="inline" /> refresco (F5),{" "}
              <Volume2 size={12} className="inline" /> sonido y{" "}
              <Maximize size={12} className="inline" /> pantalla completa.
            </Text>
          </Card>
          <Card className="p-4 space-y-2">
            <Title className="text-sm font-bold text-larioja-azul">
              /tombola
            </Title>
            <Text className="text-xs text-slate-600 dark:text-slate-300">
              Tómbola de cartones/participantes para proyectar. Mismos
              parámetros de URL y los mismos controles (refresco, sonido,
              pantalla completa) que la ruleta; incluye{" "}
              <code>/tombola/monitor</code> para el staff.
            </Text>
          </Card>
        </Grid>
      </section>

      <Divider />

      {/* Footer / Tips */}
      <Card className="bg-larioja-azul text-white p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Info className="text-larioja-amarillo" size={32} />
          <Title className="text-white text-2xl">Tips Operativos</Title>
        </div>
        <Grid numItems={1} numItemsSm={3} className="gap-8">
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <MousePointerClick className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Sin recargas</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              Todas las operaciones son instantáneas (JSON). Nunca necesita
              recargar la página tras guardar o eliminar.
            </Text>
          </div>
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <CheckCircle2 className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Auditoría</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              Los cambios masivos (tipo, jugador, cargas) quedan registrados
              con el funcionario que los autorizó.
            </Text>
          </div>
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <Monitor className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Proyección</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              En la pantalla proyectada, el logo de La Rioja es un acceso
              directo a esta consola para el operador.
            </Text>
          </div>
        </Grid>
      </Card>
    </div>
  );
}
