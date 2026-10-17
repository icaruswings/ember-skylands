"""Native phone charge into grotto entrances; real toast/save/reload integration."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

SOURCE = Path('dist/game/lands.js').read_text()
# Fixture changes initial spawn only, so a long approach does not dominate software WebGL time.
SOURCE += '''\nfor (const land of LANDS) {
 const s=land.secrets[0];
 land.spawn={x:s.entry[0],z:s.entry[1],y:groundHeight(land,s.entry[0],s.entry[1])};
}\n'''

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=1)
    context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/game/lands.js', lambda route: route.fulfill(status=200, content_type='text/javascript', body=SOURCE))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle')
    page.wait_for_function('window.ember !== undefined',timeout=60000)
    page.locator('#start-button').tap()
    cdp = context.new_cdp_session(page)
    for land,secret in [('artisans','waterfall-grotto'),('peace-keepers','canyon-cache'),('magic-crafters','frozen-observatory')]:
        if land != 'artisans':
            page.locator('#worlds-button').tap()
            page.locator('[data-land="'+land+'"]').tap()
        page.wait_for_function('(id)=>ember.snapshot().world===id && ember.snapshot().mode===\'playing\'',arg=land,timeout=60000)
        assert page.evaluate('ember.snapshot().secrets')==0
        r=page.locator('[data-action="charge"]').bounding_box()
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':1}]})
        page.wait_for_function('ember.snapshot().secrets===1',timeout=60000)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        page.wait_for_function('!ember.snapshot().player.charging && Math.hypot(ember.snapshot().player.vx,ember.snapshot().player.vz)===0',timeout=30000)
        assert 'Secret found:' in page.locator('#toast').inner_text()
        saved=page.evaluate("JSON.parse(localStorage.getItem('ember-skylands-save-v1'))")
        assert saved['worlds'][land]['secrets']==[secret],saved
        assert page.evaluate('ember.snapshot().player.health')==3
        page.screenshot(path='docs/layout-phone-secret-'+land+'.png')
        page.reload(wait_until='networkidle')
        page.wait_for_function('window.ember !== undefined',timeout=60000)
        assert page.evaluate('ember.snapshot().secrets')==1
        page.locator('#start-button').tap()
        assert not errors,errors
        print('PHONE SECRET/SAVE/RELOAD PASS',land,secret,flush=True)
    context.close()
    browser.close()
