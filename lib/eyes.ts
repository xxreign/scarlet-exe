import {clamp,smooth,type Pt} from './gesture';
type V={x:number,y:number};
export function eyeLight(ctx:CanvasRenderingContext2D,map:(v:V)=>V,face:Pt[],power:number,amount:number){
 if(!face[387]||power<.003||amount<=0)return;
 for(const [id,ids] of [[468,[33,160,159,158,133,153,145,144]],[473,[362,385,386,387,263,373,374,380]]] as [number,number[]][]){
 const eye=ids.map(i=>map(face[i])),a=eye[0],b=eye[4],width=Math.hypot(a.x-b.x,a.y-b.y);
 const iris=face[id+4]&&face[id],p=iris?map(iris):{x:(a.x+b.x+eye[2].x+eye[6].x)/4,y:(a.y+b.y+eye[2].y+eye[6].y)/4};
 let r=width*.20;if(iris){let a=map(face[id+1]),b=map(face[id+3]);r=Math.max(width*.12,Math.min(width*.28,Math.hypot(a.x-b.x,a.y-b.y)/2))}
 if(r<.4)continue;const k=clamp(power*amount/75)*smooth(.025,.18,Math.hypot(eye[2].x-eye[6].x,eye[2].y-eye[6].y)/width);
 function wash(size:number,inner:string,edge:string){let g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,size);g.addColorStop(0,inner);g.addColorStop(.55,edge);g.addColorStop(1,'rgba(190,0,37,0)');ctx.fillStyle=g;ctx.fillRect(p.x-size,p.y-size,size*2,size*2)}
 ctx.save();ctx.globalAlpha=k*.17;wash(r*2.1,'#f42745','#b81735');ctx.globalAlpha=k;ctx.beginPath();eye.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';wash(r*1.1,'rgba(242,14,49,.78)','rgba(211,3,42,.82)');ctx.globalAlpha=k*.65;wash(r*.36,'#ff958c','rgba(232,52,70,.52)');ctx.restore()
 }}
