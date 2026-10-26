import * as THREE from 'three';
export function createAtelier(canvas){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{return {update(){},motion(){},spin(){}}}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,100);camera.position.set(10,9,13);camera.lookAt(0,1,0);
 const group=new THREE.Group();scene.add(group);
 const ivory=new THREE.MeshStandardMaterial({color:'#eee7de',roughness:.95});
 const blush=new THREE.MeshStandardMaterial({color:'#edb29b',roughness:.8});
 const blue=new THREE.MeshStandardMaterial({color:'#7987ba',roughness:.7});
 const paper=new THREE.MeshStandardMaterial({color:'#e9d9df',transparent:true,opacity:.64,roughness:1,side:THREE.DoubleSide});
 const glass=new THREE.MeshPhysicalMaterial({color:'#b9c8de',roughness:.12,metalness:.03,transparent:true,opacity:.3,side:THREE.DoubleSide});
 function box(w,h,d,x,y,z,mat=ivory){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 const base=new THREE.Mesh(new THREE.CylinderGeometry(4.5,4.5,.28,80),ivory);base.receiveShadow=true;base.position.y=-.15;group.add(base);
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(5,5,.08,80),new THREE.MeshStandardMaterial({color:'#dad4e3',transparent:true,opacity:.45}));disc.position.y=-.4;group.add(disc);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(4.9,.014,8,120),blue);ring.rotation.x=Math.PI/2;ring.position.y=-.22;group.add(ring);
 for(let i=0;i<5;i++)box(4.2,.16,1.0-i*.12,0,-.1+i*.11,3.8-i*.3);
 // Open portico, a ring aperture and overlapping paper screens.
 const arch=new THREE.Mesh(new THREE.TorusGeometry(2.25,.32,16,64,Math.PI),ivory);arch.position.set(0,2,-2);group.add(arch);
 box(.64,2,.64,-2.25,1,-2);box(.64,2,.64,2.25,1,-2);
 const disk=new THREE.Mesh(new THREE.CircleGeometry(1.3,64),new THREE.MeshBasicMaterial({color:'#e99c80',transparent:true,opacity:.75,side:THREE.DoubleSide}));disk.position.set(0,2.1,-2.36);group.add(disk);
 const aperture=new THREE.Mesh(new THREE.TorusGeometry(.95,.08,12,64),blue);aperture.position.set(-2.4,1.65,.1);aperture.rotation.y=Math.PI/3;group.add(aperture);
 for(let i=0;i<17;i++){
 const fold=new THREE.Mesh(new THREE.PlaneGeometry(.2,3),paper);fold.position.set(2.65+i*.04,1.65,-1.8+i*.16);fold.rotation.y=i%2?.3:-.3;group.add(fold);
 }
 box(3.1,.14,1.4,0,1.05,0);box(.2,1,.5,-1.1,.5,0);box(.2,1,.5,1.1,.5,0);
 for(const [x,z] of [[-1.1,1.5],[1.1,1.5],[-1.1,-1.1],[1.1,-1.1]]){
 const stool=new THREE.Mesh(new THREE.CylinderGeometry(.36,.3,.58,32),blush);stool.position.set(x,.29,z);stool.castShadow=true;group.add(stool);
 }
 box(.8,.025,.5,-.6,1.14,0,blue);box(.5,.025,.6,.7,1.14,.1,blush);
 const floatSheet=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.3),glass);floatSheet.position.set(-1.8,3.3,1.3);floatSheet.rotation.set(-.2,.25,.2);group.add(floatSheet);
 const orbGroup=new THREE.Group();group.add(orbGroup);const orbs=[];
 const orbPositions=[[-1.6,.8,1.1],[1.55,.8,.7],[0,.8,-1.5],[-2.1,.8,-1.3]];
 for(let i=0;i<4;i++){
 const c=['#e79a7d','#879ac9','#9bb3a0','#b9a2bf'][i];const g=new THREE.Group();g.position.set(...orbPositions[i]);
 const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,4),new THREE.MeshPhysicalMaterial({color:c,roughness:.1,metalness:.1,transparent:true,opacity:.8}));g.add(sphere);
 for(let j=0;j<3;j++){const halo=new THREE.Mesh(new THREE.TorusGeometry(.48+j*.2,.008,6,64),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.5-j*.12}));halo.rotation.x=Math.PI/2;halo.position.y=-.65+j*.005;g.add(halo);}
 orbGroup.add(g);orbs.push(g);
 }
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:'#827992',opacity:.11}));ground.rotation.x=-Math.PI/2;ground.position.y=-.46;ground.receiveShadow=true;scene.add(ground);
 scene.add(new THREE.HemisphereLight('#fff5e9','#9ca3c4',2.8));
 const sun=new THREE.DirectionalLight('#ffe0c4',4);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.bias=-.001;scene.add(sun);
 const blueLight=new THREE.DirectionalLight('#9aacf2',2);blueLight.position.set(5,3,-5);scene.add(blueLight);
 let targetAngle=-.3,angle=-.3,pointer={x:0,y:0},active=2,conflict=false,enabled=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,frame=0;
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5}});
 canvas.addEventListener('pointerleave',()=>{pointer={x:0,y:0}});
 let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,start:targetAngle};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(drag)targetAngle=drag.start+(e.clientX-drag.x)*.006});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 const visibilityObserver=new IntersectionObserver(entries=>visible=entries[0].isIntersecting);visibilityObserver.observe(canvas);
 const resize=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
 let raf;function tick(t){raf=requestAnimationFrame(tick);if(!visible||document.hidden)return;if(++frame%2)return;const time=t*.001;angle+=(targetAngle-angle)*.06;group.rotation.y=angle+(enabled?pointer.x*.14:0);group.position.y=enabled?Math.sin(time*.5)*.025:0;floatSheet.rotation.z=.18+(enabled?Math.sin(time)*.08:0);orbs.forEach((o,i)=>{o.visible=i<active;o.children[0].position.y=enabled?Math.sin(time*(conflict?3:1)+i)*.09:0;o.scale.setScalar(conflict&&enabled?1+Math.sin(time*3+i)*.1:1)});renderer.render(scene,camera)}raf=requestAnimationFrame(tick);
 return {update({room=0,slot=3,count=2,isConflict=false}){active=Math.min(count,4);conflict=isConflict;paper.color.set(['#ead4db','#c4cde4','#cad4bf'][room]);disk.material.color.set(['#e99c80','#9baad1','#b1bf98'][room]);sun.position.x=-6+slot*3;sun.color.set(['#fff2db','#ffffff','#ffded0','#fbc29d'][slot]);sun.intensity=3.8-slot*.35;targetAngle=-.3+room*.45;},spin(){targetAngle+=Math.PI*.5},motion(on){enabled=on},destroy(){cancelAnimationFrame(raf);visibilityObserver.disconnect();resizeObserver.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});renderer.dispose();renderer.forceContextLoss()}};
}
export function createAmbience(){let context,gain,oscillators=[];return async function(on){if(!on){gain?.gain.setTargetAtTime(0,context.currentTime,.3);return;}if(!context){context=new AudioContext();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);[130.81,196,261.63,329.63].forEach((f,i)=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.018/(i+1);o.connect(g);g.connect(gain);o.start();oscillators.push(o)})}await context.resume();gain.gain.setTargetAtTime(.6,context.currentTime,.4)}}
