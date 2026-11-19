self.exports={};importScripts('/vision/tasks.js');const {FilesetResolver,HandLandmarker,FaceLandmarker,PoseLandmarker}=self.exports;
let hand,face,pose,faceIssue="",frame=0;
self.onmessage=async({data:d})=>{
try{
 if(d.init){const files=await FilesetResolver.forVisionTasks('/vision/wasm');
 const opts=(name)=>({baseOptions:{modelAssetPath:'/vision/'+name+'_landmarker.task',delegate:'CPU'},runningMode:'VIDEO'});
 hand=await HandLandmarker.createFromOptions(files,{...opts('hand'),numHands:2,minTrackingConfidence:.5});try{face=await FaceLandmarker.createFromOptions(files,opts('face'))}catch{faceIssue='face model could not initialize'}try{pose=await PoseLandmarker.createFromOptions(files,opts('pose'))}catch{/* The face estimate supplies shoulder height when pose is unavailable. */}self.postMessage({ready:true});return}
 const {bitmap,time}=d;try{let hands=hand.detectForVideo(bitmap,time),f,b;if(frame%2===0){try{f=face?.detectForVideo(bitmap,time).faceLandmarks[0]||[];if(face)faceIssue=''}catch{f=[];faceIssue='face inference failed'}}if(frame%5===1)b=pose?.detectForVideo(bitmap,time).landmarks[0]||[];frame++;self.postMessage({faceIssue,world:hands.worldLandmarks,labels:hands.handedness,hands:hands.landmarks,face:f,body:b,time})}finally{bitmap.close()}
}catch(e){self.postMessage({error:String(e)})}}
