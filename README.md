# korhoin.fi

Sukunimi**Korhonen** ja Leppävirran seurakunnan historialliset aineistot.
Lähde: [Suomen Sukututkimusseura](https://www.sukututkimusseura.fi/):n
[HisKi-tietokanta](https://hiski.genealogia.fi/hiski?fi+0294+kaikki).

## Sivuston rakenne

| Tiedosto | Sisältö |
|---|---|
| `index.html` | Etusivu: sankkari, tilastot, kyliät, hakemisto, lähde |
| `styles.css` | Kaikki tyylit |
| `script.js` | Hakemiston haku, suodatus, CSV-vienti |
| `data.js` | HisKi-aineisto (luotu `build_site.py`:llä) |
| `favicon.svg` | Selavicon |

## Aineiston uusinta

```bash
python3 parse_hiski.py /tmp/korhonen_full2.html
python3 build_site.py
```

`parse_hiski.py` jäsentää HisKi-hakutulokset ja `build_site.py` kirjoittaa
`data.js`:n, jota sivusto lukee suoraan selaimessa.

## Julkaisu

Repo on julkinen. GitHub Pages -asetus:
`Settings → Pages → Source: Deploy from a branch → main / (root)`.

Oma verkkotunnus: `CNAME`-tiedosto + DNS:n CNAME-tietue
`korhoin.fi → korhonecom.github.io`.
