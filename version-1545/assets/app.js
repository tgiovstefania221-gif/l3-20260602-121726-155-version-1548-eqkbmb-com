(function () {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const mainNav = document.querySelector('[data-main-nav]');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function () {
            mainNav.classList.toggle('is-open');
        });
    }

    const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
    let slideIndex = 0;

    function showSlide(nextIndex) {
        if (!slides.length) {
            return;
        }
        slideIndex = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, index) {
            slide.classList.toggle('is-active', index === slideIndex);
        });
        dots.forEach(function (dot, index) {
            dot.classList.toggle('is-active', index === slideIndex);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            showSlide(index);
        });
    });

    if (slides.length > 1) {
        window.setInterval(function () {
            showSlide(slideIndex + 1);
        }, 5200);
    }

    const searchForms = Array.from(document.querySelectorAll('[data-jump-search]'));
    searchForms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const input = form.querySelector('input[name="q"]');
            const value = input ? input.value.trim() : '';
            const target = value ? './search.html?q=' + encodeURIComponent(value) : './search.html';
            window.location.href = target;
        });
    });

    const cards = Array.from(document.querySelectorAll('[data-card]'));
    const filterInput = document.querySelector('[data-filter-input]');
    const yearSelect = document.querySelector('[data-filter-year]');
    const regionSelect = document.querySelector('[data-filter-region]');
    const typeSelect = document.querySelector('[data-filter-type]');
    const emptyState = document.querySelector('[data-empty-state]');

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function applyFilters() {
        if (!cards.length) {
            return;
        }

        const keyword = normalize(filterInput ? filterInput.value : '');
        const year = normalize(yearSelect ? yearSelect.value : '');
        const region = normalize(regionSelect ? regionSelect.value : '');
        const type = normalize(typeSelect ? typeSelect.value : '');
        let visible = 0;

        cards.forEach(function (card) {
            const haystack = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-tags'),
                card.getAttribute('data-year'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type')
            ].join(' '));
            const matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
            const matchYear = !year || normalize(card.getAttribute('data-year')) === year;
            const matchRegion = !region || normalize(card.getAttribute('data-region')) === region;
            const matchType = !type || normalize(card.getAttribute('data-type')) === type;
            const keep = matchKeyword && matchYear && matchRegion && matchType;
            card.style.display = keep ? '' : 'none';
            if (keep) {
                visible += 1;
            }
        });

        if (emptyState) {
            emptyState.classList.toggle('is-visible', visible === 0);
        }
    }

    [filterInput, yearSelect, regionSelect, typeSelect].forEach(function (control) {
        if (control) {
            control.addEventListener('input', applyFilters);
            control.addEventListener('change', applyFilters);
        }
    });

    if (filterInput) {
        const params = new URLSearchParams(window.location.search);
        const queryValue = params.get('q');
        if (queryValue) {
            filterInput.value = queryValue;
        }
        applyFilters();
    }

    const playerBlocks = Array.from(document.querySelectorAll('[data-player]'));

    playerBlocks.forEach(function (block) {
        const video = block.querySelector('video');
        const button = block.querySelector('[data-play-button]');
        const layer = block.querySelector('.play-layer');

        if (!video || !button) {
            return;
        }

        function attachStream() {
            const streamUrl = button.getAttribute('data-stream');
            if (!streamUrl) {
                return;
            }

            if (video.dataset.ready === 'true') {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
                video.dataset.ready = 'true';
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                const hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                video.dataset.ready = 'true';
                return;
            }

            video.src = streamUrl;
            video.dataset.ready = 'true';
        }

        function startPlayback() {
            attachStream();
            if (layer) {
                layer.classList.add('is-hidden');
            }
            video.controls = true;
            const playTask = video.play();
            if (playTask && typeof playTask.catch === 'function') {
                playTask.catch(function () {
                    if (layer) {
                        layer.classList.remove('is-hidden');
                    }
                });
            }
        }

        button.addEventListener('click', startPlayback);
        video.addEventListener('click', function () {
            if (video.paused) {
                startPlayback();
            } else {
                video.pause();
            }
        });
    });
})();
