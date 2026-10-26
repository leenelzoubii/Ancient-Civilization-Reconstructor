import urllib.request, re

r = urllib.request.urlopen('https://tourism-app-next.vercel.app')
html = r.read().decode('utf-8', 'replace')
print('HTML length:', len(html))
print('Has root div:', 'id="root"' in html)
print('Has main.tsx:', 'main.tsx' in html)

css_match = re.search(r'assets/index-[A-Za-z0-9_-]+\.css', html)
if css_match:
    print('CSS ref:', css_match.group(0))

js_match = re.search(r'assets/index-[A-Za-z0-9_-]+\.js', html)
if js_match:
    print('JS ref:', js_match.group(0))
