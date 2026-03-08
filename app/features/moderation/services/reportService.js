import { supabase } from '../../../core/supabase/client';

export const REPORT_REASONS = {
  SPAM: 'spam',
  ABUSE: 'abuso',
  INAPPROPRIATE: 'inapropiado',
  OTHER: 'otro',
};

const buildSnapshot = ({ sourceType, sourceData }) => {
  if (!sourceData || typeof sourceData !== 'object') return null;

  if (sourceType === 'historia') {
    return {
      title: sourceData.title || null,
      message: sourceData.message || null,
      user_id: sourceData.user_id || null,
      created_at: sourceData.created_at || null,
    };
  }

  if (sourceType === 'usuario') {
    return {
      full_name: sourceData.full_name || null,
      user_id: sourceData.id || null,
    };
  }

  return sourceData;
};

const normalizeReason = (reason) => {
  const allowed = new Set(Object.values(REPORT_REASONS));
  const cleaned = String(reason || '').trim().toLowerCase();
  return allowed.has(cleaned) ? cleaned : REPORT_REASONS.OTHER;
};

const hasPendingDuplicate = async ({ reporterId, contenidoId, tipo }) => {
  const { data } = await supabase
    .from('reportes')
    .select('id, estado')
    .eq('reporter_id', reporterId)
    .eq('contenido_id', contenidoId)
    .eq('tipo', tipo)
    .eq('estado', 'pendiente')
    .maybeSingle();

  return !!data;
};

export const createReport = async ({ reporterId, contenidoId, tipo, sourceData, motivo = REPORT_REASONS.OTHER }) => {
  try {
    const duplicate = await hasPendingDuplicate({ reporterId, contenidoId, tipo });
    if (duplicate) {
      return { success: false, duplicate: true, error: 'Ya tienes un reporte pendiente para este contenido.' };
    }

    const payload = {
      reporter_id: reporterId,
      contenido_id: contenidoId,
      tipo,
      snapshot_contenido: {
        motivo: normalizeReason(motivo),
        snapshot: buildSnapshot({ sourceType: tipo, sourceData }),
      },
      estado: 'pendiente',
    };

    const { error } = await supabase.from('reportes').insert(payload);
    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
