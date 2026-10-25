import re
import urllib.request

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")

status, home = get("https://tourism-app-next.vercel.app")
print("site:", status)
js_url = re.search(r"assets/index-[A-Za-z0-9_-]+\.js", home).group(0)
css_url = re.search(r"assets/index-[A-Za-z0-9_-]+\.css", home).group(0)
_, js = get("https://tourism-app-next.vercel.app/" + js_url)
_, css = get("https://tourism-app-next.vercel.app/" + css_url)

scenes = [
    "Pyramids of Giza beside the Nile",
    "The Colosseum in Rome",
    "Maya stepped pyramid",
    "The Taj Mahal",
    "Khor Fakkan Portuguese fort",
    "Treasury facade at Petra",
    "Al-Jazirat Al-Hamra courtyard",
    "Dhayah Fort on its hilltop",
]
print("all 8 scenes live:", all(s in js for s in scenes))
print("banner strip css live:", "clamp(110px" in css and ".civ-banner" in css)
print("bg-panel banner wiring live:", "civ-banner mt-6" in js and "bg-panel" in js)
