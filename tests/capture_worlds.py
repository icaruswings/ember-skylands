"""Capture each current destination from the actual phone UI for user approval."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width':844, 'height':390},
        is_mobile=True, has_touch=True, device_scale_factor=1)
    context.add_init_script("localStorage.setItem('ember-settings',JSON.stringify({quality:'low',sound:false}))")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:4173', wait_until='networkidle')
    page.wait_for_function('window.ember !== undefined', timeout=60000)
    page.locator('#start-button').tap()
    for land in ['artisans', 'peace-keepers', 'magic-crafters', 'sunny-flight']:
        page.locator('#worlds-button').tap()
        page.locator('#flight-practice' if land == 'sunny-flight' else '[data-land="'+land+'"]').tap()
        page.wait_for_function('(id)=>ember.snapshot().world===id && ember.snapshot().adventureTime>.1', arg=land, timeout=60000)
        page.locator('#toast').wait_for(state='hidden', timeout=15000)
        page.screenshot(path='docs/world-'+land+'.png')
        s=page.evaluate('ember.snapshot()')
        assert s['triangles'] < 400000 and s['drawCalls'] < 450
        print('CAPTURE PASS',land,s['drawCalls'],s['triangles'],flush=True)
    assert not errors, errors
    context.close()
    browser.close()
