// src/lib/carmode/CarMode.url.ts
import type { SelectionState } from '$lib/stores/selection';
import { buildSelectionFromUrl as baseBuildSelectionFromUrl } from '$lib/helpers/car/selectionFromUrl';

export function buildSelectionFromUrl(url: URL): SelectionState {
	return baseBuildSelectionFromUrl(url);
}
