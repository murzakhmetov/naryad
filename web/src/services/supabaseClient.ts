import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfmiftikcnoesozqskfz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sCwXPQDWrNK-AbcMZhvEnw_3Dr1vDyi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const STORAGE_BUCKET = 'some';

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPhoto(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.warn('Upload error:', error.message);
    return null;
  }

  return getPublicUrl(fileName);
}
