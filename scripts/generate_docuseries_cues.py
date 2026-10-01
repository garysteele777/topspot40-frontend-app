"""Generate original Docuseries opening cues. Requires Python 3 and ffmpeg.

No recordings, samples, TTS service, or credentials are used.
"""
import math
from pathlib import Path
import struct
import subprocess
import tempfile
import wave

RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / 'static/docuseries/cues'


def render(name, length, notes):
    samples = []
    for i in range(round(RATE * length)):
        time = i / RATE
        value = 0.0
        for start, frequency, gain in notes:
            age = time - start
            if age < 0:
                continue
            # Soft attack and decaying harmonics give a warm piano/bell tone.
            envelope = (1 - math.exp(-age * 70)) * math.exp(-age * 3)
            tone = sum(weight * math.sin(2 * math.pi * frequency * harmonic * age)
                       for harmonic, weight in [(1, 1), (2, .22), (3, .08)])
            value += gain * envelope * tone
        value *= min(1, max(0, (length - time) / .25))
        samples.append(value)
    peak = max(abs(value) for value in samples)
    pcm = b''.join(struct.pack('<h', round(value / peak * .5 * 32767)) for value in samples)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        source = Path(temporary) / 'cue.wav'
        with wave.open(str(source), 'wb') as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(RATE)
            audio.writeframes(pcm)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                        '-i', str(source), '-codec:a', 'libmp3lame', '-b:a', '128k',
                        str(OUTPUT / name)], check=True)


if __name__ == '__main__':
    # C major with a gentle upward resolution; the story cue echoes its ending.
    render('group-opening.mp3', 3.1, [(0, 261.63, .8), (.35, 329.63, .7),
                                     (.7, 392, .65), (1.05, 523.25, .6)])
    render('story-opening.mp3', 1.4, [(0, 392, .65), (.22, 523.25, .6)])
