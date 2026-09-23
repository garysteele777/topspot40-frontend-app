/**
 * Produces the CSV format used by the car-mode track-list exports.
 *
 * @param {Array<{
 *   rank: number,
 *   trackName: string | null | undefined,
 *   artistName: string | null | undefined,
 *   albumName?: string | null,
 *   spotifyTrackId?: string | null
 * }>} tracks
 */
export function createTrackListCsv(tracks) {
    const sortedTracks = [...tracks].sort((a, b) => a.rank - b.rank);
    const rows = [
        ['title', 'artist', 'album', 'spotify_id'],
        ...sortedTracks.map(track => [
            track.trackName,
            track.artistName,
            track.albumName ?? '',
            track.spotifyTrackId ?? ''
        ])
    ];

    return rows
        .map(row => row.map(escapeCsv).join(','))
        .join('\r\n');
}

/** @param {string | number | null | undefined} value */
export function escapeCsv(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
}

/** @param {string} csv @param {string} filename */
export function downloadCsv(csv, filename) {
    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
