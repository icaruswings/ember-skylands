from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1024,'height':768})
 context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
 assert page.evaluate("document.getElementById('gem-count').textContent")=='0'
 page.locator('#start-button').click()
 # Move onto the first gem at x=0,z=5 and verify automatic saving.
 page.keyboard.down('KeyW');page.wait_for_function('ember.snapshot().gems > 0',timeout=30000);page.keyboard.up('KeyW')
 saved=page.evaluate("JSON.parse(localStorage.getItem('ember-skylands-save-v1'))")
 assert len(saved['gems'])>0
 page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined')
 assert page.evaluate('ember.snapshot().gems')==len(saved['gems'])
 assert page.locator('#start-button').inner_text().startswith('Continue')
 # Restore a legal completed-objective save, then reach and use the portal through real movement.
 page.evaluate("localStorage.setItem('ember-skylands-save-v1',JSON.stringify({version:1,gems:Array.from({length:30},(_,i)=>'gem-'+i),rescues:['spirit-0','spirit-1','spirit-2'],enemies:[],complete:false}))")
 page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined');page.locator('#start-button').click()
 assert page.evaluate('ember.snapshot().unlocked')
 page.keyboard.down('KeyW');page.wait_for_function("ember.snapshot().player.z < -7.5",timeout=60000);page.keyboard.up('KeyW')
 page.keyboard.down('KeyD');page.wait_for_function('ember.snapshot().player.x > -.8',timeout=20000);page.keyboard.up('KeyD')
 page.wait_for_function("!document.getElementById('interaction-prompt').classList.contains('hidden')")
 page.keyboard.down('KeyE');page.wait_for_function('ember.snapshot().complete',timeout=12000);page.keyboard.up('KeyE')
 assert page.locator('#dialog-title').inner_text()=='Little dragon. Big hero.'
 page.locator('#win-continue').click()
 assert page.evaluate('ember.snapshot().mode')=='playing'
 # Corrupt saved JSON and recover safely on a fresh page.
 page.locator('#pause-button').click()
 page.evaluate("localStorage.setItem('ember-skylands-save-v1','{bad')");page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined');assert page.evaluate('ember.snapshot().gems')==0
 page.locator('#settings-button').click();page.locator('#reset-button').click();page.locator('#cancel-reset').click();assert page.locator('#settings-done').is_visible();page.locator('#settings-done').click()
 assert not errors,errors
 print('PROGRESS PASS: collect, save, reload, portal win, continue, corrupted JSON and reset cancel',flush=True)
 browser.close()
