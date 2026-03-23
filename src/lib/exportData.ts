import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  teacherId: string;
  startDate: string;
  endDate: string;
  classId?: string;
  studentId?: string;
  format: 'csv' | 'json';
  include: {
    students: boolean;
    activity: boolean;
    missions: boolean;
    bosses: boolean;
    guilds: boolean;
    skills: boolean;
    inventory: boolean;
    chests: boolean;
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
    return `"${String(val).replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildQuery(query: ReturnType<typeof supabase.from>, opts: ExportOptions) {
  let q = query.eq('teacher_id', opts.teacherId);
  if (opts.classId) q = q.eq('class_id', opts.classId);
  if (opts.studentId) q = q.eq('id', opts.studentId);
  return q;
}

export async function exportData(options: ExportOptions) {
  const data: Record<string, unknown[]> = {};
  const dateStr = today();

  if (options.include.students) {
    let q = supabase
      .from('students')
      .select('name, character_name, character_class, level, xp, coins, diamonds, streak_current, streak_best, presencas_consecutivas, total_missions_completed, total_boss_kills, total_pvp_wins, total_crafts, status');
    if (options.classId) q = q.eq('class_id', options.classId);
    else q = q.eq('teacher_id', options.teacherId);
    if (options.studentId) q = q.eq('id', options.studentId);
    const { data: rows } = await q;
    data.students = rows || [];
  }

  if (options.include.activity) {
    let q = supabase
      .from('analytics_events')
      .select('event_type, student_id, class_id, event_data, created_at')
      .eq('teacher_id', options.teacherId)
      .gte('created_at', options.startDate)
      .lte('created_at', options.endDate)
      .order('created_at', { ascending: false })
      .limit(10000);
    if (options.classId) q = q.eq('class_id', options.classId);
    if (options.studentId) q = q.eq('student_id', options.studentId);
    const { data: rows } = await q;
    data.activity = rows || [];
  }

  if (options.include.missions) {
    const { data: rows } = await supabase
      .from('mission_completions')
      .select('id, student_id, mission_id, status, created_at, student_missions(title, description, reward)')
      .in('student_id', await getStudentIds(options))
      .gte('created_at', options.startDate)
      .lte('created_at', options.endDate);
    data.missions = (rows || []).map((r: Record<string, unknown>) => ({
      student_id: r.student_id,
      status: r.status,
      created_at: r.created_at,
      ...((r.student_missions as Record<string, unknown>) || {}),
    }));
  }

  if (options.include.bosses) {
    const { data: rows } = await supabase
      .from('boss_attempts')
      .select('student_id, boss_id, total_damage, boss_defeated, coins_earned, xp_earned, started_at, finished_at, boss_battles(boss_name, boss_hp, difficulty)')
      .in('student_id', await getStudentIds(options))
      .gte('started_at', options.startDate)
      .lte('started_at', options.endDate);
    data.bosses = (rows || []).map((r: Record<string, unknown>) => ({
      student_id: r.student_id,
      total_damage: r.total_damage,
      boss_defeated: r.boss_defeated,
      coins_earned: r.coins_earned,
      xp_earned: r.xp_earned,
      started_at: r.started_at,
      finished_at: r.finished_at,
      ...((r.boss_battles as Record<string, unknown>) || {}),
    }));
  }

  if (options.include.guilds) {
    let q = supabase
      .from('guilds')
      .select('name, level, xp, max_members')
      .eq('teacher_id', options.teacherId);
    const { data: rows } = await q;
    data.guilds = rows || [];
  }

  if (options.include.skills) {
    const { data: rows } = await supabase
      .from('student_skill_progress')
      .select('student_id, completed, completed_at, skill_nodes(name, description)')
      .in('student_id', await getStudentIds(options))
      .eq('completed', true);
    data.skills = (rows || []).map((r: Record<string, unknown>) => ({
      student_id: r.student_id,
      completed_at: r.completed_at,
      ...((r.skill_nodes as Record<string, unknown>) || {}),
    }));
  }

  if (options.include.inventory) {
    const { data: rows } = await supabase
      .from('student_inventory')
      .select('student_id, added_at, shop_items(name, category, cost)')
      .in('student_id', await getStudentIds(options));
    data.inventory = (rows || []).map((r: Record<string, unknown>) => ({
      student_id: r.student_id,
      added_at: r.added_at,
      ...((r.shop_items as Record<string, unknown>) || {}),
    }));
  }

  if (options.include.chests) {
    const { data: rows } = await supabase
      .from('chest_openings')
      .select('student_id, chest_type, rarity, item_name, opened_at')
      .in('student_id', await getStudentIds(options))
      .gte('opened_at', options.startDate)
      .lte('opened_at', options.endDate);
    data.chests = rows || [];
  }

  if (options.format === 'json') {
    downloadJSON({ ...data, exportedAt: new Date().toISOString() }, `export-wit-dungeon-${dateStr}.json`);
  } else {
    Object.entries(data).forEach(([key, rows]) => {
      if (rows.length > 0) {
        downloadCSV(rows as Record<string, unknown>[], `${key}-${dateStr}.csv`);
      }
    });
  }
}

async function getStudentIds(options: ExportOptions): Promise<string[]> {
  if (options.studentId) return [options.studentId];
  let q = supabase.from('students').select('id').eq('teacher_id', options.teacherId);
  if (options.classId) q = q.eq('class_id', options.classId);
  const { data } = await q;
  return (data || []).map((s: { id: string }) => s.id);
}
