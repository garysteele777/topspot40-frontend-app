import { getBackendUrl } from '$lib/config';

type FeedbackPayload = {
	type: 'feedback';
	message: string;
	title?: string;
	email?: string;
	route?: string;
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
