(function() {
    'use strict';

    const body = document.body;
    const switchBtn = document.getElementById('switchBtn');
    let mode = 'awake';
 
    switchBtn.addEventListener('click', function() {
    if (mode === 'awake') {
        body.className = 'sleep';
        mode = 'sleep';
    } else {
        body.removeAttribute('class');
        mode = 'awake';
    }
    });


})()