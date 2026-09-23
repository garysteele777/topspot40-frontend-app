/**
 * Shares the "select again to continue" interaction used by single-choice
 * screens. Keyboard-generated clicks deliberately only select: this preserves
 * the normal one-activation-per-keypress behavior for button controls.
 *
 * @template T
 * @param {{
 *   getSelected: () => T | null,
 *   select: (choice: T) => void,
 *   onContinue: () => unknown,
 *   isContinueDisabled?: () => boolean,
 *   duplicateWindowMs?: number
 * }} options
 */
export function createSingleChoiceContinue(options) {
    const {
    getSelected,
    select,
    onContinue,
    isContinueDisabled = () => false,
    duplicateWindowMs = 500
    } = options;
    let continueLocked = false;

    function continueSelection() {
        if (continueLocked || isContinueDisabled()) return;

        continueLocked = true;
        globalThis.setTimeout(() => {
            continueLocked = false;
        }, duplicateWindowMs);

        return onContinue();
    }

    /** @param {T} choice @param {{ detail?: number } | undefined} event */
    function selectChoice(choice, event) {
        // Clicks synthesized by Enter/Space have detail === 0. Do not turn a
        // keyboard selection into an unexpected second action.
        const wasPointerActivation = (event?.detail ?? 0) > 0;

        if (choice === getSelected() && wasPointerActivation) {
            return continueSelection();
        }

        select(choice);
    }

    return {continue: continueSelection, select: selectChoice};
}
