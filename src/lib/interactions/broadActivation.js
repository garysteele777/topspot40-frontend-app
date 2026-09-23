// @ts-nocheck -- This small browser-event adapter is also exercised by Node tests.
export function createBroadActivation({
    onActivate,
    dragThreshold = 12
}) {
    let pointerStart = null;
    let locked = false;

    function activate() {
        if (locked) return false;

        locked = true;
        onActivate();
        return true;
    }

    return {
        pointerDown(event) {
            if (event.isPrimary === false) return;

            pointerStart = {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY
            };
        },
        pointerUp(event) {
            if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
                return false;
            }

            const distance = Math.hypot(
                event.clientX - pointerStart.clientX,
                event.clientY - pointerStart.clientY
            );
            pointerStart = null;

            return distance <= dragThreshold && activate();
        },
        pointerCancel() {
            pointerStart = null;
        },
        keyboardActivate(event) {
            return event.detail === 0 && activate();
        }
    };
}
