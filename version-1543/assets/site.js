(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  var menuButton = $('[data-menu-toggle]');
  var mobileNav = $('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var backTop = $('[data-back-top]');

  if (backTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 480) {
        backTop.classList.add('show');
      } else {
        backTop.classList.remove('show');
      }
    });

    backTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  var hero = $('[data-hero]');

  if (hero) {
    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    var index = 0;

    function showSlide(nextIndex) {
      index = nextIndex % slides.length;
      if (index < 0) {
        index = slides.length - 1;
      }

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }
  }

  $all('[data-index-search]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = $('input[name="q"]', form);
      var query = input ? input.value.trim() : '';
      var target = form.getAttribute('data-search-target') || 'search.html';
      var url = query ? target + '?q=' + encodeURIComponent(query) : target;
      window.location.href = url;
    });
  });

  var filterPanel = $('[data-local-filter]');

  if (filterPanel) {
    var cards = $all('[data-movie-card]');
    var keywordInput = $('[data-filter-keyword]', filterPanel);
    var yearSelect = $('[data-filter-year]', filterPanel);

    function applyLocalFilter() {
      var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var title = (card.getAttribute('data-title') || '').toLowerCase();
        var tags = (card.getAttribute('data-tags') || '').toLowerCase();
        var cardYear = card.getAttribute('data-year') || '';
        var matchesKeyword = !keyword || title.indexOf(keyword) >= 0 || tags.indexOf(keyword) >= 0;
        var matchesYear = !year || cardYear === year;
        var shouldShow = matchesKeyword && matchesYear;

        card.style.display = shouldShow ? '' : 'none';

        if (shouldShow) {
          visible += 1;
        }
      });

      var empty = $('[data-filter-empty]');
      if (empty) {
        empty.hidden = visible > 0;
      }
    }

    if (keywordInput) {
      keywordInput.addEventListener('input', applyLocalFilter);
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', applyLocalFilter);
    }
  }

  var searchRoot = $('[data-search-page]');

  if (searchRoot && window.MovieData) {
    var params = new URLSearchParams(window.location.search);
    var searchInput = $('[data-global-search-input]', searchRoot);
    var regionSelect = $('[data-global-region]', searchRoot);
    var typeSelect = $('[data-global-type]', searchRoot);
    var resultRoot = $('[data-search-results]', searchRoot);

    if (searchInput) {
      searchInput.value = params.get('q') || '';
    }

    function movieUrl(movie) {
      return 'movie/' + movie.id + '.html';
    }

    function coverUrl(movie) {
      return movie.coverIndex + '.jpg';
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char];
      });
    }

    function renderMovie(movie) {
      var tags = movie.tags.slice(0, 4).map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + '</span>';
      }).join('');

      return [
        '<article class="movie-card">',
        '  <a class="poster-frame" href="' + movieUrl(movie) + '">',
        '    <img src="' + coverUrl(movie) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.style.opacity=\'0\';">',
        '    <span class="poster-shade"></span>',
        '    <span class="heat-badge">热度 ' + movie.heat + '</span>',
        '  </a>',
        '  <div class="movie-card-body">',
        '    <div class="movie-meta-line">',
        '      <span>' + escapeHtml(movie.yearText) + '</span>',
        '      <span>' + escapeHtml(movie.region) + '</span>',
        '      <span>' + escapeHtml(movie.type) + '</span>',
        '    </div>',
        '    <h2><a href="' + movieUrl(movie) + '">' + escapeHtml(movie.title) + '</a></h2>',
        '    <p>' + escapeHtml(movie.oneLine || movie.summary || '') + '</p>',
        '    <div class="card-tags">' + tags + '</div>',
        '  </div>',
        '</article>'
      ].join('\n');
    }

    function runSearch() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';

      var results = window.MovieData.filter(function (movie) {
        var text = [
          movie.title,
          movie.region,
          movie.type,
          movie.genreRaw,
          movie.oneLine,
          movie.summary,
          movie.tags.join(' ')
        ].join(' ').toLowerCase();
        var matchesQuery = !query || text.indexOf(query) >= 0;
        var matchesRegion = !region || movie.region.indexOf(region) >= 0;
        var matchesType = !type || movie.type === type;
        return matchesQuery && matchesRegion && matchesType;
      }).sort(function (a, b) {
        return b.year - a.year || b.heat - a.heat;
      });

      if (resultRoot) {
        if (results.length === 0) {
          resultRoot.innerHTML = '<div class="empty-state">未找到匹配影片，请尝试更换关键词或筛选条件。</div>';
        } else {
          resultRoot.innerHTML = results.slice(0, 240).map(renderMovie).join('\n');
        }
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', runSearch);
    }

    if (regionSelect) {
      regionSelect.addEventListener('change', runSearch);
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', runSearch);
    }

    runSearch();
  }
})();
