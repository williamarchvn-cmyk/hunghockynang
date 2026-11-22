"""Tạo lại icon PWA: python3 tools/tao-icon.py (cần Pillow)"""
from PIL import Image, ImageDraw
def make(size, maskable, name):
    S=size*4; img=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(img); bg=(37,80,201,255)
    if maskable: d.rectangle([0,0,S,S],fill=bg); pad=S*0.24
    else: d.rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.22),fill=bg); pad=S*0.2
    w=S-2*pad; bw=w*0.22; gap=(w-3*bw)/2; base=S-pad
    for i,h in enumerate([0.38,0.62,0.86]):
        x0=pad+i*(bw+gap); col=(255,255,255,255) if i==2 else (255,255,255,150)
        d.rounded_rectangle([x0,base-w*h,x0+bw,base],radius=int(bw*0.28),fill=col)
    r=bw*0.32; cx=pad+bw/2; cy=base-w*0.38-r*2.4
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(255,255,255,255))
    img.resize((size,size),Image.LANCZOS).save('icons/'+name)
make(192,False,'icon-192.png'); make(512,False,'icon-512.png'); make(512,True,'maskable-512.png'); make(96,False,'badge-96.png'); make(180,True,'apple-touch-icon.png')
