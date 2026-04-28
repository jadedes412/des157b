// CONSTANTS
const MONTHS = [
  "Apr 2025", "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025",
  "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"
];

// DOM REFS
const rowCovers = document.getElementById('rowCovers');
const rowRail   = document.getElementById('rowRail');
const rowLabels = document.getElementById('rowLabels');

// OVERLAY STATE
let grouped  = {};
let curMonth = null;
let curIdx   = 0;

// FETCH DATA & INIT
fetch('doc-list.json')
  .then(res => {
    if (!res.ok) throw new Error(`Failed to load doc-list.json (${res.status})`);
    return res.json();
  })
  .then(docs => {
    MONTHS.forEach(m => grouped[m] = []);
    docs.forEach(d => {
      if (grouped[d["doc-watched"]] !== undefined) {
        grouped[d["doc-watched"]].push(d);
      }
    });
    buildTimeline();
  })
  .catch(err => {
    console.error('Could not load doc-list.json:', err);
    document.body.insertAdjacentHTML('afterbegin',
      `<p style="color:red;padding:20px;font-family:monospace;">
        Error loading doc-list.json — make sure it's in the same folder as index.html
        and you're serving via a local server (not file://).
      </p>`
    );
  });

// BUILD TIMELINE DOM
function buildTimeline() {
  // Rail line sits behind the dot cells
  const railLine = document.createElement('div');
  railLine.className = 'rail-line';
  rowRail.appendChild(railLine);

  MONTHS.forEach(month => {
    const items = grouped[month];

    // Cover stack column
    const colC = document.createElement('div');
    colC.className = 'col-covers';
    items.forEach((doc, di) => {
      const cv = document.createElement('div');
      cv.className = 'doc-cover';
      cv.title = doc["doc-name"];

      if (doc["doc-img"]) {
        cv.innerHTML = `<img src="${doc["doc-img"]}" alt="${doc["doc-name"]}">`;
      } else {
        cv.innerHTML = '<span class="n">N</span>';
      }

      cv.addEventListener('click', () => openOverlay(month, di));
      colC.appendChild(cv);
    });
    rowCovers.appendChild(colC);

    // Dot column
    const colD = document.createElement('div');
    colD.className = 'col-dot';
    const dot = document.createElement('div');
    dot.className = 'dot ' + (items.length ? 'clickable' : 'empty');
    if (items.length) dot.addEventListener('click', () => openOverlay(month, 0));
    colD.appendChild(dot);
    rowRail.appendChild(colD);

    // Label column
    const colL = document.createElement('div');
    colL.className = 'col-label';
    const [mn, yr] = month.split(' ');
    colL.innerHTML = `<b>${mn}</b>${yr}`;
    rowLabels.appendChild(colL);
  });
}

// OPEN OVERLAY
function openOverlay(month, idx) {
  curMonth = month;
  curIdx   = idx;
  renderOverlay();
  document.getElementById('ovBg').classList.add('on');
}

// RENDER OVERLAY CONTENT
function renderOverlay() {
  const items = grouped[curMonth];
  const doc   = items[curIdx];

  // Cover image — use real image if available, otherwise placeholder
  const imgWrap = document.getElementById('ovImg');
  if (doc["doc-img"]) {
    imgWrap.innerHTML = `<img src="${doc["doc-img"]}" alt="${doc["doc-name"]}">`;
  } else {
    imgWrap.innerHTML = '<div class="ov-ph"><span>N</span></div>';
  }

  // Tags
  const tagsEl = document.getElementById('ovTags');
  tagsEl.innerHTML = '';
  [doc["doc-genre"], doc["doc-type"]].forEach(t => {
    const tg = document.createElement('span');
    tg.className = 'ov-tag';
    tg.textContent = t.toLowerCase();
    tagsEl.appendChild(tg);
  });

  // Title — split at first colon into title + subtitle
  const name = doc["doc-name"];
  const ci   = name.indexOf(':');
  document.getElementById('ovTitle').textContent = ci > -1 ? name.slice(0, ci) : name;
  document.getElementById('ovSub').textContent   = ci > -1 ? name.slice(ci + 1).trim() : '';
  document.getElementById('ovYear').textContent  = `(${doc["doc-year"]})`;
  document.getElementById('ovDesc').textContent  = doc["doc-description"];
  document.getElementById('ovCount').textContent = `${curIdx + 1} / ${items.length}  —  ${curMonth}`;

  // Arrow enabled/disabled state
  document.getElementById('aPrev').disabled = curIdx === 0;
  document.getElementById('aNext').disabled = curIdx === items.length - 1;
}

// CLOSE OVERLAY
function closeOverlay() {
  document.getElementById('ovBg').classList.remove('on');
}

// OVERLAY EVENT LISTENERS
document.getElementById('ovX').addEventListener('click', closeOverlay);

document.getElementById('ovBg').addEventListener('click', e => {
  if (e.target === document.getElementById('ovBg')) closeOverlay();
});

document.getElementById('aPrev').addEventListener('click', () => {
  if (curIdx > 0) { curIdx--; renderOverlay(); }
});

document.getElementById('aNext').addEventListener('click', () => {
  if (curIdx < grouped[curMonth].length - 1) { curIdx++; renderOverlay(); }
});

document.addEventListener('keydown', e => {
  if (!document.getElementById('ovBg').classList.contains('on')) return;
  if (e.key === 'Escape') closeOverlay();
  if (e.key === 'ArrowLeft'  && curIdx > 0) { curIdx--; renderOverlay(); }
  if (e.key === 'ArrowRight' && curIdx < grouped[curMonth].length - 1) { curIdx++; renderOverlay(); }
});