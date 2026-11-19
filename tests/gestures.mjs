import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GestureRecognizer,measure,orientation} from '../lib/gesture.ts';
const frames=JSON.parse(readFileSync(new URL('./fixtures/normals.json',import.meta.url)));
const aspect=1.5,dt=1/30;
function hand(f,x=.5,y=.65,rotate=false,mirror=false){
 const sign=mirror?-1:1,world=f.world.map(p=>({x:sign*(rotate?-p.z:p.x),y:p.y,z:rotate?p.x:p.z}));
 const pts=world.map(p=>({x:x+p.x,y:y+p.y*aspect,z:p.z})),p={x,y,z:0},label=mirror?'Left':f.label;
 return {id:+mirror,label,p,pts,...measure(pts,world,label,aspect,p),visibility:0,speed:0}
}
function step(g,h,n=1){for(let i=0;i<n;i++)g.update(h,.51,dt,aspect)}
for(const mirrored of [false,true]){
 let a=hand(frames.palm,.5,.65,false,mirrored),b=hand(frames.back,.5,.65,false,mirrored);
 assert.equal(orientation(a.normal),'FRONT');assert.equal(orientation(b.normal),'BACK');
 let g=new GestureRecognizer();step(g,[a],30);assert(a.visibility>.96);b.visibility=a.visibility;step(g,[b]);assert(b.visibility>0&&b.visibility<a.visibility);step(g,[b],25);assert(b.visibility<.005);assert.equal(g.phase,'IDLE')
}
const g=new GestureRecognizer(),pair=(gap,y=.65)=>[hand(frames.palm,.5-gap/2,y,true),hand(frames.palm,.5+gap/2,y,true,true)];
let h=pair(.34);step(g,h,7);assert(!g.armed&&g.held>0);step(g,h,30);assert.equal(g.phase,'TWO_HAND_ORB');assert(g.sphere>.97);
step(g,pair(.15),20);assert(g.sphere>.98);step(g,pair(.55),20);assert(g.sphere>.98);step(g,pair(.90),40);assert(g.sphere<.01);
h=pair(.32);h.forEach(v=>v.normal.x*=-1);step(g,h,30);assert(!g.armed);
h=pair(.30,.30);step(g,h,30);assert.equal(g.phase,'TWO_HAND_ORB');assert(g.eyes);
const e=new GestureRecognizer();h=[hand(frames.back,.36,.29),hand(frames.back,.66,.27,false,true)];step(e,h,10);assert(!e.eyes);step(e,h,35);assert(!e.armed&&e.eyes&&e.power>.96);assert.equal(e.phase,'POWER_ASCEND');step(e,[h[0]],30);assert(!e.eyes&&e.power<.03);step(e,pair(.35,.66),30);assert(!e.eyes);
console.log('Passed: signed front/back for both hands, fading, sideways orb hold, distance release, outward rejection, independent raised eyes, state priority and lowering.');
