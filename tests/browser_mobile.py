from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:true}))")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-intro.png')
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.locator('#start-button').tap();page.wait_for_function("ember.snapshot().mode === 'playing'")
 assert page.locator('#joystick').is_visible()
 joy=page.locator('#joystick').bounding_box();x=joy['x']+joy['width']/2;y=joy['y']+joy['height']/2
 cdp=context.new_cdp_session(page)
 def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
 touch('touchStart',[{'x':x,'y':y,'id':1}]);touch('touchMove',[{'x':x+30,'y':y,'id':1}])
 page.wait_for_function('ember.snapshot().player.x > .6')
 charge=page.locator('[data-action="charge"]').bounding_box();cx=charge['x']+charge['width']/2;cy=charge['y']+charge['height']/2
 touch('touchStart',[{'x':x+30,'y':y,'id':1},{'x':cx,'y':cy,'id':2}]);page.wait_for_function('ember.snapshot().player.charging')
 touch('touchEnd',[]);page.wait_for_function('!ember.snapshot().player.charging && ember.snapshot().player.vx === 0')
 # Very short taps must still register between rendered frames.
 page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.y > .1',timeout=12000)
 page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.gliding',timeout=12000)
 page.locator('#pause-button').tap();assert page.locator('#dialog-layer').is_visible();page.locator('#resume-button').tap()
 page.locator('#map-button').tap();assert page.locator('#big-map').is_visible();page.locator('#map-done').tap()
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-game.png')
 print('PORTRAIT',json.dumps(page.evaluate('ember.snapshot()')),flush=True)
 page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(500)
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert page.locator('#joystick').bounding_box()['y']+page.locator('#joystick').bounding_box()['height']<390
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-landscape.png')
 assert not errors,errors
 print('MOBILE PASS: multitouch movement + charge, rapid jump/glide, pause, map, portrait/landscape',flush=True)
 browser.close()
