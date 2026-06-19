(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-mobile-nav]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var slider = document.querySelector('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    show(0);
    start();
  }

  function initRails() {
    var rails = Array.prototype.slice.call(document.querySelectorAll('[data-movie-rail]'));

    rails.forEach(function (rail) {
      var section = rail.closest('.content-section');
      var prev = section ? section.querySelector('[data-rail-prev]') : null;
      var next = section ? section.querySelector('[data-rail-next]') : null;

      function move(direction) {
        var amount = Math.max(280, Math.floor(rail.clientWidth * 0.72));
        rail.scrollBy({
          left: direction * amount,
          behavior: 'smooth'
        });
      }

      if (prev) {
        prev.addEventListener('click', function () {
          move(-1);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          move(1);
        });
      }
    });
  }

  function normalized(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-page]'));

    panels.forEach(function (panel) {
      var container = panel.nextElementSibling;
      var cards = container ? Array.prototype.slice.call(container.querySelectorAll('.movie-card')) : [];
      var search = panel.querySelector('[data-filter-search]');
      var type = panel.querySelector('[data-filter-type]');
      var year = panel.querySelector('[data-filter-year]');
      var count = panel.querySelector('[data-filter-count]');
      var empty = panel.parentElement ? panel.parentElement.querySelector('[data-filter-empty]') : null;

      function apply() {
        var keyword = normalized(search ? search.value : '');
        var typeValue = normalized(type ? type.value : '');
        var yearValue = normalized(year ? year.value : '');
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalized([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-category')
          ].join(' '));
          var typeMatched = !typeValue || normalized(card.getAttribute('data-type')) === typeValue;
          var yearMatched = !yearValue || normalized(card.getAttribute('data-year')) === yearValue;
          var keywordMatched = !keyword || haystack.indexOf(keyword) !== -1;
          var matched = typeMatched && yearMatched && keywordMatched;

          card.style.display = matched ? '' : 'none';

          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }

        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [search, type, year].forEach(function (element) {
        if (element) {
          element.addEventListener('input', apply);
          element.addEventListener('change', apply);
        }
      });

      apply();
    });
  }

  function initSearchPage() {
    var root = document.querySelector('[data-search-page]');

    if (!root || !window.SITE_SEARCH_INDEX) {
      return;
    }

    var input = root.querySelector('[data-search-input]');
    var type = root.querySelector('[data-search-type]');
    var year = root.querySelector('[data-search-year]');
    var results = root.querySelector('[data-search-results]');
    var count = root.querySelector('[data-search-total]');
    var button = root.querySelector('.search-box button');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (input) {
      input.value = query;
    }

    function cardTemplate(movie) {
      return [
        '<article class="movie-card">',
        '<a class="card-link" href="' + movie.url + '">',
        '<div class="poster-wrap">',
        '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '<span class="card-badge">' + escapeHtml(movie.type) + '</span>',
        '<span class="card-year">' + escapeHtml(movie.year) + '</span>',
        '</div>',
        '<div class="card-body">',
        '<h3>' + escapeHtml(movie.title) + '</h3>',
        '<p>' + escapeHtml(movie.oneLine) + '</p>',
        '<div class="card-meta"><span>' + escapeHtml(movie.genre) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
        '</div>',
        '</a>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function render() {
      var keyword = normalized(input ? input.value : '');
      var typeValue = normalized(type ? type.value : '');
      var yearValue = normalized(year ? year.value : '');
      var matched = window.SITE_SEARCH_INDEX.filter(function (movie) {
        var haystack = normalized([
          movie.title,
          movie.region,
          movie.type,
          movie.genre,
          movie.category,
          movie.oneLine
        ].join(' '));
        var keywordMatched = !keyword || haystack.indexOf(keyword) !== -1;
        var typeMatched = !typeValue || normalized(movie.type) === typeValue;
        var yearMatched = !yearValue || normalized(movie.year) === yearValue;

        return keywordMatched && typeMatched && yearMatched;
      });

      if (count) {
        count.textContent = String(matched.length);
      }

      if (results) {
        results.innerHTML = matched.slice(0, 240).map(cardTemplate).join('');
      }
    }

    [input, type, year].forEach(function (element) {
      if (element) {
        element.addEventListener('input', render);
        element.addEventListener('change', render);
      }
    });

    if (button) {
      button.addEventListener('click', render);
    }

    render();
  }

  function initPlayer() {
    var player = document.querySelector('[data-player]');

    if (!player) {
      return;
    }

    var video = player.querySelector('video');
    var overlay = player.querySelector('[data-play-trigger]');
    var configNode = document.getElementById('player-config');
    var config = null;
    var loaded = false;
    var hls = null;

    if (!video || !overlay || !configNode) {
      return;
    }

    try {
      config = JSON.parse(configNode.textContent);
    } catch (error) {
      config = null;
    }

    if (!config || !config.src) {
      return;
    }

    function loadStream() {
      if (loaded) {
        return;
      }

      loaded = true;
      video.poster = config.poster || video.poster;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = config.src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 30,
          backBufferLength: 30
        });
        hls.loadSource(config.src);
        hls.attachMedia(video);
      } else {
        video.src = config.src;
      }
    }

    function play() {
      loadStream();
      overlay.classList.add('is-hidden');
      video.controls = true;

      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.classList.remove('is-hidden');
        });
      }
    }

    overlay.addEventListener('click', function (event) {
      event.preventDefault();
      play();
    });

    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener('play', function () {
      overlay.classList.add('is-hidden');
    });

    window.addEventListener('pagehide', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  }

  ready(function () {
    initNavigation();
    initHero();
    initRails();
    initFilters();
    initSearchPage();
    initPlayer();
  });
}());
