const B4A_APP_ID  = "gqA2S9BqnDlLGHZ9uqRWmrcymHEeduPI6ue5YCbu";
const B4A_JS_KEY  = "l7yWIBlqlCVHJyXD3k8AJfBZJDOL1eM3ZzQkCAFy";
const B4A_SERVER  = "https://parseapi.back4app.com";

// load the Parse SDK
(function loadParse() {
    const s = document.createElement("script");
    s.src = "https://npmcdn.com/parse/dist/parse.min.js";
    s.onload = function () {
        Parse.initialize(B4A_APP_ID, B4A_JS_KEY);
        Parse.serverURL = B4A_SERVER;
        loadHopes();
    };
    document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────────
//  Seed hopes shown before any real data comes in
// ─────────────────────────────────────────────────────────────
const SEED_HOPES = [
    { text: "that we figure out how to slow down",            flower: "self"    },
    { text: "more people feel like they belong",              flower: "people"  },
    { text: "that I'm still making things I care about",      flower: "self"    },
    { text: "cleaner air in cities",                          flower: "world"   },
    { text: "that loneliness is taken seriously",             flower: "society" },
    { text: "that my parents are still here",                 flower: "people"  },
    { text: "better mental health care for young people",     flower: "society" },
    { text: "that creativity stays human",                    flower: "tech"    },
    { text: "that I found my people",                         flower: "people"  },
    { text: "more rest — for everyone",                       flower: "self"    },
    { text: "that we rebuilt trust in something",             flower: "society" },
    { text: "that small towns still thrive",                  flower: "world"   },
    { text: "that I kept my promises to myself",              flower: "self"    },
    { text: "more kindness in everyday places",               flower: "people"  },
    { text: "that the ocean is still full of life",           flower: "world"   },
    { text: "that art still surprises us",                    flower: "self"    },
    { text: "that we stopped pretending everything is fine",  flower: "peace"   },
];

// ─────────────────────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────────────────────
let selectedFlower   = null;
let activeFilter  = "all";
let allHopes      = [];   // { text, flower, yours? }

// ─────────────────────────────────────────────────────────────
//  Custom cursor
// ─────────────────────────────────────────────────────────────
const cursorEl = document.createElement("div");
cursorEl.className = "cursor";
document.body.appendChild(cursorEl);

document.addEventListener("mousemove", function (e) {
    cursorEl.style.left = e.clientX + "px";
    cursorEl.style.top  = e.clientY + "px";
});

document.querySelectorAll("a, button, input, textarea, .flower-item, .data-card, .hope-dot").forEach(function (el) {
    el.addEventListener("mouseenter", function () { cursorEl.classList.add("big"); });
    el.addEventListener("mouseleave", function () { cursorEl.classList.remove("big"); });
});


/////// USABILITY TEST OVERLAY ///////
const overlay = document.getElementById('usability-overlay');
const closeBtn = document.querySelector('.close-btn');

closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});



// ─────────────────────────────────────────────────────────────
//  Card rail drag
// ─────────────────────────────────────────────────────────────
var rail   = document.getElementById("card-rail");
var rdots  = document.querySelectorAll(".rdot");
var isDown = false, startX, scrollLeft;

if (rail) {
    rail.addEventListener("mousedown",  function (e) { isDown = true; startX = e.pageX - rail.offsetLeft; scrollLeft = rail.scrollLeft; });
    rail.addEventListener("mouseleave", function ()  { isDown = false; });
    rail.addEventListener("mouseup",    function ()  { isDown = false; });
    rail.addEventListener("mousemove",  function (e) {
        if (!isDown) return;
        e.preventDefault();
        rail.scrollLeft = scrollLeft - (e.pageX - rail.offsetLeft - startX) * 1.4;
    });
    rail.addEventListener("scroll", function () {
        var i = Math.round(rail.scrollLeft / 296);
        rdots.forEach(function (d, j) { d.classList.toggle("active", j === i); });
    });
}

rdots.forEach(function (dot) {
    dot.addEventListener("click", function () {
        rail.scrollTo({ left: parseInt(dot.dataset.i) * 296, behavior: "smooth" });
    });
});

// ─────────────────────────────────────────────────────────────
//  Category selection (q3)
// ─────────────────────────────────────────────────────────────
var flowerItems = document.querySelectorAll(".flower-item");

flowerItems.forEach(function (item) {
    item.addEventListener("click", function () {
        flowerItems.forEach(function (c) { c.classList.remove("selected"); });
        item.classList.add("selected");
        selectedFlower = item.dataset.flower;
    });
});

// ─────────────────────────────────────────────────────────────
//  Load hopes from Back4App
// ─────────────────────────────────────────────────────────────
function loadHopes() {
    // start with seeds
    allHopes = SEED_HOPES.map(function (h) { return { text: h.text, flower: h.flower, yours: false }; });
    renderHopes();

    // then fetch from Back4App
    var Hope  = Parse.Object.extend("Hope");
    var query = new Parse.Query(Hope);
    query.descending("createdAt");
    query.limit(200);

    query.find().then(function (results) {
        results.forEach(function (obj) {
            allHopes.push({
                text:  obj.get("text"),
                flower:   obj.get("flower") || "peace",
                yours: false,
                id:    obj.id
            });
        });
        updateCounter();
        renderHopes();
    }).catch(function (err) {
        console.warn("Back4App load error:", err.message);
        // seeds still show — no crash
    });
}

// ─────────────────────────────────────────────────────────────
//  Save a hope to Back4App
// ─────────────────────────────────────────────────────────────
function saveHope(text, flower) {
    if (typeof Parse === "undefined") return;
    var Hope = Parse.Object.extend("Hope");
    var obj  = new Hope();
    obj.set("text", text);
    obj.set("flower",  flower);
    obj.save().catch(function (err) {
        console.warn("Back4App save error:", err.message);
    });
}

// ─────────────────────────────────────────────────────────────
//  Render the hope-field
// ─────────────────────────────────────────────────────────────
function renderHopes() {
    var field = document.getElementById("hope-field");
    if (!field) return;
    field.innerHTML = "";

    var filtered = allHopes.filter(function (h) {
        return activeFilter === "all" || h.flower === activeFilter;
    });

    filtered.forEach(function (hope, i) {
        var dot = document.createElement("div");
        dot.className = "hope-dot" + (hope.yours ? " yours" : "");
        dot.dataset.flower = hope.flower;
        dot.textContent = hope.text;
        dot.style.animationDelay = (i * 0.04) + "s";

        // cursor big on hover
        dot.addEventListener("mouseenter", function () { cursorEl.classList.add("big"); });
        dot.addEventListener("mouseleave", function () { cursorEl.classList.remove("big"); });

        field.appendChild(dot);
    });
}

// ─────────────────────────────────────────────────────────────
//  Update counter
// ─────────────────────────────────────────────────────────────
function updateCounter() {
    var el = document.getElementById("hope-count");
    if (el) el.textContent = allHopes.length;
}

// ─────────────────────────────────────────────────────────────
//  Submit hope from q3
// ─────────────────────────────────────────────────────────────
function submitHope() {
    var text = document.getElementById("ans3").value.trim();
    if (!text) {
        alert("share one hope before planting it ✦");
        return;
    }
    var flower = selectedFlower || guessCategory(text);

    // add locally first (instant feedback)
    allHopes.unshift({ text: text, flower: flower, yours: true });
    updateCounter();
    renderHopes();

    // save to Back4App
    saveHope(text, flower);

    // scroll to ending
    setTimeout(function () {
        document.getElementById("ending").scrollIntoView({ behavior: "smooth" });
    }, 200);
}

// ─────────────────────────────────────────────────────────────
//  Plant from the garden input bar
// ─────────────────────────────────────────────────────────────
function plantFromInput() {
    var input = document.getElementById("garden-input");
    var text  = input.value.trim();
    if (!text) return;

    var flower = guessCategory(text);
    allHopes.push({ text: text, flower: flower, yours: false });
    updateCounter();
    renderHopes();
    saveHope(text, flower);
    input.value = "";
}

document.addEventListener("DOMContentLoaded", function () {
    var gi = document.getElementById("garden-input");
    if (gi) gi.addEventListener("keydown", function (e) { if (e.key === "Enter") plantFromInput(); });
});

// ─────────────────────────────────────────────────────────────
//  Category filter buttons
// ─────────────────────────────────────────────────────────────
var filterBtns = document.querySelectorAll(".filter-btn");
filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        renderHopes();
    });
});

// ─────────────────────────────────────────────────────────────
//  Guess category from text keywords
// ─────────────────────────────────────────────────────────────
function guessCategory(text) {
    var t = text.toLowerCase();
    if (/family|daughter|son|parent|friend|love|together|people|belong|trust|kind|lonely/.test(t)) return "people";
    if (/planet|ocean|air|earth|climate|city|world|nature|clean|green|environment/.test(t))        return "world";
    if (/myself|still|making|found|kept|learn|grow|career|creat|art|health|rest/.test(t))          return "self";
    if (/equal|justice|care|education|trust|honest|fair|society/.test(t))                           return "society";
    if (/tech|ai|robot|digital|future|innov|internet|machine/.test(t))                              return "tech";
    return "peace";
}
