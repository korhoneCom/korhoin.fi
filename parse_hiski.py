#!/usr/bin/env python3
"""Jäsentää HisKi-hakutulokset Leppävirran Korhonen-aineistosta.

HisKi:n HTML on rakenteeltaan löyhää: <tr>-tunnisteita ei suljeta ja joissain
taulukoissa on kaksi otsakeriviä (ryhmäotsake + sarakkeet). Tämä jäsennin
käyttää viimeistä otsakeriviä ja pilkkoo rivit <TR>-tunnisteen mukaan.

Tulos: data/hiski_korhonen.json
"""
import json
import os
import re
import sys
from collections import Counter


def clean(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"\s+", " ", s).strip()


def parse_table(table):
    rows = re.split(r"<TR[^>]*>", table)[1:]
    heads = []
    data = []
    for r in rows:
        ths = re.findall(r"<TH[^>]*>(.*?)(?=<TH|<TR|</TR>|$)", r, re.S | re.I)
        if ths:
            cand = [clean(x) for x in ths]
            cand = [x for x in cand if x]
            if cand:
                heads = cand
            continue
        data.append(r)
    out = []
    for ch in data:
        cells = re.findall(r"<TD[^>]*>(.*?)(?=<TD|<TR|</TR>|$)", ch, re.S | re.I)
        if not cells:
            continue
        vals = [clean(c) for c in cells]
        link = re.search(r'HREF="([^"]+)"', ch, re.I)
        rowtext = " ".join(vals).lower()
        # Jatkuvuus- ja lähdeviiterivit (kummi:, alkup - TALLKOMM:, ...)
        if "kummi:" in rowtext or "alkup -" in rowtext or rowtext.startswith("alkup"):
            extra = [v for v in vals if v]
            if extra and out:
                out[-1].setdefault("extra", []).extend(extra)
                continue
        # Muut jatkuvuusrivit: alkuarvot tyhjiä
        if len(vals) >= 2 and vals[0] == "" and vals[1] == "":
            extra = [v for v in vals[2:] if v]
            if extra and out:
                out[-1].setdefault("extra", []).extend(extra)
                continue
        rec = {}
        for i, v in enumerate(vals):
            if i < len(heads):
                rec[heads[i]] = v
        if len(vals) > len(heads):
            rec.setdefault("extra", []).extend(v for v in vals[len(heads):] if v)
        if link:
            rec["lahde"] = "https://hiski.genealogia.fi" + link.group(1)
        out.append(rec)
    return out


def parse(path):
    h = open(path, encoding="latin-1").read()
    result = []
    for m in re.finditer(r"<BIG>([^<]+)</BIG>\s*<P>\s*<TABLE[^>]*>(.*?)</TABLE>", h, re.S | re.I):
        title = clean(m.group(1))
        for rec in parse_table(m.group(2)):
            rec2 = {"osio": title}
            rec2.update(rec)
            result.append(rec2)
    return result


def year_of(rec):
    for k in ("Syntynyt", "Kastettu", "Vihitty", "Kuollut", "Haudattu", "Lähtöpäivä", "Saapumispäivä"):
        m = re.search(r"\b(1[6-9]\d{2})\b", rec.get(k, ""))
        if m:
            return int(m.group(1))
    return None


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "/tmp/korhonen_full2.html"
    recs = parse(src)
    print(f"Tapahtumia: {len(recs)}")
    print("Osioittain:", dict(Counter(r["osio"] for r in recs)))
    ys = [year_of(r) for r in recs]
    ys = [y for y in ys if y]
    if ys:
        print(f"Vuodet: {min(ys)}–{max(ys)}")
    dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "hiski_korhonen.json")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    json.dump(recs, open(dst, "w"), indent=2, ensure_ascii=False)
    print(f"-> {dst}")
