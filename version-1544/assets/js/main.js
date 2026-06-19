(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initMobileNav() {
    var button = document.querySelector(".nav-toggle");
    if (!button) {
      return;
    }
    button.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var prev = document.querySelector(".hero-prev");
    var next = document.querySelector(".hero-next");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function move(step) {
      show(index + step);
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        move(1);
      }, 6500);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        move(-1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        move(1);
        start();
      });
    }

    var carousel = document.querySelector(".hero-carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", stop);
      carousel.addEventListener("mouseleave", start);
    }

    start();
  }

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function initSearch() {
    var grid = document.getElementById("searchGrid");
    if (!grid) {
      return;
    }
    var input = document.getElementById("searchInput");
    var region = document.getElementById("regionFilter");
    var genre = document.getElementById("genreFilter");
    var sort = document.getElementById("sortFilter");
    var empty = document.getElementById("emptySearch");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));

    function apply() {
      var keyword = normalize(input && input.value);
      var regionValue = region ? region.value : "";
      var genreValue = genre ? genre.value : "";
      var visible = [];

      cards.forEach(function (card) {
        var searchText = normalize(card.getAttribute("data-search"));
        var cardRegion = card.getAttribute("data-region") || "";
        var cardGenre = card.getAttribute("data-genre") || "";
        var matched = true;
        if (keyword && searchText.indexOf(keyword) === -1) {
          matched = false;
        }
        if (regionValue && cardRegion !== regionValue) {
          matched = false;
        }
        if (genreValue && cardGenre.indexOf(genreValue) === -1) {
          matched = false;
        }
        card.style.display = matched ? "" : "none";
        if (matched) {
          visible.push(card);
        }
      });

      if (sort) {
        visible.sort(function (a, b) {
          if (sort.value === "title") {
            return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-CN");
          }
          return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
        });
        visible.forEach(function (card) {
          grid.appendChild(card);
        });
      }

      if (empty) {
        empty.style.display = visible.length ? "none" : "block";
      }
    }

    [input, region, genre, sort].forEach(function (node) {
      if (!node) {
        return;
      }
      node.addEventListener("input", apply);
      node.addEventListener("change", apply);
    });

    apply();
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById("movie-video");
    var startButton = document.getElementById("player-start");
    var playButton = document.getElementById("play-toggle");
    var muteButton = document.getElementById("mute-toggle");
    var fullButton = document.getElementById("full-toggle");
    var state = document.getElementById("player-state");
    if (!video || !streamUrl) {
      return;
    }

    var hls = null;

    function setState(text) {
      if (state) {
        state.textContent = text || "";
      }
    }

    function bindStream() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", function () {
          setState("");
        });
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setState("");
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setState("视频加载失败");
          }
        });
      } else {
        video.src = streamUrl;
      }
    }

    function updateControls() {
      var paused = video.paused;
      if (playButton) {
        playButton.textContent = paused ? "播放" : "暂停";
      }
      if (startButton) {
        startButton.classList.toggle("is-hidden", !paused);
      }
      if (muteButton) {
        muteButton.textContent = video.muted ? "取消静音" : "静音";
      }
    }

    function togglePlay() {
      if (video.paused) {
        var playTask = video.play();
        if (playTask && typeof playTask.catch === "function") {
          playTask.catch(function () {
            setState("请再次点击播放");
          });
        }
      } else {
        video.pause();
      }
    }

    bindStream();

    if (startButton) {
      startButton.addEventListener("click", function (event) {
        event.preventDefault();
        togglePlay();
      });
    }

    if (playButton) {
      playButton.addEventListener("click", function (event) {
        event.preventDefault();
        togglePlay();
      });
    }

    video.addEventListener("click", function () {
      togglePlay();
    });

    video.addEventListener("play", updateControls);
    video.addEventListener("pause", updateControls);
    video.addEventListener("ended", updateControls);

    if (muteButton) {
      muteButton.addEventListener("click", function () {
        video.muted = !video.muted;
        updateControls();
      });
    }

    if (fullButton) {
      fullButton.addEventListener("click", function () {
        var frame = document.querySelector(".video-frame");
        if (frame && frame.requestFullscreen) {
          frame.requestFullscreen();
        } else if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      });
    }

    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });

    updateControls();
  };

  ready(function () {
    initMobileNav();
    initHero();
    initSearch();
  });
})();
