from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:true}))")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
 assert page.evaluate("Math.abs(document.getElementById('stage').getBoundingClientRect().height - innerHeight) < 1")
 assert not page.locator('.site-header').is_visible()
 page.locator('#mobile-settings-button').tap();assert page.locator('#quality-select').is_visible();page.locator('#settings-done').tap()
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-intro.png')
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.locator('#start-button').tap();page.wait_for_function("ember.snapshot().mode === 'playing'")
 page.wait_for_function("document.fullscreenElement === document.getElementById('stage')")
 assert page.locator('#joystick').is_visible()
 assert page.evaluate("getComputedStyle(document.querySelector('[data-action=jump] span')).userSelect === 'none'")
 assert page.evaluate("!document.querySelector('[data-action=jump]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))")
 page.evaluate('getSelection().removeAllRanges()')
 joy=page.locator('#joystick').bounding_box();x=joy['x']+joy['width']/2;y=joy['y']+joy['height']/2
 cdp=context.new_cdp_session(page)
 def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
 touch('touchStart',[{'x':x,'y':y,'id':1}]);touch('touchMove',[{'x':x+30,'y':y,'id':1}])
 page.wait_for_function('ember.snapshot().player.x > .6')
 charge=page.locator('[data-action="charge"]').bounding_box();cx=charge['x']+charge['width']/2;cy=charge['y']+charge['height']/2
 touch('touchStart',[{'x':x+30,'y':y,'id':1},{'x':cx,'y':cy,'id':2}]);page.wait_for_function('ember.snapshot().player.charging')
 page.wait_for_timeout(800)
 assert page.evaluate('getSelection().toString()') == ''
 touch('touchEnd',[]);page.wait_for_function('!ember.snapshot().player.charging && ember.snapshot().player.vx === 0')
 # Explicit recenter works while stationary, including after a charged turn.
 camera_button=page.locator('[data-action="recenter"]')
 assert camera_button.is_visible()
 assert camera_button.bounding_box()['width']>=44
 assert camera_button.bounding_box()['height']>=44
 camera_button.tap()
 page.wait_for_function('(()=>{const s=ember.snapshot();return Math.abs(Math.atan2(Math.sin(s.camera.angle-s.player.angle-Math.PI),Math.cos(s.camera.angle-s.player.angle-Math.PI)))<.04})()')
 # Very short taps must still register between rendered frames.
 page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.y > .1',timeout=12000)
 page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.gliding',timeout=12000)
 page.locator('#pause-button').tap();assert page.locator('#dialog-layer').is_visible()
 page.locator('#pause-settings').tap();assert page.locator('#quality-select').is_visible();page.locator('#settings-done').tap()
 page.locator('#pause-button').tap();page.locator('#resume-button').tap()
 page.locator('#map-button').tap();assert page.locator('#big-map').is_visible();page.locator('#map-done').tap()
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-game.png')
 print('PORTRAIT',json.dumps(page.evaluate('ember.snapshot()')),flush=True)
 page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(500)
 assert page.evaluate("Math.abs(document.getElementById('stage').getBoundingClientRect().height - innerHeight) < 1")
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert page.locator('#joystick').bounding_box()['y']+page.locator('#joystick').bounding_box()['height']<390
 page.screenshot(path='/workspace/sites/ember-skylands/docs/mobile-landscape.png')
 assert not errors,errors
 print('MOBILE PASS: fullscreen, full viewport, no selection, long press, multitouch movement + charge, camera recenter, jump/glide, pause settings, map, portrait/landscape',flush=True)
 context.close()
 # Safari/embedded browsers can lack or reject fullscreen: play must still fill the viewport.
 for failure in ['missing','rejected']:
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  context.add_init_script("Element.prototype.requestFullscreen = " + ("undefined" if failure == 'missing' else "() => Promise.reject(new Error('Fullscreen blocked'))"))
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
  page.locator('#start-button').tap();page.wait_for_function("ember.snapshot().mode === 'playing'")
  assert page.evaluate("!document.fullscreenElement && Math.abs(document.getElementById('stage').getBoundingClientRect().height - innerHeight) < 1")
  page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.y > .1',timeout=12000)
  assert not errors,errors
  print('FULLSCREEN FALLBACK PASS:',failure,flush=True)
  context.close()
 browser.close()
