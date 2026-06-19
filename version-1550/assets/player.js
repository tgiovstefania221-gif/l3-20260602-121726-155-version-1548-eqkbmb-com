function initMoviePlayer(source, videoId, coverId, buttonId) {
  var video = document.getElementById(videoId);
  var cover = document.getElementById(coverId);
  var button = document.getElementById(buttonId);
  if (!video || !source) {
    return;
  }
  var loaded = false;
  var bindSource = function () {
    if (loaded) {
      return;
    }
    loaded = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else if (window.Hls && Hls.isSupported()) {
      var hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }
  };
  var start = function () {
    bindSource();
    if (cover) {
      cover.classList.add('hidden');
    }
    var playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {});
    }
  };
  if (cover) {
    cover.addEventListener('click', start);
  }
  if (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      start();
    });
  }
  video.addEventListener('click', start);
}
