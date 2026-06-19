(function () {
    var menuToggle = document.querySelector('[data-menu-toggle]');
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            document.body.classList.toggle('menu-open');
        });
    }

    var carousel = document.querySelector('[data-hero-carousel]');
    if (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var index = 0;

        function showSlide(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(index + 1);
            }, 5200);
        }
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function applySearch() {
        var input = document.querySelector('[data-search-input]');
        var items = Array.prototype.slice.call(document.querySelectorAll('.search-item'));
        var countEl = document.querySelector('[data-result-count]');
        var categoryFilter = document.querySelector('[data-filter="category"]');
        var query = normalize(input ? input.value : '');
        var category = categoryFilter ? categoryFilter.value : '';
        var visible = 0;

        items.forEach(function (item) {
            var haystack = [
                item.getAttribute('data-title'),
                item.getAttribute('data-region'),
                item.getAttribute('data-type'),
                item.getAttribute('data-year'),
                item.getAttribute('data-genre')
            ].map(normalize).join(' ');
            var matchQuery = !query || haystack.indexOf(query) !== -1;
            var matchCategory = !category || item.getAttribute('data-category') === category;
            var shouldShow = matchQuery && matchCategory;
            item.classList.toggle('is-hidden', !shouldShow);
            if (shouldShow) {
                visible += 1;
            }
        });

        if (countEl) {
            countEl.textContent = '显示 ' + visible + ' 条';
        }
    }

    document.querySelectorAll('[data-search-input], [data-filter="category"]').forEach(function (control) {
        control.addEventListener('input', applySearch);
        control.addEventListener('change', applySearch);
    });
    applySearch();
})();

function initMoviePlayer(source) {
    var video = document.getElementById('moviePlayer');
    var overlay = document.getElementById('playOverlay');
    var shell = document.querySelector('.player-shell');
    var loaded = false;
    var hlsInstance = null;

    if (!video || !source) {
        return;
    }

    function loadSource() {
        if (loaded) {
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
        } else {
            video.src = source;
        }
        loaded = true;
    }

    function playMovie() {
        loadSource();
        if (shell) {
            shell.classList.add('is-playing');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    }

    if (overlay) {
        overlay.addEventListener('click', playMovie);
    }

    video.addEventListener('play', function () {
        if (shell) {
            shell.classList.add('is-playing');
        }
    });

    video.addEventListener('click', function () {
        if (!loaded) {
            playMovie();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
