// PROTÓTIPO (27/09/2026): cenário gerado só por código para avaliar se o chão
// do mapa pode ser feito sem PixelLab. Lê sprites soltos da pasta atual.
// Cenário de teste feito só por código: grama, caminho, lago, grama alta,
// flores, cerca e árvores, em blocos de 16 px no estilo HGSS.
// node cena.cjs saida.png escala
const {PNG}=require('pngjs'),fs=require('fs');
const [out,scArg]=process.argv.slice(2);const SC=+scArg||3;
const TW=22,TH=13,T=16,W=TW*T,H=TH*T;
const img=new Uint8Array(W*H*4);
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const put=(x,y,c)=>{if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;img[i]=c[0];img[i+1]=c[1];img[i+2]=c[2];img[i+3]=255};
const getc=(x,y)=>{const i=(y*W+x)*4;return[img[i],img[i+1],img[i+2]]};
// ruído determinístico
let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
const hash=(x,y)=>{let h=x*374761393+y*668265263;h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)/4294967296};

const G={base:hex('#80c860'),mid:hex('#68b050'),dark:hex('#509040'),deep:hex('#3a7038'),light:hex('#a0dc78')};
const P={base:hex('#e8d49c'),shade:hex('#d4bc84'),dark:hex('#b09868'),edge:hex('#8a7450'),light:hex('#f6e8bc')};
const A={base:hex('#58a8e8'),light:hex('#8cd0f8'),dark:hex('#3878c0'),edge:hex('#285890'),white:hex('#e8f8ff')};

// ── mapa lógico (por bloco) ──
// . grama  # caminho  ~ água  " grama alta  * flores  = cerca  T árvore(raiz)
const MAP=[
'TT..T..........T...T..',
'T.....====....***.....',
'..**...........***....',
'......#######.........',
'..#####.....#.....~~~.',
'..#.........#....~~~~~',
'..#...""""..#....~~~~~',
'..#...""""..#######~~.',
'..#...""""........#...',
'..#...............#...',
'..########..***...#...',
'.........#........#..T',
'T....T...#.....T..#..T',
];
const at=(tx,ty)=>(MAP[ty]||'')[tx]||'.';

// ── grama base com tufos ──
for(let y=0;y<H;y++)for(let x=0;x<W;x++)put(x,y,G.base);
// tufos em "v" num padrão regular levemente embaralhado (como no HGSS)
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){
  const pts=[[3,4],[11,3],[6,11],[13,12]];
  pts.forEach(([px,py],k)=>{if(hash(tx*4+k,ty)<0.25)return;const x=tx*T+px,y=ty*T+py;
    put(x,y,G.dark);put(x+2,y,G.dark);put(x+1,y+1,G.deep);put(x,y-1,G.mid);put(x+2,y-1,G.mid);});
  if(hash(tx,ty*7)<0.5){const x=tx*T+((hash(tx,ty)*14)|0),y=ty*T+((hash(ty,tx)*14)|0);put(x,y,G.light)}
}

// ── caminho com cantos arredondados, borda e pedrinhas ──
const pathMask=new Uint8Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(at((x/T)|0,(y/T)|0)==='#')pathMask[y*W+x]=1;
// arredonda cantos: erosão+dilatação com raio 3 (abertura) e fechamento
function morph(m,r,dil){const o=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=dil?0:1;
  for(let dy=-r;dy<=r&&(dil?!v:v);dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r)continue;const xx=x+dx,yy=y+dy;const q=(xx<0||yy<0||xx>=W||yy>=H)?(dil?0:1):m[yy*W+xx];if(dil&&q){v=1;break}if(!dil&&!q){v=0;break}}o[y*W+x]=v}return o}
let pm=morph(morph(pathMask,4,true),4,false); // fecha frestas
pm=morph(morph(pm,3,false),3,true);          // arredonda cantos
const inP=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&pm[y*W+x];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!inP(x,y))continue;
  const edge=!inP(x+1,y)||!inP(x-1,y)||!inP(x,y+1)||!inP(x,y-1);
  const nearTop=!inP(x,y-1)||!inP(x,y-2);
  let c=P.base;
  if(edge)c=P.dark;else if(nearTop)c=P.shade;else if(!inP(x,y+2))c=P.light;
  put(x,y,c);
  if(!edge&&hash(x,y)<0.008){put(x,y,P.dark);put(x+1,y,P.shade);put(x,y-1,P.light)}
}
// grama escurece 1 px em volta do caminho (dá relevo)
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(inP(x,y))continue;if(inP(x,y+1)||inP(x+1,y)||inP(x-1,y))put(x,y,G.mid)}

// ── lago ──
const wm=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(at((x/T)|0,(y/T)|0)==='~')wm[y*W+x]=1;
let wmask=morph(morph(morph(morph(wm,10,true),10,false),7,false),7,true);
const inW=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&wmask[y*W+x];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!inW(x,y)){if(inW(x,y-1)||inW(x,y-2))put(x,y,G.deep);continue}
  const e=!inW(x+1,y)||!inW(x-1,y)||!inW(x,y+1)||!inW(x,y-1);
  let c=A.base;if(e)c=A.edge;else if(!inW(x,y-1)||!inW(x,y-2)||!inW(x,y-3))c=A.dark;
  put(x,y,c);
  if(!e&&(x+y*3)%23===0&&y%6===0){put(x,y,A.light);put(x+1,y,A.white);put(x+2,y,A.light)}}

// ── grama alta ──
const blade=[[1,6],[0,5],[0,4],[1,3],[2,2],[3,3],[3,4],[4,5],[5,4],[5,3],[6,2],[7,3],[7,4],[7,5],[6,6]];
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){if(at(tx,ty)!=='"')continue;
  for(let y=0;y<T;y++)for(let x=0;x<T;x++)put(tx*T+x,ty*T+y,G.mid);
  for(const [ox,oy] of [[0,1],[8,1],[0,9],[8,9]]){
    for(let x=0;x<8;x++)for(let y=3;y<7;y++)put(tx*T+ox+x,ty*T+oy+y,G.dark);
    blade.forEach(([bx,by])=>put(tx*T+ox+bx,ty*T+oy+by,G.deep));
    [[1,4],[2,3],[5,5],[6,3],[4,6]].forEach(([bx,by])=>put(tx*T+ox+bx,ty*T+oy+by,G.base));
    [[2,4],[6,4]].forEach(([bx,by])=>put(tx*T+ox+bx,ty*T+oy+by,G.light));
  }}

// ── flores ──
const FL=[hex('#f8f8f8'),hex('#f06880'),hex('#f8d048')];
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){if(at(tx,ty)!=='*')continue;
  [[3,3],[11,5],[5,11],[12,12]].forEach(([fx,fy],k)=>{const c=FL[(tx+ty+k)%3];const x=tx*T+fx,y=ty*T+fy;
    put(x,y-1,c);put(x-1,y,c);put(x+1,y,c);put(x,y+1,c);put(x,y,hex('#f8b030'));put(x+1,y+2,G.dark);put(x,y+2,G.deep)});}

// ── cerca ──
const WD={base:hex('#c88850'),light:hex('#e8b070'),dark:hex('#8a5830'),out:hex('#4a2c18')};
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){if(at(tx,ty)!=='=')continue;const X=tx*T,Y=ty*T;
  for(let x=0;x<T;x++){for(const ry of [5,10]){put(X+x,Y+ry-1,WD.out);put(X+x,Y+ry,WD.light);put(X+x,Y+ry+1,WD.base);put(X+x,Y+ry+2,WD.out)}}
  for(const px of [2,10]){for(let y=1;y<15;y++){put(X+px,Y+y,WD.out);put(X+px+1,Y+y,WD.light);put(X+px+2,Y+y,WD.base);put(X+px+3,Y+y,WD.dark);put(X+px+4,Y+y,WD.out)}
    for(let x=0;x<5;x++){put(X+px+x,Y,WD.out)}for(let x=1;x<4;x++)put(X+px+x,Y+15,WD.out);
    for(let x=0;x<6;x++)put(X+px-1+x,Y+15,G.deep)}}

// ── camada de objetos por cima (árvores, personagens) ──
const layer=[];
const TR={out:hex('#1c3c24'),d:hex('#2c6038'),m:hex('#3c8048'),b:hex('#50a058'),l:hex('#78c070'),h:hex('#a0dc88')};
function tree(cx,by){ // árvore 32×40, base em (cx,by)
  const cir=[[0,-26,12],[-7,-20,9],[7,-20,9],[-4,-31,8],[5,-31,8],[0,-17,10]];
  const inC=(x,y)=>cir.some(([ox,oy,r])=>(x-ox)**2+(y-oy)**2<=r*r);
  // sombra no chão
  for(let y=-3;y<=3;y++)for(let x=-12;x<=12;x++)if((x/12)**2+(y/3.5)**2<=1)layer.push([cx+x,by+y,G.deep,0]);
  // tronco
  for(let y=-10;y<=0;y++)for(let x=-3;x<=3;x++){const c=x===-3||x===3?WD.out:x<=-1?WD.light:x<=1?WD.base:WD.dark;layer.push([cx+x,by+y,c,1])}
  for(let y=-44;y<=-6;y++)for(let x=-14;x<=14;x++){if(!inC(x,y))continue;
    const e=!inC(x+1,y)||!inC(x-1,y)||!inC(x,y+1)||!inC(x,y-1);
    let c;if(e)c=TR.out;else{
      const lx=x+4,ly=y+32;const d=Math.sqrt(lx*lx+ly*ly); // luz em cima-esquerda
      const n=hash(cx+x,y)*0.25;const v=d/22+n;
      c=v<0.45?TR.h:v<0.65?TR.l:v<0.9?TR.b:v<1.15?TR.m:TR.d;
      // aglomerados de folha: arcos escuros
      if(((x+40)%7===0&&(y+60)%6<2)||((x+43)%7===3&&(y+63)%6===3))c=v<0.8?TR.b:TR.d;}
    layer.push([cx+x,by+y,c,2])}
}
for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(at(tx,ty)==='T')tree(tx*T+8,ty*T+14);

// personagens (sprites 32×32) em cima
function sprite(file,x,y,recolor){const p=PNG.sync.read(fs.readFileSync(file));
  // sombra
  for(let dy=-2;dy<=2;dy++)for(let dx=-8;dx<=8;dx++)if((dx/8)**2+(dy/2.5)**2<=1)layer.push([x+16+dx,y+30+dy,G.deep,0]);
  for(let yy=0;yy<p.height;yy++)for(let xx=0;xx<p.width;xx++){const i=(yy*p.width+xx)*4;if(p.data[i+3]<128)continue;layer.push([x+xx,y+yy,[p.data[i],p.data[i+1],p.data[i+2]],3])}}
sprite('v2.png',6*T+2,8*T+4);
sprite('t9-west.png',8*T+2,8*T+6);
sprite('v4.png',14*T,2*T+2);
sprite('wv2.png',11*T,9*T-4);
sprite('v5.png',3*T,10*T-10);
sprite('t11-south.png',4*T+12,10*T-6);
// ordena por camada e desenha
layer.sort((a,b)=>a[3]-b[3]);for(const [x,y,c] of layer)put(x,y,c);

const o=new PNG({width:W*SC,height:H*SC});
for(let y=0;y<H*SC;y++)for(let x=0;x<W*SC;x++){const s=((((y/SC)|0)*W)+((x/SC)|0))*4,d=(y*W*SC+x)*4;o.data[d]=img[s];o.data[d+1]=img[s+1];o.data[d+2]=img[s+2];o.data[d+3]=255}
fs.writeFileSync(out,PNG.sync.write(o));console.log(out,W*SC+'x'+H*SC);
