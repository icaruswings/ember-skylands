from playwright.sync_api import sync_playwright
from pathlib import Path
import math
import json

BASE='http://127.0.0.1:4173'
LEVEL=Path('dist/game/level.js').read_text()

def open_game(browser,spawn,phone):
    context=browser.new_context(viewport={'width':844 if phone else 1100,'height':390 if phone else 760},is_mobile=phone,has_touch=phone,device_scale_factor=1)
    context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
    source=LEVEL.replace('spawn: { x: 0, z: 10, y: 0 }',f'spawn: {{ x: {spawn[0]}, z: {spawn[1]}, y: {spawn[2]} }}')
    assert source!=LEVEL
    page.route('**/game/level.js',lambda r:r.fulfill(status=200,content_type='text/javascript',body=source))
    page.goto(BASE,wait_until='networkidle');page.wait_for_function('window.ember !== undefined',timeout=60000)
    page.locator('#start-button').click();page.wait_for_function("ember.snapshot().mode==='playing'")
    return context,page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
    context,page,errors=open_game(browser,(-7,-6,0),True)
    cdp=context.new_cdp_session(page)
    def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
    def move_start(dx,dz):
        r=page.locator('#joystick').bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
        angle=page.evaluate('ember.snapshot().camera.angle');cs=math.cos(angle);sn=math.sin(angle)
        d=math.hypot(dx,dz);x=(dx*cs-dz*sn)/d;z=(dz*cs+dx*sn)/d
        point={'x':cx+x*r['width']*.135,'y':cy+z*r['width']*.135,'id':1}
        touch('touchStart',[point]);return point
    def stop():touch('touchEnd',[])
    def walk(x,z):
        for attempt in range(8):
            state=page.evaluate('ember.snapshot().player');dx=x-state['x'];dz=z-state['z'];d=math.hypot(dx,dz)
            if d<.7:
                print('TOUCH WAYPOINT',x,z,json.dumps(state),flush=True);return
            move_start(dx,dz)
            # Stop by forward progress, then correct any camera movement between gestures.
            page.wait_for_function('(a)=>{const p=ember.snapshot().player;return (p.x-a.x)*a.dx+(p.z-a.z)*a.dz>a.distance}',arg={'x':state['x'],'z':state['z'],'dx':dx/d,'dz':dz/d,'distance':max(.1,d-.5)},timeout=60000)
            stop();page.wait_for_function('ember.snapshot().player.vx===0 && ember.snapshot().player.vz===0')
        raise AssertionError('Touch route could not reach '+str((x,z))+': '+str(page.evaluate('ember.snapshot().player')))
    walk(-13,-6);walk(-13,-3);walk(-15,-1);walk(-17,1)
    assert page.evaluate('ember.snapshot().player.y')>5.5
    page.locator('#pause-button').tap();page.locator('#resume-button').wait_for(state='visible')
    frozen=page.evaluate('({time:ember.snapshot().adventureTime,pose:ember.snapshot().dragonPose})')
    page.wait_for_timeout(600)
    assert page.evaluate('({time:ember.snapshot().adventureTime,pose:ember.snapshot().dragonPose})')==frozen
    page.screenshot(path='docs/watchtower-phone.png')
    page.locator('#resume-button').tap()
    state=page.evaluate('ember.snapshot().player');point=move_start(-30-state['x'],7-state['z'])
    # Real multitouch takeoff, followed by a touch glide tap with forward carry.
    def jump():
        r=page.locator('[data-action="jump"]').bounding_box()
        second={'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':2}
        touch('touchStart',[point,second]);touch('touchEnd',[])
    page.wait_for_function('ember.snapshot().player.vx<0 && ember.snapshot().player.vz>0')
    jump();page.wait_for_function('ember.snapshot().player.y>6.3')
    page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.gliding')
    page.wait_for_function('ember.snapshot().player.x < -27',timeout=60000)
    stop();page.locator('[data-action="jump"]').tap()
    page.wait_for_function('ember.snapshot().player.grounded && Math.abs(ember.snapshot().player.y-1)<.01',timeout=60000)
    assert page.evaluate('Math.hypot(ember.snapshot().player.x+30,ember.snapshot().player.z-7)<5.5')
    walk(-32,8)
    # Take a short northward step so the muzzle faces the chest.
    state=page.evaluate('ember.snapshot().player');move_start(0,-1)
    page.wait_for_function('(z)=>ember.snapshot().player.z<z-.15',arg=state['z']);stop()
    page.locator('[data-action="flame"]').tap()
    page.wait_for_function("JSON.parse(localStorage.getItem('ember-skylands-save-v1')).chests.includes('chest-secret')",timeout=30000)
    page.wait_for_function('ember.snapshot().player.flame===0')
    page.screenshot(path='docs/hidden-garden-phone.png')
    page.locator('#map-button').tap()
    assert page.locator('.realm-row').count()==4
    assert page.locator('.realm-row').last.inner_text().startswith('Hidden Garden')
    page.locator('#map-done').tap()
    saved=page.evaluate("JSON.parse(localStorage.getItem('ember-skylands-save-v1'))")
    page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
    assert page.evaluate('ember.snapshot().chests')==len(saved['chests'])
    assert not errors,errors
    print('NEXT PHONE PASS: touch ramp ascent, paused rig, multitouch jump/glide, hidden garden chest, four-realm map and saved progress',json.dumps(saved),flush=True)
    context.close()
    context,page,errors=open_game(browser,(-7,4,0),False)
    page.wait_for_function("ember.snapshot().enemyStates.some(e=>e.id==='enemy-1' && e.state==='windup')",timeout=30000)
    page.keyboard.press('KeyF')
    page.wait_for_function("JSON.parse(localStorage.getItem('ember-skylands-save-v1')).enemies.includes('enemy-1')",timeout=30000)
    assert page.evaluate('ember.snapshot().player.health')==3
    assert not errors,errors
    print('NEXT GIANT PASS: rendered windup interrupted by a real flame input',flush=True)
    context.close();browser.close()
