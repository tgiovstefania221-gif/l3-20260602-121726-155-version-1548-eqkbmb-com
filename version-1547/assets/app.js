(function () {
  function pagePrefix() {
    return document.body && document.body.dataset.depth === "1" ? "../" : "";
  }

  function setupMenu() {
    var button = document.getElementById("site-menu-button");
    var links = document.getElementById("site-nav-links");
    if (!button || !links) {
      return;
    }
    button.addEventListener("click", function () {
      links.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }
    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(dotIndex);
        start();
      });
    });
    show(0);
    start();
  }

  function setupSiteSearch() {
    var input = document.getElementById("site-search-input");
    var results = document.getElementById("site-search-results");
    var index = window.SEARCH_INDEX || [];
    if (!input || !results || !index.length) {
      return;
    }
    var prefix = pagePrefix();
    function render(query) {
      var keyword = query.trim().toLowerCase();
      if (!keyword) {
        results.classList.remove("is-open");
        results.innerHTML = "";
        return;
      }
      var matched = index.filter(function (item) {
        return item.searchText.indexOf(keyword) !== -1;
      }).slice(0, 12);
      if (!matched.length) {
        results.classList.add("is-open");
        results.innerHTML = '<div class="search-result-empty">没有找到相关影片</div>';
        return;
      }
      results.innerHTML = matched.map(function (item) {
        return [
          '<a class="search-result-item" href="' + prefix + item.link + '">',
          '<img src="' + prefix + item.cover + '" alt="' + item.title + '">',
          '<span><strong>' + item.title + '</strong><small>' + item.meta + '</small></span>',
          '</a>'
        ].join("");
      }).join("");
      results.classList.add("is-open");
    }
    input.addEventListener("input", function () {
      render(input.value);
    });
    document.addEventListener("click", function (event) {
      if (!results.contains(event.target) && event.target !== input) {
        results.classList.remove("is-open");
      }
    });
  }

  function setupCategoryFilter() {
    var search = document.getElementById("category-search");
    var year = document.getElementById("filter-year");
    var type = document.getElementById("filter-type");
    var region = document.getElementById("filter-region");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    if (!cards.length || (!search && !year && !type && !region)) {
      return;
    }
    function value(element) {
      return element ? element.value.trim().toLowerCase() : "";
    }
    function filter() {
      var query = value(search);
      var yearValue = value(year);
      var typeValue = value(type);
      var regionValue = value(region);
      cards.forEach(function (card) {
        var haystack = [
          card.dataset.title || "",
          card.dataset.year || "",
          card.dataset.type || "",
          card.dataset.region || "",
          card.dataset.genre || ""
        ].join(" ").toLowerCase();
        var visible = true;
        if (query && haystack.indexOf(query) === -1) {
          visible = false;
        }
        if (yearValue && String(card.dataset.year || "").toLowerCase() !== yearValue) {
          visible = false;
        }
        if (typeValue && String(card.dataset.type || "").toLowerCase() !== typeValue) {
          visible = false;
        }
        if (regionValue && String(card.dataset.region || "").toLowerCase() !== regionValue) {
          visible = false;
        }
        card.hidden = !visible;
      });
    }
    [search, year, type, region].forEach(function (control) {
      if (control) {
        control.addEventListener("input", filter);
        control.addEventListener("change", filter);
      }
    });
  }

  window.initMoviePlayer = function initMoviePlayer(settings) {
    var video = document.getElementById(settings.videoId);
    var overlay = document.getElementById(settings.overlayId);
    var state = document.getElementById(settings.stateId);
    if (!video || !overlay || !settings.source) {
      return;
    }
    var hls = null;
    var attached = false;
    function showState(message) {
      if (!state) {
        return;
      }
      state.textContent = message;
      state.classList.add("is-visible");
      window.setTimeout(function () {
        state.classList.remove("is-visible");
      }, 1800);
    }
    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = settings.source;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(settings.source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            showState("播放暂时不可用");
          }
        });
        return;
      }
      showState("播放暂时不可用");
    }
    function start() {
      attach();
      overlay.classList.add("is-hidden");
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          overlay.classList.remove("is-hidden");
          showState("点击画面开始播放");
        });
      }
    }
    overlay.addEventListener("click", start);
    overlay.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        start();
      }
    });
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupHero();
    setupSiteSearch();
    setupCategoryFilter();
  });
})();
