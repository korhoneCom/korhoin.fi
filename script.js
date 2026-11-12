/* Korhonen · Leppävirralla — hakemiston renderöinti ja suodatus */
(function () {
  'use strict';

  var D = window.SITE_DATA || { records: [], decades: {}, villages: [], sections: {} };
  var $ = function (s) { return document.querySelector(s); };

  if ($('#vuosi')) $('#vuosi').textContent = new Date().getFullYear();
  if ($('#generoitu')) {
    $('#generoitu').textContent = 'Aineisto noudettu ' +
      new Date(D.generated || Date.now()).toLocaleDateString('fi-FI') +
      ' · ' + D.total + ' merkintää · vuodet ' + D.yearMin + '–' + D.yearMax;
  }

  /* ---- Kortit ---- */
  var osiot = D.sections || {};
  var kortit = [
    ['Merkintöjä yhteensä', D.total],
    ['Kastettut', osiot.Kastetut ? osiot.Kastetut.count : 0],
    ['Vihityt', osiot.Vihityt ? osiot.Vihityt.count : 0],
    ['Haudatut', osiot.Haudatut ? osiot.Haudatut.count : 0],
    ['Sisäänmuuttaneet', osiot['Sisäänmuuttaneet'] ? osiot['Sisäänmuuttaneet'].count : 0],
    ['Vuosikymmeniä', Object.keys(D.decades || {}).length],
    ['Kyliä', (D.villages || []).length],
  ];
  var kc = $('#kortit');
  if (kc) {
    kc.innerHTML = kortit.map(function (k) {
      return '<div class="card"><div class="n">' + k[1] + '</div><div class="l">' + k[0] + '</div></div>';
    }).join('');
  }

  /* ---- Kaavio ---- */
  var kaavio = $('#kaavio');
  if (kaavio && D.decades) {
    var max = Math.max.apply(null, Object.keys(D.decades).map(function (k) { return D.decades[k]; }));
    Object.keys(D.decades).forEach(function (k) {
      var v = D.decades[k];
      var wrap = document.createElement('div');
      wrap.className = 'bar-wrap';
      var bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = Math.max(2, Math.round((v / max) * 100)) + '%';
      var tip = document.createElement('span');
      tip.className = 'bar-tip';
      tip.textContent = k + ': ' + v;
      bar.appendChild(tip);
      var lab = document.createElement('span');
      lab.className = 'bar-label';
      lab.textContent = k.replace(/^(\d{3})0$/, '$10');
      wrap.appendChild(bar);
      wrap.appendChild(lab);
      kaavio.appendChild(wrap);
    });
  }
  if ($('#osiot')) {
    $('#osiot').textContent = Object.keys(osiot).map(function (k) {
      return k + ' ' + osiot[k].count + ' (' + osiot[k].min + '–' + osiot[k].max + ')';
    }).join(' · ');
  }
  var ao = $('#aineisto-otsikko');
  if (ao) ao.textContent = D.total + ' merkintää vuosina ' + D.yearMin + '–' + D.yearMax;

  /* ---- Kyliät ---- */
  var kylat = $('#kylat');
  if (kylat && D.villages) {
    kylat.innerHTML = D.villages.map(function (v) {
      return '<div class="village"><span class="vn">' + escapeHtml(v.n) +
        '</span><span class="vc">' + v.c + '</span></div>';
    }).join('');
  }

  /* ---- Vuosikymmen-valitsin ---- */
  var fv = $('#fVuosi');
  if (fv && D.decades) {
    Object.keys(D.decades).sort().forEach(function (k) {
      var o = document.createElement('option');
      o.value = k;
      o.textContent = k + '–';
      fv.appendChild(o);
    });
  }

  /* ---- Hakemisto ---- */
  var records = (D.records || []).slice().sort(function (a, b) {
    return (a._vuosi || 9999) - (b._vuosi || 9999);
  });

  function henkilot(r) {
    var osio = r.osio;
    if (osio === 'Kastetut') {
      return (r['Isä'] ? r['Isä'] + ' ja ' + (r['Äiti'] || '') : (r['Äiti'] || '')) +
        ' — lapsi ' + (r['Lapsi'] || '');
    }
    if (osio === 'Vihityt') {
      return (r['Mies'] || '') + ' ja ' + (r['Vaimo'] || '');
    }
    if (osio === 'Haudatut') return r['Henkilö'] || '';
    if (osio === 'Sisäänmuuttaneet') {
      return (r['Henkilö'] || '') + (r['Mistä'] ? ' — ' + r['Mistä'] : '') +
        (r['Kohde'] ? ' → ' + r['Kohde'] : '');
    }
    return '';
  }

  function haystack(r) {
    return [
      r.osio, r['Kylä'], r['Talo'], r['Isä'], r['Äiti'], r['Lapsi'],
      r['Mies'], r['Vaimo'], r['Henkilö'], r['Mistä'], r['Kohde'],
      r['_vuosi'], (r.extra || []).join(' '), r.lahde
    ].join(' ').toLowerCase();
  }

  function render() {
    var q = ($('#q').value || '').trim().toLowerCase();
    var osio = $('#fOsio').value;
    var vk = $('#fVuosi').value;
    var out = records.filter(function (r) {
      if (osio && r.osio !== osio) return false;
      if (vk) {
        var v = String(Math.floor((r._vuosi || 0) / 10) * 10);
        if (v !== vk) return false;
      }
      if (q && haystack(r).indexOf(q) < 0) return false;
      return true;
    });
    var tb = $('#tbody');
    if (!tb) return;
    tb.innerHTML = out.map(function (r) {
      var vuosi = r._vuosi || '—';
      var lahde = r.lahde
        ? '<a class="lahde-link" href="' + r.lahde + '" target="_blank" rel="noopener">HisKi</a>'
        : '—';
      return '<tr>' +
        '<td class="mono">' + vuosi + '</td>' +
        '<td><span class="tyyppi ' + r.osio + '">' + r.osio + '</span></td>' +
        '<td>' + escapeHtml(r['Kylä'] || '') + '</td>' +
        '<td>' + escapeHtml(r['Talo'] || '') + '</td>' +
        '<td>' + escapeHtml(henkilot(r)) + '</td>' +
        '<td>' + lahde + '</td>' +
        '</tr>';
    }).join('');
    var tm = $('#tulosmaara');
    if (tm) tm.textContent = out.length + ' / ' + records.length + ' merkintää';
    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (kc || kaavio) {
    ['q', 'fOsio', 'fVuosi'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', render);
    });
    var csv = $('#csv');
    if (csv) {
      csv.addEventListener('click', function () {
        var out = render();
        var head = ['Vuosi', 'Tyyppi', 'Kylä', 'Talo', 'Henkilöt', 'Lähde'];
        var lines = [head.join(';')];
        out.forEach(function (r) {
          lines.push([
            r._vuosi || '', r.osio, r['Kylä'] || '', r['Talo'] || '',
            henkilot(r), r.lahde || ''
          ].map(function (v) {
            return '"' + String(v).replace(/"/g, '""') + '"';
          }).join(';'));
        });
        var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'korhonen-leppavirta.csv';
        a.click();
      });
    }
    render();
  }
})();
