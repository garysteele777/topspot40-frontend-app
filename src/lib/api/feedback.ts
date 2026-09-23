import { getBackendUrl } from '$lib/config';

export type FeedbackType = 'bug' | 'feature' | 'feedback';
export type FeedbackCategory = 'contact' | 'general_feedback' | 'content_issue';

export type FeedbackPayload = {
	type: FeedbackType;
	message: string;
	title?: string;
	email?: string;
	route?: string;
	category?: FeedbackCategory;
	metadata?: Record<string, unknown>;
};

type FeedbackResponse = {
	message: string;
	id: string;
};

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
	const res = await fetch(`${getBackendUrl()}/api/feedback/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const data = await res.json().catch(() => null);

	if (!res.ok) {
		const detail =
			typeof data?.detail === 'string'
				? data.detail
				: 'Unable to send your message. Please try again.';
		throw new Error(detail);
	}

	if (
		!data ||
		typeof data.message !== 'string' ||
		typeof data.id !== 'string'
	) {
		throw new Error('The server returned an unexpected response.');
	}

	return data;
}
