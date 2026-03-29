import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sql } from "@/db";
import { authMiddleware } from "@/middleware/auth";
import { generarPdfBitacora } from "@/lib/pdf";
import { createHash } from "crypto";
import type { JwtPayload } from "@/lib/jwt";

const app = new Hono<{
  Variables: {
    tecnico: JwtPayload
  }
}>();

// Validación para exportación de bitácoras
const schemaExportarBitacoras = z.object({
  tecnico_id: z.string().uuid().optional(),
  mes: z.string().optional(),
  anio: z.number().optional(),
  estado: z.enum(["borrador", "cerrada"]).optional(),
  tipo: z.enum(["beneficiario", "actividad"]).optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
  formato: z.enum(["pdf", "excel", "csv"]).default("pdf")
});

// Validación para gestión avanzada de bitácoras
const schemaGestionBitacoras = z.object({
  accion: z.enum(["cerrar", "reabrir", "eliminar", "duplicar"]),
  ids: z.array(z.string().uuid()),
  observaciones: z.string().optional()
});

app.use("*", authMiddleware);

// Exportar bitácoras
app.post("/exportar", zValidator("json", schemaExportarBitacoras), async (c) => {
  const tecnico = c.get("tecnico");
  const body = c.req.valid("json");
  
  // Construir consulta base
  let query = sql`
    SELECT b.*, 
           u.nombre as tecnico_nombre,
           be.nombre as beneficiario_nombre,
           be.municipio as beneficiario_municipio,
           be.localidad as beneficiario_localidad,
           a.nombre as actividad_nombre,
           cp.nombre as cadena_productiva_nombre
    FROM bitacoras b
    JOIN usuarios u ON b.tecnico_id = u.id
    LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
    LEFT JOIN actividades a ON b.actividad_id = a.id
    LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
    WHERE 1=1
  `;
  
  // Filtros según rol
  if (tecnico.rol === "tecnico") {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tecnico_id = ${tecnico.sub}
    `;
  } else if (tecnico.rol === "coordinador") {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE (b.tecnico_id = ${tecnico.sub} OR u.coordinador_id = ${tecnico.sub})
    `;
  }
  
  // Filtros adicionales
  if (body.tecnico_id) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tecnico_id = ${body.tecnico_id}
    `;
  }
  
  if (body.mes && body.anio) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE EXTRACT(MONTH FROM b.fecha_inicio) = ${Number(body.mes)} AND EXTRACT(YEAR FROM b.fecha_inicio) = ${body.anio}
    `;
  }
  
  if (body.estado) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.estado = ${body.estado}
    `;
  }
  
  if (body.tipo) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tipo = ${body.tipo}
    `;
  }
  
  if (body.desde) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.fecha_inicio >= ${body.desde}
    `;
  }
  
  if (body.hasta) {
    query = sql`
      SELECT b.*, 
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             be.localidad as beneficiario_localidad,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.fecha_fin <= ${body.hasta}
    `;
  }
  
  const bitacoras = await query;
  
  if (body.formato === "pdf") {
    // Generar PDF consolidado
    const pdfBytes = await generarPdfBitacora({
      id: "export",
      tecnico_id: tecnico.sub,
      tipo: "beneficiario",
      estado: "cerrada",
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date().toISOString(),
      observaciones_coordinador: "Exportación masiva de bitácoras",
      actividades_desc: "Exportación de bitácoras",
      recomendaciones: "Exportación realizada por " + tecnico.rol,
      comentarios_beneficiario: "",
      foto_rostro_url: "",
      firma_url: "",
      fotos_campo: [],
      pdf_version: 1,
      pdf_url_actual: "",
      pdf_original_url: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      beneficiario_id: null,
      cadena_productiva_id: null,
      actividad_id: null,
      coord_inicio: "",
      coord_fin: "",
      sync_id: null
    });
    
    return c.json({
      formato: "pdf",
      total: bitacoras.length,
      bitacoras: bitacoras.map(b => ({
        id: b.id,
        tecnico: b.tecnico_nombre,
        tipo: b.tipo,
        estado: b.estado,
        fecha_inicio: b.fecha_inicio,
        fecha_fin: b.fecha_fin,
        beneficiario: b.beneficiario_nombre,
        actividad: b.actividad_nombre,
        cadena_productiva: b.cadena_productiva_nombre
      }))
    });
  } else if (body.formato === "excel" || body.formato === "csv") {
    // Retornar datos para exportación
    return c.json({
      formato: body.formato,
      total: bitacoras.length,
      datos: bitacoras.map(b => ({
        id: b.id,
        tecnico: b.tecnico_nombre,
        tipo: b.tipo,
        estado: b.estado,
        fecha_inicio: b.fecha_inicio,
        fecha_fin: b.fecha_fin,
        beneficiario: b.beneficiario_nombre,
        beneficiario_municipio: b.beneficiario_municipio,
        beneficiario_localidad: b.beneficiario_localidad,
        actividad: b.actividad_nombre,
        cadena_productiva: b.cadena_productiva_nombre,
        observaciones: b.observaciones_coordinador,
        actividades: b.actividades_desc,
        recomendaciones: b.recomendaciones
      }))
    });
  }
  
  return c.json({ error: "Formato no soportado" }, 400);
});

// Gestionar múltiples bitácoras
app.post("/gestion", zValidator("json", schemaGestionBitacoras), async (c) => {
  const tecnico = c.get("tecnico");
  const body = c.req.valid("json");
  
  const resultados: { id: string; exito: boolean; error?: string }[] = [];
  
  for (const id of body.ids) {
    try {
      let exito = false;
      let error = "";
      
      if (body.accion === "cerrar") {
        // Verificar permisos para cerrar
        const [bitacora] = await sql`
          SELECT b.id, b.estado, b.tecnico_id, u.coordinador_id
          FROM bitacoras b
          JOIN usuarios u ON b.tecnico_id = u.id
          WHERE b.id = ${id}
        `;
        
        if (!bitacora) {
          error = "Bitácora no encontrada";
        } else if (bitacora.estado !== "borrador") {
          error = "Solo se pueden cerrar bitácoras en borrador";
        } else if (tecnico.rol === "tecnico" && bitacora.tecnico_id !== tecnico.sub) {
          error = "No puedes cerrar bitácoras de otros técnicos";
        } else if (tecnico.rol === "coordinador" && bitacora.coordinador_id !== tecnico.sub) {
          error = "No puedes cerrar bitácoras de técnicos que no están a tu cargo";
        } else {
          await sql`
            UPDATE bitacoras SET 
              estado = 'cerrada',
              observaciones_coordinador = COALESCE(${body.observaciones || null}, observaciones_coordinador),
              updated_at = NOW()
            WHERE id = ${id}
          `;
          exito = true;
        }
      } else if (body.accion === "reabrir") {
        // Verificar permisos para reabrir
        const [bitacora] = await sql`
          SELECT b.id, b.estado, b.tecnico_id, u.coordinador_id
          FROM bitacoras b
          JOIN usuarios u ON b.tecnico_id = u.id
          WHERE b.id = ${id}
        `;
        
        if (!bitacora) {
          error = "Bitácora no encontrada";
        } else if (bitacora.estado !== "cerrada") {
          error = "Solo se pueden reabrir bitácoras cerradas";
        } else if (tecnico.rol === "tecnico" && bitacora.tecnico_id !== tecnico.sub) {
          error = "No puedes reabrir bitácoras de otros técnicos";
        } else if (tecnico.rol === "coordinador" && bitacora.coordinador_id !== tecnico.sub) {
          error = "No puedes reabrir bitácoras de técnicos que no están a tu cargo";
        } else {
          await sql`
            UPDATE bitacoras SET 
              estado = 'borrador',
              updated_at = NOW()
            WHERE id = ${id}
          `;
          exito = true;
        }
      } else if (body.accion === "eliminar") {
        // Verificar permisos para eliminar
        const [bitacora] = await sql`
          SELECT b.id, b.estado, b.tecnico_id, u.coordinador_id
          FROM bitacoras b
          JOIN usuarios u ON b.tecnico_id = u.id
          WHERE b.id = ${id}
        `;
        
        if (!bitacora) {
          error = "Bitácora no encontrada";
        } else if (bitacora.estado === "cerrada" && tecnico.rol !== "administrador") {
          error = "Solo los administradores pueden eliminar bitácoras cerradas";
        } else if (tecnico.rol === "tecnico" && bitacora.tecnico_id !== tecnico.sub) {
          error = "No puedes eliminar bitácoras de otros técnicos";
        } else if (tecnico.rol === "coordinador" && bitacora.coordinador_id !== tecnico.sub) {
          error = "No puedes eliminar bitácoras de técnicos que no están a tu cargo";
        } else {
          await sql`DELETE FROM bitacoras WHERE id = ${id}`;
          exito = true;
        }
      } else if (body.accion === "duplicar") {
        // Verificar permisos para duplicar
        const [bitacora] = await sql`
          SELECT * FROM bitacoras WHERE id = ${id}
        `;
        
        if (!bitacora) {
          error = "Bitácora no encontrada";
        } else {
          // Crear nueva bitácora basada en la existente
          const [duplicada] = await sql`
            INSERT INTO bitacoras (
              tecnico_id, tipo, estado, fecha_inicio, coord_inicio,
              beneficiario_id, cadena_productiva_id, actividad_id,
              observaciones_coordinador, actividades_desc, recomendaciones,
              comentarios_beneficiario, foto_rostro_url, firma_url, fotos_campo
            ) VALUES (
              ${bitacora.tecnico_id}, ${bitacora.tipo}, 'borrador', NOW(), ${bitacora.coord_inicio},
              ${bitacora.beneficiario_id}, ${bitacora.cadena_productiva_id}, ${bitacora.actividad_id},
              ${body.observaciones || null}, ${bitacora.actividades_desc}, ${bitacora.recomendaciones},
              ${bitacora.comentarios_beneficiario}, ${bitacora.foto_rostro_url}, ${bitacora.firma_url}, ${JSON.stringify([])}
            )
            RETURNING id
          `;
          exito = true;
        }
      }
      
      resultados.push({
        id,
        exito,
        error: error || undefined
      });
    } catch (err) {
      resultados.push({
        id,
        exito: false,
        error: err instanceof Error ? err.message : "Error desconocido"
      });
    }
  }
  
  return c.json({
    accion: body.accion,
    resultados,
    exitosos: resultados.filter(r => r.exito).length,
    fallidos: resultados.filter(r => !r.exito).length
  });
});

// Obtener estadísticas de bitácoras
app.get("/estadisticas", async (c) => {
  const tecnico = c.get("tecnico");
  const { mes, anio } = c.req.query();
  
  // Construir consulta base
  let query = sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borrador,
      COUNT(CASE WHEN estado = 'cerrada' THEN 1 END) as cerrada,
      COUNT(CASE WHEN tipo = 'beneficiario' THEN 1 END) as beneficiario,
      COUNT(CASE WHEN tipo = 'actividad' THEN 1 END) as actividad,
      AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))/3600) as horas_promedio
    FROM bitacoras b
    JOIN usuarios u ON b.tecnico_id = u.id
    WHERE 1=1
  `;
  
  // Filtros según rol
  if (tecnico.rol === "tecnico") {
    query = sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borrador,
        COUNT(CASE WHEN estado = 'cerrada' THEN 1 END) as cerrada,
        COUNT(CASE WHEN tipo = 'beneficiario' THEN 1 END) as beneficiario,
        COUNT(CASE WHEN tipo = 'actividad' THEN 1 END) as actividad,
        AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))/3600) as horas_promedio
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      WHERE b.tecnico_id = ${tecnico.sub}
    `;
  } else if (tecnico.rol === "coordinador") {
    query = sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borrador,
        COUNT(CASE WHEN estado = 'cerrada' THEN 1 END) as cerrada,
        COUNT(CASE WHEN tipo = 'beneficiario' THEN 1 END) as beneficiario,
        COUNT(CASE WHEN tipo = 'actividad' THEN 1 END) as actividad,
        AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))/3600) as horas_promedio
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      WHERE (b.tecnico_id = ${tecnico.sub} OR u.coordinador_id = ${tecnico.sub})
    `;
  }
  
  // Filtros de tiempo
  if (mes && anio) {
    query = sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borrador,
        COUNT(CASE WHEN estado = 'cerrada' THEN 1 END) as cerrada,
        COUNT(CASE WHEN tipo = 'beneficiario' THEN 1 END) as beneficiario,
        COUNT(CASE WHEN tipo = 'actividad' THEN 1 END) as actividad,
        AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))/3600) as horas_promedio
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      WHERE EXTRACT(MONTH FROM b.fecha_inicio) = ${Number(mes)} AND EXTRACT(YEAR FROM b.fecha_inicio) = ${Number(anio)}
    `;
  }
  
  const [estadisticas] = await query;
  
  return c.json({
    periodo: mes && anio ? `${mes}/${anio}` : "todos",
    estadisticas: {
      total: Number(estadisticas.total),
      borrador: Number(estadisticas.borrador),
      cerrada: Number(estadisticas.cerrada),
      beneficiario: Number(estadisticas.beneficiario),
      actividad: Number(estadisticas.actividad),
      horas_promedio: estadisticas.horas_promedio ? Number(estadisticas.horas_promedio.toFixed(2)) : 0
    }
  });
});

// Buscar bitácoras avanzada
app.get("/buscar", async (c) => {
  const tecnico = c.get("tecnico");
  const { q, tecnico_id, mes, anio, estado, tipo, page = "1", limit = "20" } = c.req.query();
  
  // Construir consulta base
  let query = sql`
    SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
           u.nombre as tecnico_nombre,
           be.nombre as beneficiario_nombre,
           be.municipio as beneficiario_municipio,
           a.nombre as actividad_nombre,
           cp.nombre as cadena_productiva_nombre,
           b.observaciones_coordinador,
           b.actividades_desc
    FROM bitacoras b
    JOIN usuarios u ON b.tecnico_id = u.id
    LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
    LEFT JOIN actividades a ON b.actividad_id = a.id
    LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
    WHERE 1=1
  `;
  
  // Filtros según rol
  if (tecnico.rol === "tecnico") {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tecnico_id = ${tecnico.sub}
    `;
  } else if (tecnico.rol === "coordinador") {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE (b.tecnico_id = ${tecnico.sub} OR u.coordinador_id = ${tecnico.sub})
    `;
  }
  
  // Filtros de búsqueda
  if (q) {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE (
        u.nombre ILIKE ${`%${q}%`} OR
        be.nombre ILIKE ${`%${q}%`} OR
        a.nombre ILIKE ${`%${q}%`} OR
        cp.nombre ILIKE ${`%${q}%`} OR
        b.observaciones_coordinador ILIKE ${`%${q}%`} OR
        b.actividades_desc ILIKE ${`%${q}%`}
      )
    `;
  }
  
  if (tecnico_id) {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tecnico_id = ${tecnico_id}
    `;
  }
  
  if (mes && anio) {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE EXTRACT(MONTH FROM b.fecha_inicio) = ${Number(mes)} AND EXTRACT(YEAR FROM b.fecha_inicio) = ${Number(anio)}
    `;
  }
  
  if (estado) {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.estado = ${estado}
    `;
  }
  
  if (tipo) {
    query = sql`
      SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
             u.nombre as tecnico_nombre,
             be.nombre as beneficiario_nombre,
             be.municipio as beneficiario_municipio,
             a.nombre as actividad_nombre,
             cp.nombre as cadena_productiva_nombre,
             b.observaciones_coordinador,
             b.actividades_desc
      FROM bitacoras b
      JOIN usuarios u ON b.tecnico_id = u.id
      LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
      LEFT JOIN actividades a ON b.actividad_id = a.id
      LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
      WHERE b.tipo = ${tipo}
    `;
  }
  
  // Paginación
  const offset = (Number(page) - 1) * Number(limit);
  query = sql`
    SELECT b.id, b.tipo, b.estado, b.fecha_inicio, b.fecha_fin,
           u.nombre as tecnico_nombre,
           be.nombre as beneficiario_nombre,
           be.municipio as beneficiario_municipio,
           a.nombre as actividad_nombre,
           cp.nombre as cadena_productiva_nombre,
           b.observaciones_coordinador,
           b.actividades_desc
    FROM bitacoras b
    JOIN usuarios u ON b.tecnico_id = u.id
    LEFT JOIN beneficiarios be ON b.beneficiario_id = be.id
    LEFT JOIN actividades a ON b.actividad_id = a.id
    LEFT JOIN cadenas_productivas cp ON b.cadena_productiva_id = cp.id
    WHERE 1=1
    ORDER BY b.fecha_inicio DESC LIMIT ${Number(limit)} OFFSET ${offset}
  `;
  
  const bitacoras = await query;
  
  // Contar total
  let countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE 1=1`;
  
  if (tecnico.rol === "tecnico") {
    countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE b.tecnico_id = ${tecnico.sub}`;
  } else if (tecnico.rol === "coordinador") {
    countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE (b.tecnico_id = ${tecnico.sub} OR u.coordinador_id = ${tecnico.sub})`;
  }
  
  if (q) {
    countQuery = sql`
      SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id
      WHERE (
        u.nombre ILIKE ${`%${q}%`} OR
        be.nombre ILIKE ${`%${q}%`} OR
        a.nombre ILIKE ${`%${q}%`} OR
        cp.nombre ILIKE ${`%${q}%`} OR
        b.observaciones_coordinador ILIKE ${`%${q}%`} OR
        b.actividades_desc ILIKE ${`%${q}%`}
      )
    `;
  }
  
  if (tecnico_id) {
    countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE b.tecnico_id = ${tecnico_id}`;
  }
  
  if (mes && anio) {
    countQuery = sql`
      SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id
      WHERE EXTRACT(MONTH FROM b.fecha_inicio) = ${Number(mes)} AND EXTRACT(YEAR FROM b.fecha_inicio) = ${Number(anio)}
    `;
  }
  
  if (estado) {
    countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE b.estado = ${estado}`;
  }
  
  if (tipo) {
    countQuery = sql`SELECT COUNT(*) as total FROM bitacoras b JOIN usuarios u ON b.tecnico_id = u.id WHERE b.tipo = ${tipo}`;
  }
  
  const [total] = await countQuery;
  
  return c.json({
    bitacoras: bitacoras.map(b => ({
      id: b.id,
      tipo: b.tipo,
      estado: b.estado,
      fecha_inicio: b.fecha_inicio,
      fecha_fin: b.fecha_fin,
      tecnico: b.tecnico_nombre,
      beneficiario: b.beneficiario_nombre,
      beneficiario_municipio: b.beneficiario_municipio,
      actividad: b.actividad_nombre,
      cadena_productiva: b.cadena_productiva_nombre,
      observaciones: b.observaciones_coordinador,
      actividades: b.actividades_desc
    })),
    paginacion: {
      pagina: Number(page),
      limite: Number(limit),
      total: Number(total.total),
      paginas: Math.ceil(Number(total.total) / Number(limit))
    }
  });
});

export default app;