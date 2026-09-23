// @ts-nocheck

/** @param {{rankingId?: number|null, rank: number}} track */
export function requestIdentity(track) {
    return track.rankingId != null ? `ranking-${track.rankingId}` : `rank-${track.rank}`;
}

export function addRequest(queue, track) {
    return queue.some(item => requestIdentity(item) === requestIdentity(track))
        ? queue
        : [...queue, track];
}

export function moveRequest(queue, index, direction) {
    const target = index + direction;
    if (target < 0 || target >= queue.length) return queue;
    const next = [...queue];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function removeRequest(queue, index) {
    return queue.filter((_, itemIndex) => itemIndex !== index);
}

export function clearRequests(queue, confirmed) {
    return confirmed ? [] : queue;
}

export function takeNextRequest(queue) {
    return {track: queue[0] ?? null, queue: queue.slice(1)};
}
