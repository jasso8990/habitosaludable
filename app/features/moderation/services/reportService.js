import { supabase } from '../../../core/supabase/client';

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

export const createReport = async ({ reporterId, contenidoId, tipo, sourceData, motivo = '' }) => {
  try {
    const payload = {
      reporter_id: reporterId,
      contenido_id: contenidoId,
      tipo,
      snapshot_contenido: {
        motivo: motivo?.trim() || null,
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
