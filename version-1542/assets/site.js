import { H as Hls } from './hls-vendor-dru42stk.js';

const menuButton = document.querySelector('[data-menu-toggle]');
const siteNav = document.querySelector('[data-site-nav]');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    siteNav.classList.toggle('is-open');
    document.body.classList.toggle('menu-open', siteNav.classList.contains('is-open'));
  });
}

const backToTop = document.querySelector('[data-back-to-top]');

if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 500);
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const heroSlides = Array.from(document.querySelectorAll('[data-hero-slide]'));
const heroDots = document.querySelector('[data-hero-dots]');
let heroIndex = 0;
let heroTimer = null;

function showHeroSlide(index) {
  if (!heroSlides.length) {
    return;
  }

  heroIndex = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === heroIndex);
  });

  if (heroDots) {
    Array.from(heroDots.children).forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === heroIndex);
    });
  }
}

if (heroSlides.length && heroDots) {
  heroSlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `切换到第 ${index + 1} 张焦点图`);
    dot.addEventListener('click', () => {
      showHeroSlide(index);
      if (heroTimer) {
        window.clearInterval(heroTimer);
      }
      heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 5200);
    });
    heroDots.appendChild(dot);
  });

  showHeroSlide(0);
  heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 5200);
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function setupFilters(scope) {
  const input = scope.querySelector('[data-movie-filter]');
  const yearSelect = scope.querySelector('[data-year-filter]');
  const regionSelect = scope.querySelector('[data-region-filter]');
  const cards = Array.from(scope.querySelectorAll('.movie-card'));
  const count = scope.querySelector('[data-filter-count]');

  if (!cards.length) {
    return;
  }

  function applyFilter() {
    const keyword = normalizeText(input ? input.value : '');
    const year = yearSelect ? yearSelect.value : '';
    const region = regionSelect ? regionSelect.value : '';
    let visible = 0;

    cards.forEach((card) => {
      const haystack = normalizeText([
        card.dataset.title,
        card.dataset.region,
        card.dataset.year,
        card.dataset.genre,
        card.dataset.tags,
      ].join(' '));
      const matchKeyword = !keyword || haystack.includes(keyword);
      const matchYear = !year || (card.dataset.year || '').includes(year);
      const matchRegion = !region || (card.dataset.region || '').includes(region);
      const matched = matchKeyword && matchYear && matchRegion;

      card.hidden = !matched;
      if (matched) {
        visible += 1;
      }
    });

    if (count) {
      count.textContent = `显示 ${visible} / ${cards.length} 部`;
    }
  }

  if (input) {
    input.addEventListener('input', applyFilter);
  }
  if (yearSelect) {
    yearSelect.addEventListener('change', applyFilter);
  }
  if (regionSelect) {
    regionSelect.addEventListener('change', applyFilter);
  }

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && input) {
    input.value = q;
  }
  applyFilter();
}

document.querySelectorAll('[data-filter-section]').forEach((section) => {
  const scope = section.parentElement || document;
  setupFilters(scope);
});

function setupPlayer(playerShell) {
  const video = playerShell.querySelector('video');
  const button = playerShell.querySelector('[data-play-button]');
  const message = playerShell.querySelector('[data-player-message]');
  const src = playerShell.dataset.src;
  let hls = null;

  if (!video || !button || !src) {
    return;
  }

  function setMessage(text) {
    if (message) {
      message.textContent = text;
    }
  }

  async function startPlayback() {
    button.classList.add('is-hidden');
    setMessage('正在加载高清线路');

    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data && data.fatal) {
            setMessage('播放源未就绪，请检查对应 m3u8 文件');
          }
        });
      } else {
        setMessage('当前浏览器不支持 HLS 播放');
        button.classList.remove('is-hidden');
        return;
      }

      await video.play();
      setMessage('正在播放');
    } catch (error) {
      setMessage('播放源未就绪，请检查对应 m3u8 文件');
      button.classList.remove('is-hidden');
    }
  }

  button.addEventListener('click', startPlayback);
  video.addEventListener('play', () => button.classList.add('is-hidden'));
  video.addEventListener('pause', () => {
    if (!video.currentTime) {
      button.classList.remove('is-hidden');
    }
  });
}

document.querySelectorAll('[data-player]').forEach(setupPlayer);
