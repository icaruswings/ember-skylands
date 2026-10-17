"""Real phone touch checks for the new jump feel, turn animation and painted assets."""
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
        args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
    context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle')
    page.wait_for_function('window.ember !== undefined',timeout=60000)
    page.locator('#start-button').tap()
    page.wait_for_function("ember.snapshot().mode==='playing' && ember.snapshot().player.grounded")
    # Test-only observation samples the public read-only snapshot, without editing the sim.
    def watch_jump():
        page.evaluate('''() => {
          const p=ember.snapshot().player;window.jumpProbe={base:p.y,peak:0,air:false,done:false};
          function sample(){const p=ember.snapshot().player,q=window.jumpProbe;
            q.peak=Math.max(q.peak,p.y-q.base);q.air=q.air||!p.grounded;
            if(q.air&&p.grounded)q.done=true;else requestAnimationFrame(sample);}
          requestAnimationFrame(sample);
        }''')
    watch_jump();page.locator('[data-action="jump"]').tap()
    page.wait_for_function('jumpProbe.done',timeout=60000);tap=page.evaluate('jumpProbe.peak')
    cdp=context.new_cdp_session(page)
    def center(selector,i=1):
        b=page.locator(selector).bounding_box();return {'x':b['x']+b['width']/2,'y':b['y']+b['height']/2,'id':i}
    def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
    watch_jump();jump=center('[data-action="jump"]');touch('touchStart',[jump])
    page.wait_for_function('ember.snapshot().player.vy<0 && !ember.snapshot().player.grounded',timeout=60000)
    touch('touchEnd',[]);page.wait_for_function('jumpProbe.done',timeout=60000);held=page.evaluate('jumpProbe.peak')
    assert held>tap+.45,(tap,held)
    print('TOUCH JUMP PASS:',json.dumps({'tapHeight':tap,'heldHeight':held}),flush=True)
    # CDP sends the two taps without Playwright actionability waits between them.
    # A late tap within 0.5 units of landing intentionally queues a landing jump.
    jump=center('[data-action="jump"]')
    touch('touchStart',[jump]);page.wait_for_function('ember.snapshot().player.vy>3 && !ember.snapshot().player.grounded')
    touch('touchEnd',[])
    print('GLIDE TOUCH START:',json.dumps(page.evaluate('ember.snapshot().player')),flush=True)
    touch('touchStart',[{**jump,'id':3}]);touch('touchEnd',[])
    page.wait_for_function('ember.snapshot().player.gliding')
    print('GLIDE TOUCH PASS:',json.dumps(page.evaluate('ember.snapshot().player')),flush=True)
    touch('touchStart',[{**jump,'id':4}]);touch('touchEnd',[])
    page.wait_for_function('!ember.snapshot().player.gliding')
    page.wait_for_function('ember.snapshot().player.grounded',timeout=60000)
    joy=center('#joystick');right={**joy,'x':joy['x']+30};charge=center('[data-action="charge"]',2)
    touch('touchStart',[joy]);touch('touchMove',[right]);touch('touchStart',[right,charge])
    page.wait_for_function('ember.snapshot().player.chargeBlend>.5 && Math.abs(ember.snapshot().player.turnRate)>.2',timeout=30000)
    touch('touchEnd',[])
    page.wait_for_function('Math.hypot(ember.snapshot().player.vx,ember.snapshot().player.vz)===0 && ember.snapshot().player.chargeBlend<.01',timeout=30000)
    stride=page.evaluate('ember.snapshot().player.stride');began=page.evaluate('ember.snapshot().adventureTime')
    page.wait_for_function('(t)=>ember.snapshot().adventureTime>t+.3',arg=began,timeout=30000)
    assert page.evaluate('ember.snapshot().player.stride')==stride
    print('TOUCH MOTION PASS: glide toggles, eased turn, release stop and idle stride',flush=True)
    assets=page.evaluate('''async () => {
      const {createDragon}=await import('./game/assets.js');
      const {surface}=await import('./game/surfaces.js');
      const d=createDragon();let triangles=0,vertices=0;
      d.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;vertices+=o.geometry.attributes.position.count;}});
      return {triangles,vertices,skins:['masonry','wood','roof','armor'].map(k=>({kind:k,width:surface(k).map?.image.width,normal:surface(k).normalMap?.image.width}))};
    }''')
    assert 20000<assets['triangles']<26000 and assets['vertices']/assets['triangles']<1.25,assets
    assert all(s['width']>=600 and s['normal']==512 for s in assets['skins']),assets
    print('PAINTED ASSET PASS:',json.dumps(assets),flush=True)
    page.locator('[data-action="flame"]').tap();page.wait_for_function('ember.snapshot().fireActive')
    page.locator('#pause-button').tap();page.locator('#resume-button').wait_for(state='visible')
    frozen=page.evaluate('ember.snapshot()');page.wait_for_timeout(400);after=page.evaluate('ember.snapshot()')
    assert frozen['adventureTime']==after['adventureTime'] and frozen['dragonPose']==after['dragonPose']
    page.locator('#resume-button').tap()
    assert not errors,errors
    print('POLISH PHONE PASS: actual touch movement, dense loaded models, painted maps, fire and paused rig',flush=True)
    context.close();browser.close()
