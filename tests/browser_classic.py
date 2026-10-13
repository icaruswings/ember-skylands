from playwright.sync_api import sync_playwright
from pathlib import Path
import json

BASE = 'http://127.0.0.1:4173'
LEVEL = Path('dist/game/level.js').read_text()

def game(browser, spawn=None, phone=False):
    context = browser.new_context(viewport={'width':844 if phone else 1100,'height':390 if phone else 760},
        is_mobile=phone,has_touch=phone,device_scale_factor=1)
    context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
    page=context.new_page(); errors=[]; model_requests=set()
    page.on('requestfinished',lambda r:model_requests.add(r.url.rsplit('/',1)[-1]) if '/models/' in r.url else None)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
    if spawn:
        # Fixture changes only the declarative initial spawn, never live simulation state.
        source=LEVEL.replace('spawn: { x: 0, z: 10, y: 0 }',f'spawn: {{ x: {spawn[0]}, z: {spawn[1]}, y: {spawn[2]} }}')
        assert source != LEVEL
        page.route('**/game/level.js',lambda r:r.fulfill(status=200,content_type='text/javascript',body=source))
    page.goto(BASE,wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
    page.locator('#start-button').click();page.wait_for_function("ember.snapshot().mode==='playing'")
    assert model_requests=={'dragon.glb','gnorc-normal.glb','gnorc-armor.glb','gnorc-giant.glb'}, model_requests
    return context,page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
        args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
    for phone in [False,True]:
        context,page,errors=game(browser,(4,9,0),phone)
        assert page.evaluate('ember.snapshot().chests')==0
        if phone:
            page.locator('[data-action="flame"]').tap()
        else:
            page.keyboard.press('KeyF')
        page.wait_for_function('ember.snapshot().chests===1 && ember.snapshot().singedGrass>0',timeout=30000)
        page.wait_for_function("JSON.parse(localStorage.getItem('ember-skylands-save-v1')).gems.some(g=>g.startsWith('chest-0-gem'))",timeout=30000)
        state=page.evaluate('ember.snapshot()')
        assert state['mode']=='playing';assert state['camera']['y']<3.5
        assert state['drawCalls']<330, state;assert state['triangles']<245000, state
        page.screenshot(path=f'docs/classic-{"phone" if phone else "desktop"}.png')
        before=state['singedGrass'];page.locator('#pause-button').click()
        page.wait_for_timeout(400)
        assert page.evaluate('ember.snapshot().singedGrass')==before
        page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
        assert page.evaluate('ember.snapshot().chests')==1
        assert not errors,errors
        print('CLASSIC TREASURE/FIRE/SAVE PASS', 'phone' if phone else 'desktop',json.dumps(state),flush=True)
        context.close()
    context,page,errors=game(browser,(12,4,0))
    page.keyboard.down('KeyW');page.wait_for_function('ember.snapshot().rescues===1',timeout=30000);page.keyboard.up('KeyW')
    assert page.evaluate('ember.snapshot().mode')=='playing'
    assert page.locator('#dialog-layer').is_hidden()
    page.wait_for_function("ember.snapshot().player.flame===0")
    page.screenshot(path='docs/classic-friend.png')
    saved=page.evaluate("JSON.parse(localStorage.getItem('ember-skylands-save-v1'))")
    assert saved['rescues']==['spirit-0']
    assert not errors,errors
    print('AUTOMATIC RESCUE/DANCE FLOW PASS',flush=True);context.close()
    context,page,errors=game(browser,(7,0,0))
    page.keyboard.down('ShiftLeft');page.keyboard.down('KeyW')
    page.wait_for_function('ember.snapshot().enemies>=1',timeout=30000)
    page.keyboard.up('KeyW');page.keyboard.up('ShiftLeft')
    page.wait_for_function("JSON.parse(localStorage.getItem('ember-skylands-save-v1')).gems.includes('enemy-0-gem')",timeout=30000)
    assert not errors,errors
    print('FLEEING ARMORED GNORC/CHARGE/GREEN DROP PASS',flush=True);context.close()
    context,page,errors=game(browser)
    page.keyboard.down('KeyD');page.wait_for_function('ember.snapshot().player.x>2',timeout=30000);page.keyboard.up('KeyD')
    page.wait_for_timeout(1400)
    state=page.evaluate('ember.snapshot()')
    import math
    dx=state['camera']['x']-state['player']['x'];dz=state['camera']['z']-state['player']['z']
    assert dx*math.sin(state['player']['angle'])+dz*math.cos(state['player']['angle'])<0
    assert not errors,errors
    print('LOW CAMERA TRAILING TURN PASS',json.dumps(state['camera']),flush=True)
    context.close();browser.close()
