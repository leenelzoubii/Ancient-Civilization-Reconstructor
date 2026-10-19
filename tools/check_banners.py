import glob, pathlib, sys

js_files = glob.glob(r"dist/assets/index-*.js")
css_files = glob.glob(r"dist/assets/index-*.css")
if not js_files or not css_files:
    print("no build output")
    sys.exit(1)

js = pathlib.Path(js_files[0]).read_text(encoding="utf-8")
css = pathlib.Path(css_files[0]).read_text(encoding="utf-8")

labels = [
    "Pyramids of Giza beside the Nile",
    "The Colosseum in Rome",
    "Maya stepped pyramid",
    "The Taj Mahal",
    "Khor Fakkan Portuguese fort",
    "Treasury facade at Petra",
    "Al-Jazirat Al-Hamra courtyard",
    "Dhayah Fort on its hilltop",
]
for label in labels:
    print(f"{label[:30]:32} in bundle: {label in js}")
print("civ-banner rule: ", ".civ-banner" in css)
print("banner height clamp: ", "clamp(110px" in css)
print("bg-panel wiring: ", "civ-banner mt-6" in js and "bg-panel" in js)
