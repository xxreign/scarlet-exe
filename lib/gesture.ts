export type Pt={x:number,y:number,z:number};
export type Hand={pts:Pt[],p:Pt,open:number,speed:number,id:number,label:string,normal:Pt,center:Pt,reliable:boolean,visibility:number};
export const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
export const smooth=(a:number,b:number,x:number)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v)};
export const dist=(a:Pt,b:Pt)=>Math.hypot(a.x-b.x,a.y-b.y);
const sub=(a:Pt,b:Pt):Pt=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a:Pt,b:Pt)=>a.x*b.x+a.y*b.y+a.z*b.z;
const mag=(a:Pt)=>Math.hypot(a.x,a.y,a.z);
const cross=(a:Pt,b:Pt):Pt=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const unit=(v:Pt,sign=1)=>{let n=mag(v)||1;return{x:sign*v.x/n,y:sign*v.y/n,z:sign*v.z/n}};
export const orientation=(n:Pt)=>n.z<-.38?'FRONT':n.z>.38?'BACK':'SIDE';
export function measure(pts:Pt[],world:Pt[]|undefined,label:string,aspect:number,p:Pt){
 const projected=pts.map(v=>({x:v.x,y:v.y/aspect,z:v.z}));
 const valid=world?.length===21&&world.every(v=>Number.isFinite(v.x+v.y+v.z));
 const g=valid?world!:projected;
 // Raw (unmirrored) video coordinates: x right, y down, z away. The display
 // mirror is applied later to BOTH geometry and camera; it cannot flip a gesture.
 const n=cross(sub(g[5],g[17]),sub(g[9],g[0]));
 const reliable=!!valid&&mag(n)>.00045;const normal=unit(reliable?n:cross(sub(projected[5],projected[17]),sub(projected[9],projected[0])),label==='Right'?1:-1);
 // World landmarks are centered on each hand. Reconstruct a shared camera
 // frame from several projected bone lengths (weak perspective, focal≈frame width).
 const depths:number[]=[];
 if(valid)for(const [a,b] of [[0,5],[0,9],[0,17],[5,17]]){const im=dist(projected[a],projected[b]);if(im>.012)depths.push(dist(g[a],g[b])/im)}
 depths.sort((a,b)=>a-b);const z=Math.max(.18,Math.min(2.2,depths.length?depths[Math.floor(depths.length/2)]:.08/Math.max(.04,dist(projected[0],projected[9]))));
 const center={x:(p.x-.5)*z,y:(p.y-.5)*z/aspect,z};
 const open=[8,12,16,20].reduce((s,i)=>{const len=mag(sub(g[i-2],g[i-3]))+mag(sub(g[i-1],g[i-2]))+mag(sub(g[i],g[i-1]));return s+smooth(.39,.82,mag(sub(g[i],g[i-3]))/(len||1))},0)/4;
 return {normal,center,open,reliable};
}
export class GestureRecognizer{
 phase:'TWO_HAND_ORB'|'POWER_ASCEND'|'SINGLE_PALM_MAGIC'|'IDLE'='IDLE';
 sphere=0;power=0;held=0;raiseHold=0;eyes=false;armed=false;facing=false;miss=0;burst=0;
 update(h:Hand[],shoulder:number|undefined,dt:number,aspect:number){
 const pair=h.length===2;let mutual=false,inward=[0,0],strength=0;
 if(pair){let [a,b]=h;let delta=sub(b.center,a.center);const planar=Math.hypot(delta.x,delta.y);
 // Relative monocular depth is noisier than lateral separation, especially edge-on.
 delta.z=Math.max(-planar*.65,Math.min(planar*.65,delta.z));let direction=unit(delta);
 const gap=Math.hypot((b.p.x-a.p.x)*aspect,b.p.y-a.p.y);
 inward=h.map((v,j)=>{const signed=dot(v.normal,direction)*(j?-1:1);
 if(v.reliable)return signed;
 // Only approximate an ambiguous edge-on palm; never rescue a confident back or outward normal.
 const into=(j?-1:1)*((v.pts[12].x-v.p.x)*aspect*direction.x+(v.pts[12].y-v.p.y)*direction.y);
 return Math.abs(v.normal.z)<.58&&signed>-.08&&into>.018?Math.max(signed,.38):signed});
 const hold=this.armed;mutual=gap>(hold?.035:.055)&&gap<(hold?1.23:1.11)&&Math.min(a.open,b.open)>(hold?.14:.23)&&Math.min(...inward)>(hold?.11:.25)&&Math.max(...inward)>(hold?.27:.42);
 strength=1-smooth(.90,1.23,gap);
 }
 this.facing=mutual;
 this.held=mutual?this.held+dt:0;this.miss=mutual?0:this.miss+dt;
 if(this.held>=.32)this.armed=true;if(this.miss>.18)this.armed=false;
 this.sphere=mix(this.sphere,this.armed?(mutual?strength:this.sphere):0,1-Math.exp(-dt*(this.armed?7:5)));
 for(let i=0;i<h.length;i++){const hand=h[i];let front=-hand.normal.z;
 const solo=.17*smooth(-.38,.00,front)+.83*smooth(.06,.68,front);
 const target=mutual?Math.max(solo,smooth(.12,.74,inward[i])):solo;
 hand.visibility=mix(hand.visibility,target,1-Math.exp(-dt*(target<hand.visibility?9:12)))}
 const raised=pair&&shoulder!==undefined&&h.every(v=>v.p.y<shoulder+(this.eyes?.018:-.018));
 this.raiseHold=raised?this.raiseHold+dt:0;if(!raised)this.eyes=false;else if(this.raiseHold>=.4)this.eyes=true;
 this.power=mix(this.power,this.eyes?1:0,1-Math.exp(-dt*(this.eyes?5.5:4.5)));
 this.phase=this.armed?'TWO_HAND_ORB':this.eyes?'POWER_ASCEND':h.some(v=>v.visibility>.12)?'SINGLE_PALM_MAGIC':'IDLE';
 }
}
