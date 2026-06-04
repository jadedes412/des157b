(function() {
'use strict';

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

//  flower categories

const FLOWERS = {
    society: { img: "images/society.png",     name: "society & justice"       },
    people:  { img: "images/ppl+love.png",    name: "people & love"           },
    tech:    { img: "images/tech+future.png", name: "technology & innovation" },
    peace:   { img: "images/peace+unk.png",   name: "peace & the unknown"     },
    world:   { img: "images/world+planet.png", name: "the world & planet"      },
    self:    { img: "images/self+growth.png", name: "the self & growth"       },
};

//  initial seed hopes for field of hopes

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

//  different states of experience

let selectedFlower = null;
let activeFilter   = "all";
let allHopes       = [];     // { text, flower, yours? }
let openTipText    = null;   // which hope's tooltip is open

//  custom cursor

const cursorEl = document.createElement("div");
cursorEl.className = "cursor";
document.body.appendChild(cursorEl);

document.addEventListener("mousemove", function (e) {
    cursorEl.style.left = e.clientX + "px";
    cursorEl.style.top  = e.clientY + "px";
});

function bindCursor(el) {
    el.addEventListener("mouseenter", function () { cursorEl.classList.add("big"); });
    el.addEventListener("mouseleave", function () { cursorEl.classList.remove("big"); });
}
document.querySelectorAll("a, button, input, textarea, .flower-item").forEach(bindCursor);


//  data cards and clickthrough arrows

var cardTrack = document.getElementById("card-track");
var cardCount = document.querySelectorAll("#card-track .data-card").length;
var cardPrev  = document.getElementById("card-prev");
var cardNext  = document.getElementById("card-next");
var rdots     = document.querySelectorAll(".rdot");
var cardIndex = 0;

function goToCard(i) {
    cardIndex = Math.max(0, Math.min(i, cardCount - 1));
    cardTrack.style.transform = "translateX(" + (-cardIndex * 100) + "%)";
    rdots.forEach(function (d, j) { d.classList.toggle("active", j === cardIndex); });
    if (cardPrev) cardPrev.disabled = cardIndex === 0;
    if (cardNext) cardNext.disabled = cardIndex === cardCount - 1;
}

if (cardPrev) cardPrev.addEventListener("click", function () { goToCard(cardIndex - 1); });
if (cardNext) cardNext.addEventListener("click", function () { goToCard(cardIndex + 1); });
rdots.forEach(function (dot) {
    dot.addEventListener("click", function () { goToCard(parseInt(dot.dataset.i)); });
});
goToCard(0);


//  user questions

var questionsTrack = document.getElementById("questions-track");
var questionIndex  = 0;

function goToQuestion(i) {
    questionIndex = i;
    if (questionsTrack) questionsTrack.style.transform = "translateX(" + (-i * 100) + "%)";
}

document.querySelectorAll("[data-goto]").forEach(function (btn) {
    btn.addEventListener("click", function () { goToQuestion(parseInt(btn.dataset.goto)); });
});

//  q3 flower category picker

document.querySelectorAll(".flower-item").forEach(function (item) {
    item.addEventListener("click", function () {
        document.querySelectorAll(".flower-item").forEach(function (c) { c.classList.remove("selected"); });
        item.classList.add("selected");
        selectedFlower = item.dataset.flower;
    });
});


//  load hopes from Back4App

function loadHopes() {
    allHopes = SEED_HOPES.map(function (h) { return { text: h.text, flower: h.flower, yours: false }; });
    updateCounter();
    renderHopes();

    var Hope  = Parse.Object.extend("Hope");
    var query = new Parse.Query(Hope);
    query.descending("createdAt");
    query.limit(200);

    query.find().then(function (results) {
        results.forEach(function (obj) {
            allHopes.push({
                text:   obj.get("text"),
                flower: obj.get("flower") || "peace",
                yours:  false,
                id:     obj.id
            });
        });
        updateCounter();
        renderHopes();
    }).catch(function (err) {
        console.warn("Back4App load error:", err.message);
    });
}


//  save a hope to Back4App

function saveHope(text, flower) {
    if (typeof Parse === "undefined") return;
    var Hope = Parse.Object.extend("Hope");
    var obj  = new Hope();
    obj.set("text", text);
    obj.set("flower", flower);
    obj.save().catch(function (err) {
        console.warn("Back4App save error:", err.message);
    });
}


//  hope flowers stay the same position

function seededRand(str, salt) {
    var h = 2166136261 ^ salt;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    h = (h >>> 0) / 4294967295;
    return h;
}


//  field of hope interactions and scatter positioning render

function renderHopes() {
    var field = document.getElementById("hope-field");
    if (!field) return;
    field.innerHTML = "";
    openTipText = null;

    // every hope stays on screen; the filter only decides what gets outlined
    var n    = allHopes.length;
    var cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.7)));
    var rows = Math.max(1, Math.ceil(n / cols));
    var cellW = 100 / cols;
    var cellH = 100 / rows;

    allHopes.forEach(function (hope, i) {
        var col = i % cols;
        var row = Math.floor(i / cols);

        var jx = (seededRand(hope.text, 1) - 0.5) * cellW * 0.8;
        var jy = (seededRand(hope.text, 2) - 0.5) * cellH * 0.8;
        var x = (col + 0.5) * cellW + jx;
        var y = (row + 0.5) * cellH + jy;
        x = Math.max(5, Math.min(95, x));
        y = Math.max(12, Math.min(92, y));

        var meta = FLOWERS[hope.flower] || FLOWERS.peace;

        // outline the user's own flower in "all", or any flower matching the active category
        var highlight = (activeFilter === "all")
            ? hope.yours
            : hope.flower === activeFilter;

        var flower = document.createElement("div");
        flower.className = "hope-flower" + (hope.yours ? " yours" : "") + (highlight ? " highlight" : "");
        flower.style.left = x + "%";
        flower.style.top  = y + "%";
        flower.style.animationDelay = (i * 0.03) + "s";
        flower.innerHTML = '<img src="' + meta.img + '" alt="' + meta.name + '">';

        flower.addEventListener("click", function (e) {
            e.stopPropagation();
            showTip(field, flower, hope, meta);
        });
        bindCursor(flower);

        field.appendChild(flower);
    });

    // tapping empty field closes any open tooltip
    field.onclick = function () { clearTips(field); };
}


//  tool tip popup on a flower

function clearTips(field) {
    field.querySelectorAll(".hope-tip").forEach(function (t) { t.remove(); });
    openTipText = null;
}

function showTip(field, flower, hope, meta) {
    var already = openTipText === hope.text;
    clearTips(field);
    if (already) return;

    var tip = document.createElement("div");
    tip.className = "hope-tip";
    tip.style.left = flower.style.left;
    tip.style.top  = flower.style.top;
    tip.innerHTML =
        '<button class="tip-close" aria-label="close">&times;</button>' +
        '<div class="tip-text">' + escapeHtml(hope.text) + '</div>' +
        '<div class="tip-cat">' + meta.name + '</div>';

    tip.addEventListener("click", function (e) { e.stopPropagation(); });
    tip.querySelector(".tip-close").addEventListener("click", function () { clearTips(field); });

    field.appendChild(tip);
    openTipText = hope.text;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
}


//  hope counter

function updateCounter() {
    var el = document.getElementById("hope-count");
    if (el) el.textContent = allHopes.length;
}


//  q3 submit hope

function submitHope() {
    var text = document.getElementById("ans3").value.trim();
    if (!text) {
        alert("share one hope before planting it ✦");
        return;
    }
    var flower = selectedFlower || guessCategory(text);

    allHopes.unshift({ text: text, flower: flower, yours: true });
    updateCounter();
    renderHopes();

    // pop open the user's own flower once the field is on screen
    setTimeout(function () {
        document.getElementById("ending").scrollIntoView({ behavior: "smooth" });
        setTimeout(function () {
            var field = document.getElementById("hope-field");
            var mine  = field && field.querySelector(".hope-flower.yours");
            if (mine) mine.click();
        }, 700);
    }, 200);
}


//  restart entire experience (reset sliders, inputs, selections)

var restartBtn = document.getElementById("restart-btn");
if (restartBtn) {
    restartBtn.addEventListener("click", function () {
        // reset both sliders
        goToCard(0);
        goToQuestion(0);

        // clear form
        ["ans1", "ans2", "ans3"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = "";
        });
        document.querySelectorAll(".flower-item").forEach(function (c) { c.classList.remove("selected"); });
        selectedFlower = null;

        // reset the filter back to "all"
        activeFilter = "all";
        document.querySelectorAll(".filter-btn").forEach(function (b) {
            b.classList.toggle("active", b.dataset.filter === "all");
        });

        // pull the user's planted hope(s) back out of the field
        allHopes = allHopes.filter(function (h) { return !h.yours; });
        updateCounter();
        renderHopes();
    });
}

//  category filter buttons

document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        renderHopes();
    });
});

//  function for guess category from text keywords COOL

function guessCategory(text) {
    var t = text.toLowerCase();
    if (/family|daughter|son|parent|friend|love|together|people|belong|trust|kind|lonely/.test(t)) return "people";
    if (/planet|ocean|air|earth|climate|city|world|nature|clean|green|environment/.test(t))        return "world";
    if (/myself|still|making|found|kept|learn|grow|career|creat|art|health|rest/.test(t))          return "self";
    if (/equal|justice|care|education|trust|honest|fair|society/.test(t))                           return "society";
    if (/tech|ai|robot|digital|future|innov|internet|machine/.test(t))                              return "tech";
    return "peace";
}


})()