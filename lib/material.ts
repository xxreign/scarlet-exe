// A single animated atlas shares one GPU pass between both hands and the sphere.
// Rows: absorbing wisps, diffuse emission. Columns: palm, sphere.
export function materialAtlas(canvas:HTMLCanvasElement){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)return null;
 const program=gl.createProgram()!;
 const src=`precision highp float;varying vec2 uv;uniform float clock;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.23,.12,.53));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 f=fract(p),i=floor(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+1.),f.x),f.y),f.z);}
 mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
 void main(){bool sphere=uv.x>.5,emit=uv.y<.5;vec2 q=fract(uv*2.)*2.-1.;float t=clock*.39+(sphere?2.3:0.);float r=length(q);if(r>1.){gl_FragColor=vec4(0);return;}
 vec3 sum=vec3(0.);float alpha=0.;for(int i=0;i<12;i++){float z=(float(i)-5.5)*.13;vec3 p=vec3(q,z);p.xz*=rot(.35*t);p.yz*=rot(.4);float n=noise(p*2.8+vec3(0,.25*t,0));p.xy*=rot(n*3.7-.5*t+1.3*length(p));float a=noise(p*5.4+vec3(n,t*.18,n));float b=noise(p*11.+vec3(a*1.8,n,a));float v=.52*n+.34*a+.14*b;
 float rr=length(vec3(q,z))+(v-.5)*.52;
 float env=(1.-smoothstep(.10,.92,rr))*(1.-smoothstep(.80,1.,r));
 float billow=smoothstep(.29,.72,.55*v+.30*a+.15*b);
 if(emit){float core=exp(-dot(q+vec2(n-.5,a-.5)*.27,q+vec2(n-.5,a-.5)*.27)*(sphere?5.:7.));sum+=env*core*(.025+.37*billow)*vec3(.99,.042,.064);}
 else{float den=env*(.025+.45*billow);vec3 dye=mix(vec3(.26,.016,.053),vec3(.73,.061,.095),billow);sum+=(1.-alpha)*dye*den;alpha+=(1.-alpha)*den;}}
 if(emit){sum=1.-exp(-sum*1.5);alpha=max(sum.r,max(sum.g,sum.b));}gl_FragColor=vec4(sum,alpha);}`;
 let shaders=['attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}',src].map((s,i)=>{let sh=gl.createShader(i?gl.FRAGMENT_SHADER:gl.VERTEX_SHADER)!;gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh)||'VFX shader');gl.attachShader(program,sh);return sh});gl.linkProgram(program);gl.useProgram(program);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);let loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);let time=gl.getUniformLocation(program,'clock');
 return {draw(t:number){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(time,t);gl.drawArrays(gl.TRIANGLES,0,3)},close(){gl.deleteBuffer(b);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext()}}
}
