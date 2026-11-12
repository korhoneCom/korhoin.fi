#!/usr/bin/env python3
"""Rakentaa korhoin.fi-sivuston datan HisKi-aineistosta.

Syöte:  data/hiski_korhonen.json
Tulos:  data.js (tietueet + kootut tilastot)
"""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))


def year_of(r):
    for k in ("Syntynyt", "Kastettu", "Vihitty", "Kuollut", "Haudattu", "Saapumispäivä", "Lähtöpäivä"):
        m = re.search(r"\b(1[6-9]\d{2})\b", r.get(k, ""))
        if m:
            return int(m.group(1))
    return None


def main():
    recs = json.load(open(os.path.join(HERE, "data", "hiski_korhonen.json")))
    # Lähdetietueet pois (alkup - TALLKOMM jne.) — mutta vain jos se on
    # tietueen omassa kentässä, ei edelliseen liitettynä
    def is_source_note(r):
        for k in ("Syntynyt", "Kastettu", "Vihitty", "Kuollut", "Haudattu", "Saapumispäivä", "Lähtöpäivä"):
            if str(r.get(k, "")).startswith("alkup"):
                return True
        return False
    recs = [r for r in recs if not is_source_note(r)]

    for r in recs:
        r["_vuosi"] = year_of(r)

    years = [r["_vuosi"] for r in recs if r["_vuosi"]]
    decades = Counter(y // 10 * 10 for y in years)
    villages = Counter(r.get("Kylä", "") for r in recs if r.get("Kylä"))
    houses = Counter(r.get("Talo", "") for r in recs if r.get("Talo"))

    # Osioiden mukaiset vuosavälit
    sections = {}
    for name in ("Kastetut", "Vihityt", "Haudatut", "Sisäänmuuttaneet"):
        ys = [r["_vuosi"] for r in recs if r["osio"] == name and r["_vuosi"]]
        if ys:
            sections[name] = {"min": min(ys), "max": max(ys), "count": len(ys)}

    data = {
        "generated": __import__("datetime").datetime.now().isoformat(),
        "sections": sections,
        "decades": {str(k): v for k, v in sorted(decades.items())},
        "villages": [{"n": k, "c": v} for k, v in villages.most_common(40)],
        "houses": [{"n": k, "c": v} for k, v in houses.most_common(20)],
        "records": recs,
        "total": len(recs),
        "yearMin": min(years) if years else None,
        "yearMax": max(years) if years else None,
    }
    with open(os.path.join(HERE, "data.js"), "w") as f:
        f.write("const SITE_DATA = ")
        json.dump(data, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Tietueita: {len(recs)}  ·  vuodet {data['yearMin']}–{data['yearMax']}")
    print("Osiot:", {k: v["count"] for k, v in sections.items()})
    print(f"-> data.js ({os.path.getsize(os.path.join(HERE,'data.js'))} tavua)")


if __name__ == "__main__":
    main()
