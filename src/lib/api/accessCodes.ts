import { getBackendUrl } from '$lib/config';

export type AccessCodeResult = {
    result: 'activated' | 'already_redeemed' | 'unchanged';
    complimentary_access: boolean;
    access_expires_at: string | null;
    redeemed_at: string;
};

export class AccessCodeError extends Error {
    constructor(public code: string) {
        super(code);
    }
}

export async function redeemAccessCode(code: string): Promise<AccessCodeResult> {
    let response: Response;
    try {
        response = await fetch(`${getBackendUrl()}/api/access-codes/redeem`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-TopSpot-Access-Code': '1' },
            body: JSON.stringify({ code: code.trim().toLowerCase() }),
            cache: 'no-store'
        });
    } catch {
        throw new AccessCodeError('temporarily_unavailable');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new AccessCodeError(data?.result ?? data?.detail?.code ?? 'temporarily_unavailable');
    }
    if (!data || !['activated', 'already_redeemed', 'unchanged'].includes(data.result) ||
        typeof data.complimentary_access !== 'boolean' ||
        !(data.access_expires_at === null ||
            (typeof data.access_expires_at === 'string' && Number.isFinite(Date.parse(data.access_expires_at))))) {
        throw new AccessCodeError('temporarily_unavailable');
    }
    return data;
}
