$(function () {
    $('.nav-btn').on('click', function () {
        $(this).toggleClass('open');
    });
});

$(window).ready(function () {
    $(window).scroll(function () {
        var scroll = $(window).scrollTop();
        if (scroll > 100) {
            $("#header").addClass('glass-effect');
        } else {
            $("#header").removeClass("glass-effect");
        }
    })
})

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function animateNumber(element, targetNumber, duration) {
    const startTime = performance.now();
    const startNumber = 0;

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentNumber = Math.floor(startNumber + progress * (targetNumber - startNumber));

        element.innerText = formatNumber(currentNumber);

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

function checkScroll() {
    const numberElements = document.querySelectorAll('.number');
    numberElements.forEach(element => {
        // Periksa jika elemen sudah dianimasikan
        if (!element.classList.contains('animated')) {
            const targetValue = parseInt(element.getAttribute("data-target"), 10);
            const durationValue = parseInt(element.getAttribute("data-duration"), 10);
            
            // Memeriksa apakah elemen muncul di viewport
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                animateNumber(element, targetValue, durationValue);
                element.classList.add('animated'); // Tandai elemen sudah dianimasikan
            }
        }
    });
}

// Menambah event listener untuk scroll
window.addEventListener('scroll', checkScroll);



