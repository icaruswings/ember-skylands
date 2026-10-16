"""Real touch lifetimes against production Input + Simulation, without GPU cost.
--baseline demonstrates the previously published missed-pointer-release bug.
"""
from playwright.sync_api import sync_playwright
import subprocess
import sys

BASE = 'http://127.0.0.1:4173'
BASELINE_COMMIT = 'bddb4cc96e5eeae432b04c45d6700a7f7d83be37'
FIXTURE = '''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>body{margin:0;touch-action:none}canvas{position:absolute;inset:0;width:100%;height:100%}
#joystick{position:absolute;left:40px;top:190px;width:100px;height:100px;background:#8ac;border-radius:50%;touch-action:none}
#thumb{position:absolute;top:35px;left:35px;width:30px;height:30px;background:white;border-radius:50%}
.actions{position:absolute;right:30px;bottom:40px;display:flex;gap:12px}button{width:65px;height:65px;touch-action:none}</style>
<canvas id="view"></canvas><div id="joystick"><span id="thumb"></span></div>
<div class="actions"><button data-action="charge">Charge</button><button data-action="jump">Jump</button><button data-action="flame">Fire</button></div>
<script type="module">
import {Input} from '/engine/input.js';
import {Simulation,FixedClock} from '/engine/simulation.js';
const level={islands:[{x:0,y:0,z:0,r:1000}],bridges:[],obstacles:[],enemies:[],gems:[],rescues:[],spawn:{x:0,y:0,z:0},portal:{x:900,y:0,z:0},goal:{gems:1,rescues:1}};
const input=new Input(document.querySelector('canvas')),sim=new Simulation(level),clock=new FixedClock();
input.lookEnabled=true;
let previous=performance.now(), jumps=0;
function frame(now){clock.advance((now-previous)/1000,dt=>sim.update(dt,input.sample(0)));previous=now;
for(const event of sim.drain())if(event.type==='jump')jumps++;
requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.state=()=>({...sim.player,time:sim.time,jumps,stick:input.touch,orbit:input.orbit});
</script>'''
DROP_POINTER_ENDS = '''for (const event of ['pointerup','pointercancel','lostpointercapture'])
window.addEventListener(event,e=>e.stopImmediatePropagation(),true);'''

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True)
    context.add_init_script(DROP_POINTER_ENDS)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/input-release-fixture',lambda route:route.fulfill(status=200,content_type='text/html',body=FIXTURE))
    if '--baseline' in sys.argv:
        old=subprocess.check_output(['git','show',BASELINE_COMMIT+':dist/engine/input.js'],text=True)
        page.route('**/engine/input.js',lambda route:route.fulfill(status=200,content_type='text/javascript',body=old))
    page.goto(BASE+'/input-release-fixture');page.wait_for_function('window.state !== undefined')
    assert page.evaluate("'ontouchstart' in window")
    cdp=context.new_cdp_session(page)
    def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
    def point(x,y,i=1):return {'x':x,'y':y,'id':i}
    def start():
        touch('touchStart',[point(90,240)]);touch('touchMove',[point(126,240)])
        page.wait_for_function('state().vx>6')
    def stopped():
        page.wait_for_function('Math.hypot(state().vx,state().vz)===0 && !state().charging',timeout=2500)
        assert page.evaluate('Math.hypot(state().stick.x,state().stick.z)')==0
    start()
    # A held, still thumb must keep working: no arbitrary input timeout.
    began=page.evaluate('state().time')
    page.wait_for_function('(t)=>state().time>t+1',arg=began)
    assert page.evaluate('state().vx')>6
    touch('touchEnd',[]);stopped()
    print('RELEASE PASS: native finger release stops motion with all pointer releases suppressed',flush=True)
    start();touch('touchMove',[point(700,40)]);touch('touchEnd',[]);stopped()
    start();touch('touchCancel',[]);stopped()
    print('RELEASE PASS: drag outside, cancel, and a fresh gesture recover correctly',flush=True)
    start()
    r=page.locator('[data-action="charge"]').bounding_box();charge=point(r['x']+r['width']/2,r['y']+r['height']/2,2)
    joy=point(126,240)
    touch('touchStart',[joy,charge]);page.wait_for_function('state().charging')
    # CDP touchEnd lists the fingers being released, not the remaining fingers.
    touch('touchEnd',[charge]);page.wait_for_function('!state().charging && state().stick.x>.9')
    touch('touchStart',[joy,charge]);page.wait_for_function('state().charging')
    touch('touchEnd',[joy]);page.wait_for_function('state().charging && state().stick.x===0')
    touch('touchEnd',[]);stopped()
    print('RELEASE PASS: independent joystick and charge fingers release in either order',flush=True)
    start();page.set_viewport_size({'width':820,'height':390});stopped()
    touch('touchMove',[point(130,240)]);stopped();touch('touchEnd',[])
    start();touch('touchEnd',[]);stopped()
    # Pointer and touch streams coexist, but one tap must queue exactly one jump.
    page.locator('[data-action="jump"]').tap();page.wait_for_function('state().jumps===1')
    assert not page.evaluate('state().gliding')
    assert not errors,errors
    print('RELEASE PASS: resize cancels holds, restarting works, and taps are not duplicated',flush=True)
    context.close()
    context=browser.new_context(viewport={'width':844,'height':390})
    context.add_init_script("Element.prototype.setPointerCapture=()=>{throw new Error('capture unavailable')}")
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/input-release-fixture',lambda route:route.fulfill(status=200,content_type='text/html',body=FIXTURE))
    page.goto(BASE+'/input-release-fixture');page.wait_for_function('window.state !== undefined')
    page.mouse.move(90,240);page.mouse.down();page.mouse.move(126,240);page.wait_for_function('state().vx>6')
    page.mouse.move(700,40);page.mouse.up();page.wait_for_function('Math.hypot(state().vx,state().vz)===0')
    assert not errors,errors
    print('RELEASE PASS: mouse release outside still stops when pointer capture is unavailable',flush=True)
    context.close();browser.close()
