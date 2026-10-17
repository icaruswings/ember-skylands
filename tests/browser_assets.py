from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1100,'height':760},device_scale_factor=1)
 context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
 skins=page.evaluate("""async () => {
  const {createDragon}=await import('./game/assets.js');
  const dragon=createDragon(); let resolution=0,normalResolution=0;
  dragon.traverse(o=>{if(o.isMesh && o.material.map?.image) resolution=Math.max(resolution,o.material.map.image.width);
   if(o.isMesh && o.material.normalMap?.image) normalResolution=Math.max(normalResolution,o.material.normalMap.image.width);
  });
  return {resolution,normalResolution};
 }""")
 assert skins['resolution'] >= 1024, f'Expected a loaded high-resolution dragon skin; got {skins}'
 assert skins['normalResolution'] == 512, f'Expected bounded relief normal map; got {skins}'
 print('HIGH-RESOLUTION SKIN PASS:',skins,flush=True)
 page.locator('#start-button').click();page.wait_for_function("ember.snapshot().mode === 'playing'")
 page.locator('#toast').wait_for(state='hidden')
 assert page.evaluate('ember.snapshot().drawCalls') < 450
 assert page.evaluate('ember.snapshot().triangles') < 400000
 page.screenshot(path='/workspace/sites/ember-skylands/docs/polish-world.png')
 print('ART WORLD BUDGET:',json.dumps(page.evaluate('ember.snapshot()')),flush=True)
 # A test-only asset viewer isolates silhouettes and UV surfaces from gameplay.
 gallery='''<!doctype html><html><body style="margin:0;background:#e8e6db"><canvas id="preview"></canvas><script type="module">
 import * as T from '/assets/three.module.js';
 import {createDragon,createSentinel} from '/game/assets.js';
 import {createTree} from '/game/trees.js';
 import {loadArtTextures} from '/game/surfaces.js';
 import {loadModelFiles} from '/engine/models.js';
 await loadArtTextures();await loadModelFiles();
 const kind=new URLSearchParams(location.search).get('model');
 const model=kind==='dragon'?createDragon():kind==='tree'?createTree(3201):createSentinel(kind);
 const scene=new T.Scene();scene.background=new T.Color(0xe8e6db);scene.add(model);
 const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const camera=new T.PerspectiveCamera(36,1100/760,.05,100);
 const radius=Math.max(size.y,size.x*.72,size.z*.72);
 camera.position.copy(center).add(new T.Vector3(1,.5,1.5).normalize().multiplyScalar(radius*2.3));camera.lookAt(center);
 scene.add(new T.HemisphereLight(0xe2f7ff,0x6d6b56,1.5));
 const sun=new T.DirectionalLight(0xffe8c4,2.4);sun.position.set(-4,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.04;scene.add(sun);
 const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:0xd5d4bd,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);
 const renderer=new T.WebGLRenderer({canvas:document.getElementById('preview'),antialias:true});renderer.setSize(1100,760);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.render(scene,camera);window.galleryReady=true;
 </script></body></html>'''
 page.route('**/art-preview?*',lambda route:route.fulfill(status=200,content_type='text/html',body=gallery))
 for kind in ['dragon','armor','giant','tree']:
  page.goto('http://127.0.0.1:4173/art-preview?model='+kind,wait_until='networkidle');page.wait_for_function('window.galleryReady')
  page.screenshot(path='/workspace/sites/ember-skylands/docs/polish-model-'+kind+'.png')
  print('ASSET PREVIEW PASS:',kind,flush=True)
 assert not errors,errors
 browser.close()
