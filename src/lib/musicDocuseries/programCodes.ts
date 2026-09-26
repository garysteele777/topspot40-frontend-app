import approvedProgramCodes from './approvedProgramCodes.json';

// Slug assignments copied from the backend's approved program_code_manifest.json.
const codesBySlug: Record<string, string> = approvedProgramCodes;

export function docuseriesCodeForSlug(slug: string | null | undefined): string | null {
    return slug ? codesBySlug[slug] ?? null : null;
}
