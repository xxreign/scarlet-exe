import {clamp,mix,type Hand} from './gesture';
import type {Effects} from './vfx';
type V={x:number,y:number};
type Stamp=(p:V,r:number,angle:number,alpha:number,sphere?:boolean,hot?:boolean,stretch?:number)=>void;
type Halo=(p:V,r:number,color:string,alpha:number)=>void;
const distance=(a:V,b:V)=>Math.hypot(a.x-b.x,a.y-b.y);
const hash=(i:number)=>{const x=Math.sin(i*78.233+12.9898)*43758.5453;return x-Math.floor(x)};

export function atmosphere(){
 let center={x:0,y:0},radius=0,angle=0,prev=0,clock=0;
 const wakes=new Map<number,V>();
 return function draw(map:(v:V)=>V,h:Hand[],orb:number,now:number,q:number,height:number,set:Effects,stamp:Stamp,halo:Halo){
  const dt=Math.min(.08,now-prev);prev=now;clock+=dt*set.motion/100;
  const t=clock,chaos=set.style==='chaos',master=Math.min(2,set.intensity/35);
  function dust(p:V,r:number,seed:number,gain:number){
   const count=Math.round(set.density*(chaos?.48:.42)*q);
   for(let i=0;i<count;i++){
    const s=seed+i*5,age=(hash(s)+t*(.055+hash(s+1)*.06))%1;
    const x=(hash(s+2)-.5)*r*.94+r*.13*Math.sin(age*3+hash(s+3)*6);
    const y=(hash(s+4)-.24-age*.87)*r;
    halo({x:p.x+x,y:p.y+y},Math.max(1.3,r*(.013+.014*hash(s+1))),'232,46,50',gain*Math.sin(Math.PI*age)**2*.75);
   }
  }
  const ids=new Set<number>();
  for(const hand of h){
   ids.add(hand.id);const p=map(hand.p),old=wakes.get(hand.id)||p,k=1-Math.exp(-dt*7);
   const wake={x:mix(old.x,p.x,k),y:mix(old.y,p.y,k)};wakes.set(hand.id,wake);
   const v=hand.visibility*master;if(v<.005)continue;
   const wrist=map(hand.pts[0]),size=Math.max(8,distance(wrist,map(hand.pts[9])))*(chaos?1.2:1);
   const rot=Math.atan2(p.y-wrist.y,p.x-wrist.x),s=hand.id*1.73;
   const pulse=.94+.043*Math.sin(t*1.37+s)+.023*Math.sin(t*2.14+s*.5);
   halo(p,size*.82,'184,12,34',v*pulse*.29*set.glow/30);
   stamp(wake,size*.93,rot+.12*Math.sin(t+s),v*.35*set.smoke/40,false,false,1.13);
   // Soft volumes drift between the palm and finger bases; no geometry joins them.
   for(let j=0;j<3;j++){
    const tip=map(hand.pts[[4,8,16][j]]),u=.20+.13*Math.sin(t*.74+j*2+s);
    const plume={x:mix(wake.x,tip.x,u)+size*.10*Math.sin(t+j*3+s),y:mix(wake.y,tip.y,u)-size*.12};
    stamp(plume,size*(.47+.08*j),rot+.4*Math.sin(t*.6+j),v*.23*set.smoke/40,false,false,1.28);
   }
   stamp(p,size*.60,rot,v*pulse*.48*set.core/25,false,true);
   dust(wake,size,17+hand.id*31,v);
  }
  for(const id of wakes.keys())if(!ids.has(id))wakes.delete(id);
  if(h.length===2){
   const a=map(h[0].p),b=map(h[1].p),gap=distance(a,b);
   center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};radius=mix(radius||gap*.15,Math.min(gap*.18,height*.087),1-Math.exp(-dt*10));angle=Math.atan2(b.y-a.y,b.x-a.x);
  }
  if(orb>.006&&radius>1){
   const v=orb*master,r=radius*(chaos?1.35:1),compression=1-clamp(radius/(height*.087));
   stamp(center,r*1.4,angle+.11*t,v*.55*set.smoke/40,true,false,1.12);
   halo(center,r*1.05,'187,16,37',v*.33*set.glow/30);
   stamp(center,r*1.06,-angle+.08*t,v*(.53+.22*compression)*set.core/25,true,true);
   dust(center,r,213,v*.83);
  }
 };
}
