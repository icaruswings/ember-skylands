"""Review actual game scenery from overview and secret-entry cameras (test-only page)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

VIEWER = '''<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#d5e0d8;font:16px system-ui;color:#fdf8e8}canvas{display:block;width:100vw;height:100vh}
aside{position:absolute;top:28px;left:32px;text-shadow:0 2px 10px #34473c}h1{margin:0;font:38px Georgia}p{margin:8px 0}
</style></head><body><canvas id="review"></canvas><aside><h1 id="name"></h1><p id="caption"></p></aside><script type="module">
import {GameRenderer} from '/engine/renderer.js';
import {Simulation} from '/engine/simulation.js';
import {getLand} from '/game/lands.js';
import {loadArtTextures} from '/game/surfaces.js';
import {loadModelFiles} from '/engine/models.js';
await loadArtTextures();await loadModelFiles();
const land=getLand(new URLSearchParams(location.search).get('land'));
const sim=new Simulation(land),render=new GameRenderer(document.getElementById('review'),land);
render.setQuality('high');
render.update(0,sim,true,0,false);
// All enemies are visible in this overview, rather than culled around the player.
for(const m of render.world.enemyMeshes.values())m.visible=true;
render.camera.fov=45;render.camera.far=1200;render.camera.updateProjectionMatrix();
render.camera.position.set(85,115,115);render.camera.lookAt(0,0,-4);
render.renderer.render(render.scene,render.camera);
document.getElementById('name').textContent=land.name;
document.getElementById('caption').textContent=land.loopName+' · layout overview';
window.review={land,sim,render};window.reviewReady=true;
</script></body></html>'''

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width':1200,'height':900}, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/layout-review?*', lambda route: route.fulfill(status=200, content_type='text/html', body=VIEWER))
    for land in ['artisans','peace-keepers','magic-crafters']:
        page.goto('http://127.0.0.1:4173/layout-review?land='+land,wait_until='networkidle')
        page.wait_for_function('window.reviewReady',timeout=60000)
        page.screenshot(path='docs/layout-overview-'+land+'.png')
        print('OVERVIEW PASS',land,flush=True)
        for index in range(2):
            result=page.evaluate('''(index)=>{
              const {sim,land,render}=review,s=land.secrets[index];
              // Approach through the real entry using simulation inputs and real walls.
              Object.assign(sim.player,{x:s.entry[0],z:s.entry[1],y:0,vx:0,vz:0,vy:0,grounded:true});
              const drive=()=>{for(let i=0;i<360;i++){
                const dx=s.x-sim.player.x,dz=s.z-sim.player.z,d=Math.hypot(dx,dz);
                if(d<1)break;
                sim.update(1/60,{x:dx/d,z:dz/d,charge:d>4,flame:i%45<20});
              }};
              // Set feet to the shared height surface before entering.
              sim.player.y=land.secrets[index].y;
              drive();
              const events=sim.drain().filter(e=>e.type==='secret'&&e.id===s.id);
              render.update(0,sim,true,0,false);
              const gameCamera={x:render.camera.position.x,y:render.camera.position.y,z:render.camera.position.z};
              render.camera.fov=48;render.camera.updateProjectionMatrix();
              render.camera.position.set(s.x+8,s.y+7,s.z+19);render.camera.lookAt(s.x,s.y+2,s.z-1);
              render.renderer.render(render.scene,render.camera);
              document.getElementById('caption').textContent=s.name+' · optional treasure pocket';
              return {id:s.id,discovered:sim.discovered.has(s.id),events:events.length,
                distance:Math.hypot(sim.player.x-s.x,sim.player.z-s.z),health:sim.player.health,gameCamera};
            }''', index)
            assert result['discovered'] and result['events']==1 and result['distance']<1.1,result
            assert result['health']==3,result
            page.screenshot(path='docs/layout-secret-'+result['id']+'.png')
            print('SECRET ENTRY PASS',land,json.dumps(result),flush=True)
    assert not errors,errors
    context.close()
    browser.close()
