(function () {
    var navButton = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (navButton && navLinks) {
        navButton.addEventListener('click', function () {
            navLinks.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var currentSlide = 0;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle('is-active', i === currentSlide);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === currentSlide);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            showSlide(index);
        });
    });

    if (slides.length > 1) {
        setInterval(function () {
            showSlide(currentSlide + 1);
        }, 5600);
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    var searchInput = document.querySelector('.js-card-search');
    var typeFilter = document.querySelector('.js-type-filter');
    var yearFilter = document.querySelector('.js-year-filter');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

    function filterCards() {
        var query = normalize(searchInput ? searchInput.value : '');
        var typeValue = typeFilter ? typeFilter.value : '';
        var yearValue = yearFilter ? yearFilter.value : '';

        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type'),
                card.getAttribute('data-genre'),
                card.getAttribute('data-tags')
            ].join(' '));
            var matchQuery = !query || haystack.indexOf(query) !== -1;
            var matchType = !typeValue || card.getAttribute('data-type') === typeValue;
            var matchYear = !yearValue || card.getAttribute('data-year') === yearValue;
            card.classList.toggle('is-hidden', !(matchQuery && matchType && matchYear));
        });
    }

    [searchInput, typeFilter, yearFilter].forEach(function (item) {
        if (item) {
            item.addEventListener('input', filterCards);
            item.addEventListener('change', filterCards);
        }
    });

    function attachPlayer(root) {
        var video = root.querySelector('video');
        var button = root.querySelector('.play-layer');
        var streamUrl = root.getAttribute('data-video');
        var loaded = false;

        function loadAndPlay() {
            if (!video || !streamUrl) {
                return;
            }
            if (!loaded) {
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = streamUrl;
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls();
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);
                } else {
                    video.src = streamUrl;
                }
                loaded = true;
            }
            root.classList.add('is-playing');
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener('click', loadAndPlay);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    loadAndPlay();
                } else {
                    video.pause();
                }
            });
            video.addEventListener('play', function () {
                root.classList.add('is-playing');
            });
        }
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-video-player]')).forEach(attachPlayer);
})();
