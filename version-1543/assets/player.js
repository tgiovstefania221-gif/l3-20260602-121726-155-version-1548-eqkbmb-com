import { H as Hls } from './hls-vendor-dru42stk.js';

function initializePlayer(wrapper) {
  var video = wrapper.querySelector('video');
  var overlay = wrapper.querySelector('[data-player-overlay]');
  var playButton = wrapper.querySelector('[data-player-play]');
  var message = wrapper.querySelector('[data-player-message]');
  var source = video ? video.getAttribute('data-src') : '';
  var hls = null;

  function setMessage(text) {
    if (message) {
      message.textContent = text;
    }
  }

  function loadSource() {
    if (!video || !source || video.getAttribute('data-loaded') === 'true') {
      return;
    }

    video.setAttribute('data-loaded', 'true');
    setMessage('正在加载播放源');

    if (source.indexOf('.m3u8') > -1 && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        setMessage('播放源已就绪');
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setMessage('播放源加载失败，请稍后重试');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || source.indexOf('.m3u8') === -1) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        setMessage('播放源已就绪');
      });
    } else {
      setMessage('当前浏览器不支持 HLS 播放');
    }
  }

  function playVideo() {
    loadSource();

    if (!video) {
      return;
    }

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        setMessage('请再次点击播放按钮');
      });
    }
  }

  if (playButton) {
    playButton.addEventListener('click', playVideo);
  }

  if (video) {
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (overlay) {
        overlay.classList.remove('hidden');
      }
    });

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });
  }

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}

document.querySelectorAll('[data-player]').forEach(initializePlayer);
