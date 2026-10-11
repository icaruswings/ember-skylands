from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':844 if mobile else 1100,'height':390 if mobile else 760},device_scale_factor=1,is_mobile=mobile,has_touch=mobile)
  context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
  page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
  page.locator('#start-button').click()
  page.locator('#toast').wait_for(state='hidden')
  # Face sideways so the flame's silhouette is clearly visible in the camera.
  page.keyboard.down('KeyD');page.wait_for_function('Math.abs(ember.snapshot().player.angle-Math.PI/2)<.15');page.keyboard.up('KeyD')
  if mobile:page.locator('[data-action="flame"]').tap()
  else:page.keyboard.press('KeyF')
  page.wait_for_function('ember.snapshot().player.flame > .15')
  page.screenshot(path=f'/workspace/sites/ember-skylands/docs/fire-{ "mobile" if mobile else "desktop" }.png')
  assert page.evaluate('ember.snapshot().drawCalls')<330
  page.wait_for_function('ember.snapshot().player.flame === 0')
  page.keyboard.press('KeyF');page.wait_for_function('ember.snapshot().fireActive')
  # Dispatch pause immediately: Playwright's click stability wait can outlast a .42s attack.
  frozen=page.evaluate("document.getElementById('pause-button').click(); ember.snapshot().player.flame")
  assert frozen > 0
  page.wait_for_function('!ember.snapshot().fireActive && ember.snapshot().fireParticles === 0')
  assert page.evaluate('ember.snapshot().player.flame') == frozen
  page.locator('#resume-button').click();page.wait_for_function('ember.snapshot().player.flame === 0')
  if not mobile:
   page.locator('#settings-button').click();page.locator('#quality-select').select_option('high');page.locator('#settings-done').click()
   page.keyboard.press('KeyF');page.wait_for_function('ember.snapshot().player.flame > .15')
   page.screenshot(path='/workspace/sites/ember-skylands/docs/fire-rich.png')
   page.wait_for_function('ember.snapshot().player.flame === 0')
  assert not errors,errors
  print(('MOBILE' if mobile else 'DESKTOP')+' FIRE PASS: gesture, live GLSL rendering, quality budget and expiry',json.dumps(page.evaluate('ember.snapshot()')),flush=True)
  context.close()
 browser.close()
