import {atmosphere} from './atmosphere';
import {eyeLight} from './eyes';
import {materialAtlas} from './material';
import {clamp,type Hand,type Pt} from './gesture';
type V={x:number,y:number};type MapPt=(p:V)=>V;
export const high={style:'soft',intensity:35,density:15,glow:30,smoke:40,core:25,motion:45,eyes:65} as const;
export const maxChaos={style:'chaos',intensity:200,density:100,glow:200,smoke:200,core:150,motion:100,eyes:200} as const;
export type Effects={style:'soft'|'chaos',intensity:number,density:number,glow:number,smoke:number,core:number,motion:number,eyes:number};
export function liveVfx(){
 const drawAtmosphere=atmosphere(),atlas=document.createElement('canvas');
 atlas.width=atlas.height=320;
 const gpu=materialAtlas(atlas);let last=-10;
 return {draw(ctx:CanvasRenderingContext2D,map:MapPt,hands:Hand[],face:Pt[],_body:Pt[],P:number,S:number,_burst:number,t:number,q:number,set:Effects){
  if(!set.intensity)return;
  function halo(p:V,r:number,color:string,alpha:number){
   if(alpha<.002||r<.1)return;
   const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
   for(const [pos,gain] of [[0,1],[.36,.55],[.70,.12],[1,0]])g.addColorStop(pos,'rgba('+color+','+clamp(alpha*gain)+')');
   ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
  }
  function stamp(p:V,r:number,rot:number,alpha:number,sphere=false,hot=false,stretch=1){
   if(alpha<.003||r<1)return;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rot);ctx.scale(stretch,1/stretch);ctx.globalAlpha=clamp(alpha);
   if(gpu){const n=atlas.width/2;ctx.drawImage(atlas,sphere?n:0,hot?n:0,n,n,-r,-r,r*2,r*2)}
   else{for(let i=0;i<4;i++)halo({x:r*.17*Math.sin(t*.24+i*3.1),y:r*.21*Math.sin(t*.19+i*1.7)},r*(.56+i*.04),hot?'211,27,39':'134,12,30',.31)}
   ctx.restore();
  }
  if((hands.length||S>.006)&&t-last>1/(q<.67?16:24)){
   const side=q<.67?240:320;if(atlas.width!==side)atlas.width=atlas.height=side;
   gpu?.draw(t*set.motion/100);last=t;
  }
  ctx.save();drawAtmosphere(map,hands,S,t,q,ctx.canvas.height,set,stamp,halo);ctx.restore();
  eyeLight(ctx,map,face,P,set.eyes);
 },close(){gpu?.close();atlas.width=1}};
}
