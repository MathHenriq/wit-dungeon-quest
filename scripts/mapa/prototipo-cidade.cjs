// PROTÓTIPO (27/09/2026): cidade no estilo Emerald/FireRed gerada por parâmetros.
// Lê sprites soltos da pasta atual (v2.png, wv2.png...).
// Cidade no estilo Pokémon Emerald/FireRed, feita por parâmetros.
// node cidade.cjs saida.png escala
const {PNG}=require('pngjs'),fs=require('fs');
const [out,scArg]=process.argv.slice(2);const SC=+scArg||2;
const T=16,TW=30,TH=19,W=TW*T,H=TH*T;
const img=new Uint8Array(W*H*4);
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const put=(x,y,c)=>{x|=0;y|=0;if(!c||x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;img[i]=c[0];img[i+1]=c[1];img[i+2]=c[2];img[i+3]=255};
const rect=(x0,y0,w,h,c)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)put(x,y,c)};
const hash=(x,y)=>{let h=x*374761393+y*668265263;h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)/4294967296};
const OUT=hex('#3a3848');

// ───────── chão ─────────
const GR={b:hex('#a0dcc0'),dot:hex('#e0f8ec'),dot2:hex('#78b8a0'),sh:hex('#80c0a8'),dk:hex('#5e9c84')};
for(let y=0;y<H;y++)for(let x=0;x<W;x++)put(x,y,GR.b);
// pontinhos em padrão de tile (como no FireRed)
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const X=tx*T,Y=ty*T;
  [[2,3],[9,1],[13,7],[5,10],[11,13],[1,14]].forEach(([dx,dy],k)=>{if(hash(tx*7+k,ty*3)<0.2)return;put(X+dx,Y+dy,GR.dot)});
  [[6,5],[14,11]].forEach(([dx,dy],k)=>{if(hash(tx+k*9,ty*5)<0.5)put(X+dx,Y+dy,GR.dot2)})}

// praça de piso tecnológico (placas claras com junta)
const PV={b:hex('#e8ecf4'),l:hex('#ffffff'),j:hex('#b8c0d4'),d:hex('#98a0b8')};
function plaza(tx0,ty0,tw,th){const X=tx0*T,Y=ty0*T,w=tw*T,h=th*T;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const lx=x%8,ly=y%8;let c=PV.b;if(lx===7||ly===7)c=PV.j;else if(lx===0||ly===0)c=PV.l;put(X+x,Y+y,c)}
  for(let x=-1;x<=w;x++){put(X+x,Y-1,PV.d);put(X+x,Y+h,PV.d);put(X+x,Y+h+1,GR.sh)}for(let y=0;y<h;y++){put(X-1,Y+y,PV.d);put(X+w,Y+y,PV.d)}
  // linhas de luz ciano no piso (toque tecnológico)
  for(let x=4;x<w-4;x++)if(x%2===0)put(X+x,Y+(h>>1),hex('#9ee8f8'))}
// caminho de terra batida clara
const PT={b:hex('#f0e0b0'),s:hex('#d8c490'),e:hex('#b8a070'),l:hex('#fff4d0')};
function path(tx0,ty0,tw,th){const X=tx0*T,Y=ty0*T,w=tw*T,h=th*T;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=PT.b;if(hash(X+x,Y+y)<0.03)c=PT.s;else if(hash(X+x+1,Y+y)<0.02)c=PT.l;put(X+x,Y+y,c)}
  for(let x=0;x<w;x++){put(X+x,Y,PT.s);put(X+x,Y+h-1,PT.l)}}

// ───────── casa estilo FireRed (parametrizada) ─────────
const RAMP={
 laranja:{r0:hex('#f8b888'),r1:hex('#f08858'),r2:hex('#d86040'),eave:hex('#a83030')},
 vermelho:{r0:hex('#f89890'),r1:hex('#e05858'),r2:hex('#b83840'),eave:hex('#882030')},
 azul:{r0:hex('#a8d0f8'),r1:hex('#6898e0'),r2:hex('#4870b8'),eave:hex('#2c4888')},
 verde:{r0:hex('#b8e8a0'),r1:hex('#78c060'),r2:hex('#509840'),eave:hex('#306828')},
 roxo:{r0:hex('#d8b8f8'),r1:hex('#a080e0'),r2:hex('#7858b8'),eave:hex('#503888')},
};
const WALL={cinza:{l:hex('#f0f4fc'),b:hex('#d0d8e8'),s:hex('#a8b0c8'),line:hex('#8890a8')},creme:{l:hex('#fff8e8'),b:hex('#f0e0c0'),s:hex('#d0bc98'),line:hex('#a89070')},rosa:{l:hex('#fff0f4'),b:hex('#f8d0dc'),s:hex('#d8a8b8'),line:hex('#a87888')}};
function window_(x,y,w=10,h=8){rect(x-1,y-1,w+2,h+2,OUT);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const t=yy/h;put(x+xx,y+yy,t<0.3?hex('#b8e0ff'):t<0.7?hex('#78b0f0'):hex('#5888d8'))}
  put(x+1,y+1,hex('#ffffff'));put(x+2,y+1,hex('#ffffff'));put(x+1,y+2,hex('#ffffff'));rect(x+(w>>1),y,1,h,OUT);rect(x-1,y+h+1,w+2,1,hex('#f0c848'))}
function door(x,y,cor){rect(x-1,y-1,14,19,OUT);rect(x,y,12,18,cor);rect(x,y,12,1,hex('#ffffff'));rect(x+2,y+3,8,5,hex('#78b0f0'));rect(x+2,y+3,8,1,hex('#b8e0ff'));put(x+9,y+11,hex('#f8e070'));rect(x+11,y,1,18,hex('#00000040'.slice(0,7)))}
function house(tx,ty,tw,{roof='laranja',wall='cinza',janelas=2,portaCor='#d88050',andares=1}={}){
  const X=tx*T,Y=ty*T,w=tw*T,R=RAMP[roof],Wl=WALL[wall];
  const roofH=34+(andares-1)*4,wallH=28+(andares-1)*20,side=12;
  // sombra no chão
  for(let x=4;x<w+6;x++)for(let y=0;y<4;y++)put(X+x,Y+roofH+wallH+y,GR.sh);
  // parede com ripas
  for(let y=0;y<wallH;y++)for(let x=0;x<w;x++){let c=(y%4===3)?Wl.line:(y%4===0?Wl.l:Wl.b);if(x<3)c=Wl.l;if(x>w-4)c=Wl.s;put(X+x,Y+roofH+y,c)}
  rect(X-1,Y+roofH,1,wallH,OUT);rect(X+w,Y+roofH,1,wallH,OUT);rect(X-1,Y+roofH+wallH,w+2,1,OUT);
  // telhado: face frontal com listras + faixa lateral clara (empena)
  for(let y=0;y<roofH;y++)for(let x=-2;x<w+2;x++){let c=R.r1;if(y%6===4)c=R.r2;if(y%6===5)c=R.r0;
    if(x<side-2&&y<roofH-4&&x<side-2-(y>>2)+4)c=(x%3===0)?R.r0:hex('#fcd0a8');put(X+x,Y+y,c)}
  for(let x=-3;x<w+3;x++){put(X+x,Y-1,OUT);put(X+x,Y+roofH-2,R.eave);put(X+x,Y+roofH-1,OUT)}for(let y=0;y<roofH;y++){put(X-3,Y+y,OUT);put(X+w+2,Y+y,OUT)}
  // porta e janelas
  const dx=X+Math.floor(w*0.35)-6,dy=Y+roofH+wallH-18;door(dx,dy,hex(portaCor));
  const slots=[];for(let k=0;k<janelas;k++)slots.push(X+Math.floor(w*(0.62+k*0.2))-5);
  const livre=(sx,yy,h)=>!(sx<dx+14&&sx+12>dx-2&&yy+h>dy-2);
  const jy=Y+roofH+6;
  if(janelas>=1&&livre(X+6,jy,10))window_(X+6,jy,12,10);slots.forEach(sx=>{if(sx+12<X+w-3&&livre(sx,jy,10))window_(sx,jy,12,10)});
  if(andares>1)for(let k=0;k<Math.floor(w/22);k++){const sx=X+6+k*22,yy=Y+roofH+wallH-18;if(livre(sx,yy,10))window_(sx,yy,12,10)}
  return {porta:[dx+6,dy+18]};
}
// ───────── loja tecnológica ─────────
function techShop(tx,ty,tw){const X=tx*T,Y=ty*T,w=tw*T,roofH=22,wallH=34;
  for(let x=4;x<w+6;x++)for(let y=0;y<4;y++)put(X+x,Y+roofH+wallH+y,GR.sh);
  // teto plano metálico com painéis solares e antena
  for(let y=0;y<roofH;y++)for(let x=-2;x<w+2;x++){let c=hex('#c8d0e0');if(y<3)c=hex('#e8ecf8');if(y>roofH-5)c=hex('#a0a8c0');put(X+x,Y+y,c)}
  for(let k=0;k<3;k++){const px=X+8+k*22;rect(px-1,Y+4,20,11,OUT);for(let yy=0;yy<9;yy++)for(let xx=0;xx<18;xx++)put(px+xx,Y+5+yy,(xx%6===5||yy===4)?hex('#6c7cb8'):(yy<2?hex('#6090e0'):hex('#304c9c')))}
  rect(X+w-14,Y-12,2,12,OUT);put(X+w-14,Y-13,hex('#ff5a78'));put(X+w-13,Y-13,hex('#ff5a78'));rect(X+w-18,Y-8,10,1,OUT);
  for(let x=-3;x<w+3;x++){put(X+x,Y-1,OUT);put(X+x,Y+roofH-1,OUT)}for(let y=0;y<roofH;y++){put(X-3,Y+y,OUT);put(X+w+2,Y+y,OUT)}
  // fachada branca + faixa neon + vitrine
  for(let y=0;y<wallH;y++)for(let x=0;x<w;x++)put(X+x,Y+roofH+y,x>w-4?hex('#c8d0e0'):hex('#f4f6fc'));
  rect(X-1,Y+roofH,1,wallH,OUT);rect(X+w,Y+roofH,1,wallH,OUT);rect(X-1,Y+roofH+wallH,w+2,1,OUT);
  rect(X,Y+roofH,w,7,hex('#283050'));for(let x=0;x<w;x++)put(X+x,Y+roofH+6,hex('#40e8ff'));
  // letreiro "WIT" em pixel
  const F={W:['1...1','1...1','1.1.1','1.1.1','.1.1.'],I:['111','.1.','.1.','.1.','111'],T:['111','.1.','.1.','.1.','.1.']};
  let cx=X+Math.floor(w/2)-8;for(const ch of 'WIT'){F[ch].forEach((row,ry)=>[...row].forEach((v,rx)=>{if(v==='1'){put(cx+rx,Y+roofH+1+ry,hex('#9ef4ff'));}}));cx+=F[ch][0].length+2}
  // vitrine de vidro
  const gy=Y+roofH+10;rect(X+4,gy-1,w-8,18,OUT);for(let y=0;y<16;y++)for(let x=0;x<w-10;x++){const t=y/16;put(X+5+x,gy+y,t<0.25?hex('#c8f4ff'):t<0.6?hex('#88d8f0'):hex('#58b0d8'))}
  for(let k=0;k<w-10;k+=14)rect(X+5+k,gy,1,16,OUT);for(let x=0;x<6;x++)put(X+10+x,gy+2+(x>>1),hex('#ffffff'));
  // porta automática
  const dx=X+Math.floor(w/2)-7;rect(dx-1,Y+roofH+wallH-15,16,15,OUT);for(let y=0;y<14;y++)for(let x=0;x<14;x++)put(dx+x,Y+roofH+wallH-14+y,x===7?OUT:(y<4?hex('#c8f4ff'):hex('#78c8e8')));
  rect(dx-2,Y+roofH+wallH,18,2,hex('#40e8ff'));
}
// ───────── árvore estilo Emerald (cônica, em cachos) ─────────
const TR={o:hex('#1e3a14'),d:hex('#2e6020'),m:hex('#3f822f'),b:hex('#5aa040'),l:hex('#8ccc60'),h:hex('#b8e888')};
const layer=[];
function tree(cx,by){
  for(let y=-3;y<=3;y++)for(let x=-11;x<=11;x++)if((x/11)**2+(y/3)**2<=1)layer.push([cx+x,by+y,GR.sh,0]);
  for(let y=-8;y<=0;y++)for(let x=-2;x<=2;x++)layer.push([cx+x,by+y,x===-2||x===2?OUT:x<0?hex('#b07848'):hex('#805028'),1]);
  // cachos: 4 camadas de "escamas" do topo para baixo
  const clumps=[];const rows=[[0,-34,1],[-4,-27,2],[-7,-20,3],[-9,-13,4]];
  rows.forEach(([x0,y0,n])=>{for(let k=0;k<n;k++)clumps.push([x0+k*((n>1)?(-2*x0)/(n-1):0),y0,6.2])});
  const inAny=(x,y)=>clumps.some(([ox,oy,r])=>((x-ox)/r)**2+((y-oy)/(r*0.85))**2<=1);
  const owner=(x,y)=>{let best=-1;clumps.forEach(([ox,oy,r],i)=>{if(((x-ox)/r)**2+((y-oy)/(r*0.85))**2<=1)best=i});return best};
  for(let y=-42;y<=-5;y++)for(let x=-14;x<=14;x++){const i=owner(x,y);if(i<0)continue;
    const edge=!inAny(x+1,y)||!inAny(x-1,y)||!inAny(x,y+1)||!inAny(x,y-1);
    const [ox,oy,r]=clumps[i];const below=owner(x,y+1);
    let c;if(edge)c=TR.o;else if(below!==i&&below>=0)c=TR.d; // borda inferior do cacho sobre o de baixo
    else{const lx=(x-ox+2)/r,ly=(y-oy+2)/(r*0.85);const d=lx*lx+ly*ly;c=d<0.25?TR.h:d<0.55?TR.l:d<0.85?TR.b:TR.m;if(x-ox>2&&y-oy>1)c=TR.d}
    layer.push([cx+x,by+y,c,2])}
}
// ───────── detalhes ─────────
function fence(tx,ty,n){const X=tx*T,Y=ty*T;for(let x=0;x<n*T;x++){put(X+x,Y+6,OUT);put(X+x,Y+7,hex('#e8ecf4'));put(X+x,Y+8,hex('#b8c0d0'));put(X+x,Y+9,OUT)}
  for(let k=0;k<n*2;k++){const px=X+k*8+2;rect(px-1,Y,6,15,OUT);rect(px,Y+1,4,13,hex('#d8e0ec'));rect(px,Y+1,1,13,hex('#ffffff'));rect(px+3,Y+1,1,13,hex('#a0a8bc'));for(let x=0;x<6;x++)put(px-1+x,Y+15,GR.sh)}}
function flowers(tx,ty,n,cor='#e84848'){const X=tx*T,Y=ty*T;const c=hex(cor),cl=hex('#ffb0b0');for(let k=0;k<n*2;k++){const fx=X+k*8+1,fy=Y+3+(k%2)*6;
  const pat=['.o.o.','ocooo','occco','.ooo.','..g..','.gg..'];pat.forEach((row,b)=>[...row].forEach((v,a)=>{if(v==='o')put(fx+a,fy+b,OUT);if(v==='c')put(fx+a,fy+b,c);if(v==='g')put(fx+a,fy+b,hex('#3f822f'))}));
  put(fx+1,fy+1,cl);put(fx+2,fy+2,c);put(fx+2,fy+1,c);put(fx+3,fy+1,c)}}
function mailbox(x,y){rect(x-1,y-1,10,9,OUT);rect(x,y,8,7,hex('#f0f4fc'));rect(x,y+5,8,2,hex('#b8c0d0'));rect(x+3,y+8,2,6,OUT);put(x+6,y+1,hex('#e84848'))}
function lamp(x,y){rect(x,y,2,20,OUT);rect(x-3,y-4,8,4,OUT);rect(x-2,y-3,6,2,hex('#9ef4ff'));for(let k=-2;k<=3;k++)put(x+k,y-5,hex('#d0f8ff'))}

// ───────── montagem ─────────
path(0,9,30,2); path(13,11,2,8); path(3,4,2,5); path(22,5,2,4);
plaza(10,1,10,7);
techShop(11,1,8);
house(1,0,5,{roof:'laranja',wall:'cinza',janelas:1});
house(21,0,6,{roof:'azul',wall:'cinza',janelas:2,portaCor:'#5070c0'});
house(2,12,5,{roof:'vermelho',wall:'creme',janelas:1,portaCor:'#a86040'});
house(19,12,7,{roof:'roxo',wall:'rosa',janelas:2,andares:2,portaCor:'#8858b8'});
fence(1,7,2);fence(5,7,1);flowers(6,6,2);fence(21,7,2);flowers(26,7,2);
mailbox(5*T+10,4*T+6);mailbox(27*T+4,4*T+6);
lamp(10*T-4,5*T);lamp(20*T+4,5*T);
[[0,17],[8,16],[10,17],[16,17],[27,17],[29,15],[0,12],[9,13],[17,15],[29,11]].forEach(([tx,ty])=>tree(tx*T+8,ty*T+14));
flowers(7,14,2,'#f0c030');flowers(15,15,1,'#f070b0');
// personagens
function sprite(file,x,y){const p=PNG.sync.read(fs.readFileSync(file));for(let dy=-2;dy<=2;dy++)for(let dx=-7;dx<=7;dx++)if((dx/7)**2+(dy/2.2)**2<=1)layer.push([x+16+dx,y+30+dy,GR.sh,0]);
  for(let yy=0;yy<p.height;yy++)for(let xx=0;xx<p.width;xx++){const i=(yy*p.width+xx)*4;if(p.data[i+3]<128)continue;layer.push([x+xx,y+yy,[p.data[i],p.data[i+1],p.data[i+2]],3+y/1000])}}
sprite('v2.png',14*T-8,8*T+2);sprite('wv2.png',8*T,9*T-8);sprite('v4.png',24*T,9*T-6);sprite('v5.png',4*T,10*T-8);
layer.sort((a,b)=>a[3]-b[3]);for(const [x,y,c] of layer)put(x,y,c);
const o=new PNG({width:W*SC,height:H*SC});
for(let y=0;y<H*SC;y++)for(let x=0;x<W*SC;x++){const s=((((y/SC)|0)*W)+((x/SC)|0))*4,d=(y*W*SC+x)*4;o.data[d]=img[s];o.data[d+1]=img[s+1];o.data[d+2]=img[s+2];o.data[d+3]=255}
fs.writeFileSync(out,PNG.sync.write(o));console.log(out,W*SC+'x'+H*SC);
