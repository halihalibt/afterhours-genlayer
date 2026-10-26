"""Render the original AFTERHOURS piano miniature (60 BPM, D major)."""
from pathlib import Path
import numpy as np
import wave

RATE=24000
DURATION=32
mix=np.zeros((RATE*DURATION,2),dtype=np.float64)
def note(midi,start,velocity=.3,pan=0,duration=5):
    t=np.arange(int(RATE*duration))/RATE
    f=440*2**((midi-69)/12)
    sound=np.zeros_like(t)
    for h,level in enumerate([1,.33,.12,.055,.025,.012],1):
        # Warm, rapidly decaying overtones with a soft felt-like attack.
        sound+=level*np.sin(2*np.pi*f*h*t)*np.exp(-t*(.65+h*.19))
    sound*= (1-np.exp(-t/0.018))*np.minimum(1,(duration-t)/.25)*velocity
    indices=(int(start*RATE)+np.arange(len(t)))%len(mix)
    mix[indices,0]+=sound*np.sqrt((1-pan)/2)
    mix[indices,1]+=sound*np.sqrt((1+pan)/2)
# Dmaj9, Bm7, Gmaj9, Asus2: two phrases with a restrained upper melody.
chords=[[50,57,61,64],[47,54,57,62],[43,50,54,57],[45,52,57,59]]*2
melody=[[78,76],[74,73],[74,78],[76,73],[78,81],[78,76],[74,73],[71,69]]
for bar,chord in enumerate(chords):
    start=bar*4
    note(chord[0],start,.14,-.25,6)
    for j in range(4):note(chord[1+j%3]+12,start+j+.04,.12,(-.2 if j%2 else .2),4.5)
    for j,n in enumerate(melody[bar]):note(n,start+.4+j*2,.18,.12,5)
# Quiet stereo room reflections; wrap tails for a seamless repeating score.
dry=mix.copy()
for delay,level in [(.13,.11),(.29,.08),(.47,.055),(.71,.035),(.97,.02)]:
    mix+=np.roll(dry[:,::-1],int(delay*RATE),axis=0)*level
mix*=.48/np.max(np.abs(mix))
output=Path('/tmp/afterhours-piano.wav')
with wave.open(str(output),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE)
    w.writeframes((mix*32767).astype('<i2').tobytes())
print(output)
