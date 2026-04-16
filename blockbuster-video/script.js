(function() {
    'use strict';
        const POEMS = [
        "it starts with something small, a single leaf catching the light...",
        "and then you see it is not alone. it was never alone.",
        "that every branch was holding it long before it learned to let go.",
        "it was always part of something rooted, vast, and unbreakably alive."
        ];

    const videos = [
    document.getElementById('leaf-video-1'),
    document.getElementById('leaf-video-2'),
    document.getElementById('leaf-video-3'),
    document.getElementById('leaf-video-4'),
    ];

    const placeholders = [
    document.getElementById('ph-1'),
    document.getElementById('ph-2'),
    document.getElementById('ph-3'),
    document.getElementById('ph-4'),
    ];

    const dots = document.querySelectorAll('.dot');
    const frame = document.getElementById('video-frame');
    const overlayP = document.getElementById('overlay-paragraph');
    const toggleBtn = document.getElementById('leaf-toggle');
    const toggleImg = document.getElementById('leaf-toggle-img');
    const section = document.getElementById('video-section');

    let currentChapter = -1;
    let isGrayscale = false;
    let letterTimer = null;

    /* ── grayscale button ── */
    toggleBtn.addEventListener('click', () => {
    isGrayscale = !isGrayscale;
    frame.classList.toggle('grayscale', isGrayscale);
    toggleImg.src = isGrayscale ? 'images/leaf-color.png' : 'images/leaf-gray.png';
    });

    /* ── text reveal ── */
    function revealText(text) {
    if (letterTimer) clearTimeout(letterTimer);
    overlayP.innerHTML = '';

    [...text].forEach(char => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char === ' ' ? '\u00a0' : char;
        overlayP.appendChild(span);
    });

    const letters = overlayP.querySelectorAll('.letter');
    let i = 0;
    const speed = 38;

    function reveal() {
        if (i < letters.length) {
        letters[i].classList.add('visible');
        i++;
        letterTimer = setTimeout(reveal, speed);
        }
    }
    reveal();
    }

    /* ── switch to next chapter (dots) ── */
    function switchChapter(idx) {
    if (idx === currentChapter) return;
    currentChapter = idx;

    // update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));

    // hide videos & placeholders for video
    videos.forEach((v, i) => {
        const wasActive = v.classList.contains('active');
        v.classList.remove('active');
        placeholders[i].classList.remove('active');
        if (wasActive) v.pause();
    });

    // show selected vid
    const vid = videos[idx];
    const ph  = placeholders[idx];

    vid.classList.add('active');
    ph.classList.add('active');

    // autoplay
    vid.currentTime = 0;
    vid.play();

    // reveal text after 2 seconds
    overlayP.innerHTML = '';
    setTimeout(() => revealText(POEMS[idx]), 2000);
    }

    /* ── scroll animations ── */
    function onScroll() {
    const rect          = section.getBoundingClientRect();
    const sectionHeight = section.offsetHeight - window.innerHeight;
    const scrolled      = -rect.top;

    if (scrolled < 0) return; // above section

    const progress = Math.min(scrolled / sectionHeight, 1); //
    const chapter  = Math.min(Math.floor(progress * 4), 3);

    switchChapter(chapter);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Dot nav ── */
    dots.forEach(dot => {
    dot.addEventListener('click', () => {
        const ch = parseInt(dot.dataset.chapter);
        const sectionTop = section.offsetTop;
        const sectionH = section.offsetHeight - window.innerHeight;
        const targetScroll = sectionTop + (ch / 4) * sectionH + 10;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
    });


    switchChapter(0);


})()