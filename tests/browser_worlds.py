"""Actual phone UI integration: travel, bounded charge, flight and scene resource reuse."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,math
BASE='http://127.0.0.1:4173'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
 context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle');page.wait_for_function('window.ember !== undefined',timeout=60000)
 page.locator('#start-button').tap();page.wait_for_function("ember.snapshot().mode==='playing'")
 assert page.locator('#worlds-button').is_visible(),'world travel must be available in play'
 memories=[]
 for land in ['artisans','peace-keepers','magic-crafters','artisans','peace-keepers','magic-crafters']:
  page.locator('#worlds-button').tap();page.locator('[data-land="'+land+'"]').tap()
  page.wait_for_function('(id)=>ember.snapshot().world===id && ember.snapshot().mode===\'playing\' && ember.snapshot().adventureTime>.1',arg=land,timeout=60000)
  s=page.evaluate('ember.snapshot()');assert s['player']['y']>=0 and s['player']['grounded'] and s['player']['health']==3
  assert len(s['landmarks'])>=2;assert s['triangles']<400000;assert s['drawCalls']<450
  memories.append(s['memory']['geometries'])
  page.locator('#toast').wait_for(state='hidden',timeout=15000)
  page.screenshot(path='docs/world-'+land+'.png')
  print('WORLD PASS',land,json.dumps({'calls':s['drawCalls'],'triangles':s['triangles'],'memory':s['memory']}),flush=True)
 assert max(memories[3:])<max(memories[:3])+50,memories
 cdp=context.new_cdp_session(page)
 def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
 def center(selector,i=1):
  r=page.locator(selector).bounding_box();return {'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':i}
 # Ground touch move plus charge and a complete release.
 joy=center('#joystick');moved={**joy,'x':joy['x']+30};charge=center('[data-action="charge"]',2)
 touch('touchStart',[joy]);touch('touchMove',[moved]);touch('touchStart',[moved,charge])
 page.wait_for_function('ember.snapshot().player.charging && Math.hypot(ember.snapshot().player.vx,ember.snapshot().player.vz)>10')
 touch('touchEnd',[]);page.wait_for_function('!ember.snapshot().player.charging && Math.hypot(ember.snapshot().player.vx,ember.snapshot().player.vz)===0')
 page.locator('#worlds-button').tap();page.locator('#flight-practice').tap()
 page.wait_for_function("ember.snapshot().world==='sunny-flight' && ember.snapshot().adventureTime>.1",timeout=60000)
 assert page.evaluate('ember.snapshot().flight.remaining') is None
 before=page.evaluate('ember.snapshot().player')
 joy=center('#joystick');moved={**joy,'y':joy['y']-32};touch('touchStart',[joy]);touch('touchMove',[moved])
 page.wait_for_function('(y)=>ember.snapshot().player.y>y+1',arg=before['y'],timeout=30000);touch('touchEnd',[])
 page.locator('[data-action="flame"]').tap();page.wait_for_function('ember.snapshot().fireActive')
 page.locator('[data-action="jump"]').tap();page.wait_for_function('ember.snapshot().player.loop>0')
 page.locator('[data-action="turn"]').tap()
 page.locator('#pause-button').tap();page.locator('#resume-button').wait_for(state='visible')
 frozen=page.evaluate('ember.snapshot().adventureTime');page.wait_for_timeout(400);assert page.evaluate('ember.snapshot().adventureTime')==frozen
 page.locator('#resume-button').tap()
 page.locator('#retry-flight-button').tap()
 page.locator('#toast').wait_for(state='hidden',timeout=15000)
 page.screenshot(path='docs/world-sunny-flight.png')
 page.locator('#retry-flight-button').tap();page.wait_for_function('ember.snapshot().flight.targets===0 && ember.snapshot().adventureTime<1')
 page.locator('#worlds-button').tap();page.locator('#flight-timed').tap();page.wait_for_function('ember.snapshot().flight.remaining>0')
 page.locator('#worlds-button').tap();page.locator('[data-land="artisans"]').tap();page.wait_for_function("ember.snapshot().world==='artisans'")
 saved=page.evaluate("JSON.parse(localStorage.getItem('ember-skylands-save-v1'))");assert saved['version']==2
 page.reload(wait_until='networkidle');page.wait_for_function('window.ember !== undefined');assert page.evaluate('ember.snapshot().world')=='artisans'
 page.locator('#start-button').tap();page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(500)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert page.locator('#worlds-button').is_visible();page.locator('#worlds-button').tap()
 assert page.locator('[data-land="magic-crafters"]').is_visible();page.screenshot(path='docs/world-picker-phone.png')
 assert not errors,errors
 print('PHONE CAMPAIGN PASS: all destinations, resource reuse, multitouch release, flight climb/fire/loop/turn, pause, retry, timer, persistence and portrait picker',flush=True)
 context.close();browser.close()
