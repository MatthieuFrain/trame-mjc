import math,wave,random,struct
from pathlib import Path
random.seed(23)
rate=22050;duration=12;n=rate*duration;out=[0.0]*n
# Composition déterministe, sans modèle d’IA musicale : batterie, basse et accords.
def note(start,length,freq,amp,kind='tone'):
 for j in range(int(length*rate)):
  i=int(start*rate)+j
  if i>=n:break
  t=j/rate;env=min(t/.008,1)*math.exp(-t/(length*.32))
  if kind=='kick':v=math.sin(2*math.pi*(48*t+3*(1-math.exp(-t*24))))
  elif kind=='hat':v=random.uniform(-1,1)
  else:v=math.sin(2*math.pi*freq*t)+.22*math.sin(4*math.pi*freq*t)
  out[i]+=amp*v*env
for step in range(24):
 t=step*.5
 note(t,.32,55,.4,'kick')
 if step%2:note(t,.12,0,.12,'hat')
 note(t+.25,.075,0,.07,'hat')
 base=[130.813,103.826,155.563,116.541][(step//6)%4]
 note(t,.45,base/2,.16)
 if step%2==0:
  for ratio in [1,2**(3/12),2**(7/12)]:note(t,1.1,base*ratio,.055)
for i in range(n):out[i]*=min(1,i/(rate*.08),(n-i)/(rate*.3))
peak=max(abs(x) for x in out)
p=Path(__file__).resolve().parents[1]/'public/assets/beat-atelier.wav'
with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(struct.pack('<h',int(x/peak*27000)) for x in out))
print(p)
