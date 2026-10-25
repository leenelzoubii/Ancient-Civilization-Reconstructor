import json

with open(r'C:\Users\HP\projects\tourism-app-next\data\civilizations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add era, region, capitals, language to each civilization
extra = {
    "taj-mahal": {"era": "1632 – 1653 CE", "region": "Agra, India", "capitals": "Agra", "language": "Persian, Arabic, Urdu"},
    "egypt": {"era": "c. 3100 BCE – 30 BCE", "region": "Nile Valley, North-East Africa", "capitals": "Memphis, Thebes, Alexandria", "language": "Egyptian (hieroglyphic script)"},
    "rome": {"era": "753 BCE – 476 CE (West)", "region": "Italy and the Mediterranean world", "capitals": "Rome; later Constantinople", "language": "Latin (and Greek in the East)"},
    "maya": {"era": "c. 2000 BCE – 1697 CE", "region": "Southern Mexico, Guatemala, Belize, Honduras, El Salvador", "capitals": "Independent city-states: Tikal, Calakmul, Palenque, Copán, Chichén Itzá", "language": "Mayan languages (logosyllabic script)"},
    "khorfakkan": {"era": "16th century", "region": "Khor Fakkan, UAE", "capitals": "Khor Fakkan", "language": "Arabic"},
    "petra": {"era": "4th century BCE – 1st century CE", "region": "Jordan", "capitals": "Petra", "language": "Nabatean Aramaic"},
    "al-jazirat-al-hamra": {"era": "Several centuries", "region": "Ras Al Khaimah, UAE", "capitals": "Al-Jazirat Al-Hamra", "language": "Arabic"},
    "dhayah-fort": {"era": "18th century", "region": "Ras Al Khaimah, UAE", "capitals": "Ras Al Khaimah", "language": "Arabic"},
}

for civ in data['civilizations']:
    cid = civ['id']
    if cid in extra:
        civ.update(extra[cid])

with open(r'C:\Users\HP\projects\tourism-app-next\data\civilizations.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')

print("Done - updated", len(data['civilizations']), "civilizations")
