// Choose the outcome before the animation; animation frames never launch a program.
/**
 * @template T
 * @param {{onFrame: (item: T) => void, onFinish: (item: T) => void, random?: () => number,
 * schedule?: (fn: () => void, delay: number) => ReturnType<typeof setTimeout> | number,
 * cancel?: (timer: ReturnType<typeof setTimeout> | number | undefined) => void}} options
 */
export function createSurprisePicker({onFrame, onFinish, random = Math.random, schedule = setTimeout, cancel = clearTimeout}) {
    /** @type {ReturnType<typeof setTimeout> | number | undefined} */
    let timer;
    let version = 0;
    function stop() {
        version += 1;
        cancel(timer);
    }
    /** @param {T[]} items */
    function start(items, reducedMotion = false) {
        stop();
        if (!items.length) return;
        const pool = [...items];
        const pick = () => pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
        const result = pick();
        const active = version;
        const delays = [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 400, 600];
        let previousIndex = -1;
        let frame = 0;
        function next() {
            if (active !== version) return;
            if (reducedMotion || frame === delays.length) {
                onFrame(result);
                onFinish(result);
                return;
            }
            // Keep every animated jump visible, even if the random draw repeats.
            const available = pool.length - (previousIndex >= 0 && pool.length > 1 ? 1 : 0);
            let index = Math.min(available - 1, Math.floor(random() * available));
            if (pool.length > 1 && previousIndex >= 0 && index >= previousIndex) index += 1;
            previousIndex = index;
            onFrame(pool[index]);
            timer = schedule(next, delays[frame++]);
        }
        next();
    }
    return {start, stop};
}
