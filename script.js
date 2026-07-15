// Hero background video — rotates through the flagship reels, muted + looped
const heroReels = ['5sLzyEzUbPo', 'b_msmgFr4hg', '64UYVtCI06I', '0R4KVDOt0vk'];

function initHeroPlayer() {
  if (!document.getElementById('heroPlayer')) return; // page has no hero video
  let heroReelIndex = 0;
  new YT.Player('heroPlayer', {
    videoId: heroReels[0],
    playerVars: {
      // No `loop`/`playlist` here on purpose — those two together are what
      // put the player into YouTube's native "playlist" mode, and that mode
      // is what draws the prev/next/pause chrome on top of the video even
      // with controls:0. We rotate through heroReels ourselves instead
      // (see onStateChange below), so the player never knows it's playing
      // a playlist and never shows that UI.
      autoplay: 1,
      mute: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      disablekb: 1,
      iv_load_policy: 3,
      playsinline: 1,
      cc_load_policy: 0
    },
    events: {
      onReady: (e) => {
        e.target.mute();
        e.target.playVideo();
        e.target.unloadModule('captions');
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          e.target.unloadModule('captions');
        }
        if (e.data === YT.PlayerState.ENDED) {
          heroReelIndex = (heroReelIndex + 1) % heroReels.length;
          e.target.loadVideoById(heroReels[heroReelIndex]);
        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.CUED) {
          e.target.playVideo();
        }
      }
    }
  });
}

// Ambient background players (Nosotros boxes) — same treatment as the hero,
// just muted/looped/no-captions, lazy-started once scrolled near view.
const pendingYouTubeInits = [];

function createAmbientPlayer(containerId, videoId, startSeconds) {
  new YT.Player(containerId, {
    videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      loop: 1,
      playlist: videoId,
      start: startSeconds,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      disablekb: 1,
      playsinline: 1,
      cc_load_policy: 0
    },
    events: {
      onReady: (e) => {
        e.target.mute();
        e.target.playVideo();
        e.target.unloadModule('captions');
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          e.target.unloadModule('captions');
        }
        if (e.data === YT.PlayerState.ENDED) {
          // loop back past the intro, not to frame 0
          e.target.seekTo(startSeconds, true);
          e.target.playVideo();
        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.CUED) {
          e.target.playVideo();
        }
      }
    }
  });
}

// Project page hero video — autoplays muted (browser policy), with a
// sound toggle button since this is the main content, not ambient background.
function initProjectPlayer() {
  const container = document.getElementById('projectPlayer');
  if (!container) return;
  const videoId = container.dataset.videoId;
  const soundBtn = document.getElementById('projectVideoSound');
  const player = new YT.Player('projectPlayer', {
    videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      showinfo: 0,
      iv_load_policy: 3,
      playsinline: 1,
      cc_load_policy: 0
    },
    events: {
      onReady: (e) => {
        e.target.mute();
        e.target.playVideo();
        e.target.unloadModule('captions');
      }
    }
  });
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (player.isMuted()) {
        player.unMute();
        soundBtn.textContent = 'SOUND ON';
        soundBtn.classList.add('is-on');
        soundBtn.setAttribute('aria-label', 'Silenciar');
      } else {
        player.mute();
        soundBtn.textContent = 'SOUND OFF';
        soundBtn.classList.remove('is-on');
        soundBtn.setAttribute('aria-label', 'Activar sonido');
      }
    });
  }
}

if (document.getElementById('heroPlayer') || document.querySelector('[id^="nosotrosVideo"]') || document.getElementById('projectPlayer')) {
  const ytApiTag = document.createElement('script');
  ytApiTag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(ytApiTag);
  window.onYouTubeIframeAPIReady = () => {
    initHeroPlayer();
    initProjectPlayer();
    pendingYouTubeInits.forEach((run) => run());
    pendingYouTubeInits.length = 0;
  };
}

document.querySelectorAll('.nosotros-box [id^="nosotrosVideo"]').forEach((el) => {
  const startSeconds = parseInt(el.dataset.start, 10) || 0;
  const start = () => createAmbientPlayer(el.id, el.dataset.videoId, startSeconds);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (window.YT && window.YT.Player) start(); else pendingYouTubeInits.push(start);
        observer.unobserve(el);
      }
    });
  }, { rootMargin: '600px 0px' });
  observer.observe(el);
});

// Header solid-on-scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Hero video darkens progressively as you scroll (video stays pinned via CSS sticky)
const heroOverlay = document.getElementById('heroOverlay');
if (heroOverlay) {
  const darkenRange = window.innerHeight * 0.7;
  const updateHeroDarken = () => {
    const progress = Math.min(Math.max(window.scrollY / darkenRange, 0), 1);
    heroOverlay.style.opacity = progress;
  };
  window.addEventListener('scroll', updateHeroDarken, { passive: true });
  updateHeroDarken();
}

// Reserve form: the brief textarea grows with its content instead of clipping it
const briefTextarea = document.querySelector('.reserve-field textarea');
if (briefTextarea) {
  const autoGrow = () => {
    briefTextarea.style.height = 'auto';
    briefTextarea.style.height = `${briefTextarea.scrollHeight}px`;
  };
  briefTextarea.addEventListener('input', autoGrow);
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  mobileNav.classList.toggle('open');
  document.body.classList.toggle('nav-open', mobileNav.classList.contains('open'));
});
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.classList.remove('nav-open');
  });
});

// Text-scramble/decode reveal for the FEAT_SELECT block
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#';

function scrambleReveal(el, finalText) {
  const length = finalText.length;
  const queue = [];
  for (let i = 0; i < length; i++) {
    const start = Math.floor(Math.random() * 20);
    const end = start + Math.floor(Math.random() * 20) + 10;
    queue.push({ to: finalText[i], start, end, char: '' });
  }
  let frame = 0;
  function update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (frame >= item.end) {
        complete++;
        output += item.to;
      } else if (frame >= item.start) {
        if (!item.char || Math.random() < 0.3) {
          item.char = item.to === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        output += item.char;
      } else {
        output += ' ';
      }
    }
    el.textContent = output;
    if (complete < queue.length) {
      frame++;
      requestAnimationFrame(update);
    } else {
      el.textContent = finalText;
    }
  }
  update();
}

const scrambleEls = document.querySelectorAll('.scramble-el');
if (scrambleEls.length) {
  const scrambleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        scrambleReveal(entry.target, entry.target.dataset.scramble);
        scrambleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  scrambleEls.forEach((el) => scrambleObserver.observe(el));
}

// Scroll reveal
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach(item => revealObserver.observe(item));

// Video lightbox
const lightbox = document.getElementById('lightbox');
const lightboxFrame = document.getElementById('lightboxFrame');
const lightboxClose = document.getElementById('lightboxClose');

// Project photo lightbox — click a BTS photo to see it bigger
document.querySelectorAll('.project-photo, .about-gallery-photo').forEach(photo => {
  photo.addEventListener('click', () => {
    const img = photo.querySelector('img');
    if (!img) return;
    lightboxFrame.classList.add('is-photo');
    lightboxFrame.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    lightbox.classList.add('open');
    document.body.classList.add('nav-open');
  });
});

document.querySelectorAll('.reel-card, .feat-tile').forEach(card => {
  card.addEventListener('click', () => {
    const link = card.dataset.link;
    if (link) { window.location.href = link; return; } // tile points to its own project page
    const videoId = card.dataset.video;
    if (!videoId) return; // placeholder tile (no real video yet)
    lightboxFrame.classList.remove('is-photo');
    lightboxFrame.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="TruViews video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    lightbox.classList.add('open');
    document.body.classList.add('nav-open');
  });
});


// FEAT_SELECT / PROJECT_SELECT gallery — click a name to filter the grid.
// Directed adds a category level (Music Video / Commercial / Narrative) on
// top; Home just has the single artist-level filter.
const featCategories = document.querySelectorAll('.feat-category[data-category]');
const featSubLists = document.querySelectorAll('.feat-names[data-subfilter-for]');
const featNames = document.querySelectorAll('.feat-name[data-artist]');
const featItems = document.querySelectorAll('.feat-item');

if (featCategories.length) {
  let activeCategory = featCategories[0].dataset.category;
  let activeArtist = null;

  function showCategory() {
    featCategories.forEach((el) => el.classList.toggle('active', el.dataset.category === activeCategory));
    featSubLists.forEach((el) => { el.hidden = el.dataset.subfilterFor !== activeCategory; });
    featNames.forEach((el) => el.classList.remove('active'));
    featItems.forEach((item) => {
      const tile = item.querySelector('.feat-tile');
      item.style.display = tile.dataset.category === activeCategory ? '' : 'none';
      item.classList.remove('dimmed', 'active');
    });
  }

  featCategories.forEach((cat) => {
    cat.addEventListener('click', () => {
      if (cat.dataset.category === activeCategory) return;
      activeCategory = cat.dataset.category;
      activeArtist = null;
      showCategory();
    });
  });

  featNames.forEach((nameEl) => {
    nameEl.addEventListener('click', () => {
      const artist = nameEl.dataset.artist;
      activeArtist = activeArtist === artist ? null : artist;
      featNames.forEach((el) => el.classList.toggle('active', el.dataset.artist === activeArtist));
      featItems.forEach((item) => {
        const tile = item.querySelector('.feat-tile');
        item.classList.remove('dimmed');
        if (tile.dataset.category !== activeCategory) { item.style.display = 'none'; return; }
        if (!activeArtist) {
          item.style.display = '';
          item.classList.remove('active');
          return;
        }
        const artists = tile.dataset.artists.split(',');
        const match = artists.includes(activeArtist);
        item.style.display = match ? '' : 'none';
        item.classList.toggle('active', match);
      });
    });
  });

  showCategory();
} else if (featNames.length && featItems.length) {
  let activeArtist = null;
  featNames.forEach((nameEl) => {
    nameEl.addEventListener('click', () => {
      const artist = nameEl.dataset.artist;
      activeArtist = activeArtist === artist ? null : artist;
      featNames.forEach((el) => el.classList.toggle('active', el.dataset.artist === activeArtist));
      featItems.forEach((item) => {
        item.classList.remove('dimmed');
        if (!activeArtist) {
          item.style.display = '';
          item.classList.remove('active');
          return;
        }
        const artists = item.querySelector('.feat-tile').dataset.artists.split(',');
        const match = artists.includes(activeArtist);
        item.style.display = match ? '' : 'none';
        item.classList.toggle('active', match);
      });
    });
  });
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxFrame.classList.remove('is-photo');
  lightboxFrame.innerHTML = '';
  document.body.classList.remove('nav-open');
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (!e.target.closest('.lightbox-frame') && !e.target.closest('.lightbox-close')) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// Contact form (Formspree) — submit without leaving the page
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const formStatus = contactForm.querySelector('.form-status');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.textContent = 'Enviando…';
    formStatus.className = 'form-status';
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        contactForm.reset();
        formStatus.textContent = 'Mensaje enviado. Te contactamos pronto.';
        formStatus.classList.add('success');
      } else {
        formStatus.textContent = 'Hubo un error. Escríbenos por Instagram.';
        formStatus.classList.add('error');
      }
    } catch {
      formStatus.textContent = 'Hubo un error. Escríbenos por Instagram.';
      formStatus.classList.add('error');
    }
  });
}

// Swipe-card indicators (bio-grid on mobile) — also resizes the track to
// match the height of whichever slide is currently visible, so the dots
// sit right under the visible text instead of after a lot of empty space.
document.querySelectorAll('[data-swipe]').forEach((track) => {
  const dots = document.querySelectorAll(`.swipe-dots[data-target="${track.dataset.swipe}"] .swipe-dot`);

  function syncSlideHeight() {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const activeSlide = track.children[index];
    if (activeSlide) track.style.height = `${activeSlide.offsetHeight}px`;
    return index;
  }

  window.addEventListener('load', syncSlideHeight);
  window.addEventListener('resize', syncSlideHeight);
  syncSlideHeight();

  if (!dots.length) return;
  track.addEventListener('scroll', () => {
    const index = syncSlideHeight();
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }, { passive: true });
});
