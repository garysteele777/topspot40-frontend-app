// src/lib/utils/getAudioBase.ts
//-------------------------------------------------------
// Reliable Supabase audio URL resolver
// Guarantees a valid public storage URL
//-------------------------------------------------------

export function getSupabaseAudioUrl(): string {
	const explicit = import.meta.env.VITE_SUPABASE_AUDIO_URL;
	if (explicit && explicit.length > 0) return explicit;

	const base = import.meta.env.VITE_SUPABASE_URL;
	if (base && base.length > 0)
		return `${base}/storage/v1/object/public`;

	// FINAL fallback for development
	return 'http://127.0.0.1:54321/storage/v1/object/public';
}
