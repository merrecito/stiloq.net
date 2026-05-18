/**
 * STILOQ — comportamiento global
 * - Cabecera al scroll
 * - Menú móvil
 * - Animaciones al entrar en viewport
 * - Formulario de contacto (demo: sin backend; enlazar a Formspree / API)
 */

(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var nav = document.querySelector("[data-site-nav]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var animated = document.querySelectorAll("[data-animate]");
  var yearEl = document.querySelector("[data-year]");
  var form = document.getElementById("contact-form");
  var feedback = document.querySelector("[data-form-feedback]");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function setHeaderScrolled() {
    if (!header) return;
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("is-scrolled", y > 8);
  }

  setHeaderScrolled();
  window.addEventListener("scroll", setHeaderScrolled, { passive: true });

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var hero = document.getElementById("inicio");
  if (hero && hero.hasAttribute("data-animate")) {
    hero.classList.add("is-visible");
  }

  if ("IntersectionObserver" in window && animated.length && !prefersReducedMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    animated.forEach(function (el) {
      if (el.classList.contains("is-visible")) return;
      io.observe(el);
    });
  } else {
    animated.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var yearsBanner = document.querySelector("[data-years-banner]");
  if (yearsBanner) {
    var yearsCounterEl = yearsBanner.querySelector("[data-years-counter-value]");
    var yearsAnnounceEl = yearsBanner.querySelector("[data-years-announce]");
    var yearsBase = parseInt(yearsBanner.getAttribute("data-years-base"), 10) || 15;
    var yearsBaseYear = parseInt(yearsBanner.getAttribute("data-years-base-year"), 10) || 2026;
    var yearsTarget = yearsBase + Math.max(0, new Date().getFullYear() - yearsBaseYear);
    var yearsTicking = false;

    function setYearsValue(value) {
      if (!yearsCounterEl) return;
      yearsCounterEl.textContent = String(value);
    }

    function updateYearsAnnounce(value) {
      if (!yearsAnnounceEl) return;
      yearsAnnounceEl.textContent =
        "STILOQ cuenta con " +
        value +
        " años de experiencia en la industria textil.";
    }

    function clampYears(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function getYearsScrollProgress() {
      var rect = yearsBanner.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var start = vh * 0.9;
      var end = vh * 0.18;
      return clampYears((start - rect.top) / (start - end), 0, 1);
    }

    function updateYearsBannerFromScroll() {
      yearsTicking = false;
      var progress = getYearsScrollProgress();
      var value = prefersReducedMotion
        ? yearsTarget
        : Math.max(1, Math.round(progress * yearsTarget));
      setYearsValue(value);
      updateYearsAnnounce(value);
      yearsBanner.classList.toggle("is-complete", progress >= 0.98 || prefersReducedMotion);
    }

    function requestYearsBannerUpdate() {
      if (yearsTicking) return;
      yearsTicking = true;
      window.requestAnimationFrame(updateYearsBannerFromScroll);
    }

    yearsBanner.dataset.yearsTarget = String(yearsTarget);
    document.querySelectorAll("[data-stiloq-years]").forEach(function (el) {
      el.textContent = String(yearsTarget);
    });
    updateYearsBannerFromScroll();
    window.addEventListener("scroll", requestYearsBannerUpdate, { passive: true });
    window.addEventListener("resize", requestYearsBannerUpdate);
  }

  var homeHero = document.querySelector("[data-home-hero]");
  if (homeHero && !prefersReducedMotion) {
    var homeHeroVideo = homeHero.querySelector("[data-home-hero-video]");
    var tickingHero = false;
    var videoReady = false;

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function scrubHomeHeroVideo(progress) {
      if (!videoReady || !homeHeroVideo.duration) return;
      var targetTime = progress * homeHeroVideo.duration;
      if (Math.abs(homeHeroVideo.currentTime - targetTime) > 0.04) {
        homeHeroVideo.currentTime = targetTime;
      }
    }

    function updateHomeHero() {
      tickingHero = false;
      var rect = homeHero.getBoundingClientRect();
      var progress = clamp(-rect.top / (rect.height * 0.72), 0, 1);
      var scale = 1 + progress * 0.18;
      var bgY = progress * -72;
      var contentY = progress * -44;
      var contentOpacity = clamp(1 - progress * 1.35, 0, 1);
      var overlayOpacity = 1 + progress * 0.18;

      homeHero.style.setProperty("--hero-bg-scale", scale.toFixed(3));
      homeHero.style.setProperty("--hero-bg-y", bgY.toFixed(1) + "px");
      homeHero.style.setProperty("--hero-content-y", contentY.toFixed(1) + "px");
      homeHero.style.setProperty("--hero-content-opacity", contentOpacity.toFixed(3));
      homeHero.style.setProperty("--hero-overlay-opacity", overlayOpacity.toFixed(3));
      scrubHomeHeroVideo(progress);
    }

    function requestHomeHeroUpdate() {
      if (tickingHero) return;
      tickingHero = true;
      window.requestAnimationFrame(updateHomeHero);
    }

    updateHomeHero();
    window.addEventListener("scroll", requestHomeHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHomeHeroUpdate);

    if (homeHeroVideo && homeHeroVideo.dataset.src) {
      fetch(homeHeroVideo.dataset.src, { method: "HEAD" })
        .then(function (response) {
          if (!response.ok) return;
          homeHeroVideo.src = homeHeroVideo.dataset.src;
          homeHeroVideo.load();
        })
        .catch(function () {
          // Keep the image fallback when the optional scrub video is not present.
        });

      homeHeroVideo.addEventListener("loadedmetadata", function () {
        videoReady = true;
        homeHero.classList.add("is-video-ready");
        homeHeroVideo.pause();
        updateHomeHero();
      });
    }
  }

  if (window.location.hash === "#sq-hogar") {
    window.location.replace(window.location.pathname + window.location.search + "#quienes-somos");
  }

  var aboutGallery = document.querySelector("[data-about-gallery]");
  if (aboutGallery) {
    var aboutFrames = aboutGallery.querySelectorAll("[data-showcase-category]");

    function playAboutVideo(video) {
      if (!video || prefersReducedMotion) return;
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      var attempt = function () {
        var p = video.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      };
      if (video.readyState >= 2) attempt();
      else video.addEventListener("loadeddata", attempt, { once: true });
    }

    function ensureAboutFrameLayers(frame) {
      if (!frame.querySelector(".about-editorial__shade")) {
        var shade = document.createElement("div");
        shade.className = "about-editorial__shade";
        shade.setAttribute("aria-hidden", "true");
        var existingOverlay = frame.querySelector(".about-editorial__overlay");
        if (existingOverlay) {
          frame.insertBefore(shade, existingOverlay);
        } else {
          frame.appendChild(shade);
        }
      }
      if (!frame.querySelector(".about-editorial__overlay")) {
        var overlay = document.createElement("div");
        overlay.className = "about-editorial__overlay";
        frame.appendChild(overlay);
      }
    }

    function setAboutFrameMedia(frame, url, type, label) {
      var mediaWrap = frame.querySelector(".about-editorial__media-wrap") || frame;
      var existing = mediaWrap.querySelector(".about-editorial__media, img, video");
      if (existing) existing.remove();

      if (type === "video") {
        var video = document.createElement("video");
        video.className = "about-editorial__media";
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = !prefersReducedMotion;
        video.preload = "auto";
        video.setAttribute("aria-label", label || "");
        video.setAttribute("disablepictureinpicture", "");
        video.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
        mediaWrap.appendChild(video);
        ensureAboutFrameLayers(frame);
        playAboutVideo(video);
        return;
      }

      var img = document.createElement("img");
      img.className = "about-editorial__media";
      img.src = url;
      img.alt = label || "";
      img.width = 960;
      img.height = 1280;
      img.loading = "lazy";
      img.decoding = "async";
      mediaWrap.appendChild(img);
      ensureAboutFrameLayers(frame);
    }

    var showcaseMediaExt = /\.(mp4|webm|mov|jpe?g|png|webp)$/i;
    var showcaseVideoExt = /\.(mp4|webm|mov)$/i;
    var showcaseCategories = [];

    aboutFrames.forEach(function (frame) {
      var category = frame.getAttribute("data-showcase-category");
      if (category && showcaseCategories.indexOf(category) === -1) {
        showcaseCategories.push(category);
      }
      ensureAboutFrameLayers(frame);
    });

    function frameLabel(frame, category) {
      var fallbackEl = frame.querySelector("[data-showcase-fallback], img");
      return fallbackEl ? fallbackEl.getAttribute("alt") || category : category;
    }

    function normalizeShowcaseEntry(entry) {
      if (!entry) return null;
      var file = typeof entry === "string" ? entry : entry.file;
      if (!file) return null;
      var type =
        typeof entry === "object" && entry.type
          ? entry.type
          : showcaseVideoExt.test(file)
            ? "video"
            : "image";
      return { file: file, type: type };
    }

    function applyShowcaseManifest(manifest) {
      if (!manifest || typeof manifest !== "object") return;

      aboutFrames.forEach(function (frame) {
        var category = frame.getAttribute("data-showcase-category");
        var entry = normalizeShowcaseEntry(manifest[category]);
        if (!entry) return;

        setAboutFrameMedia(
          frame,
          "assets/showcase/" + category + "/" + entry.file,
          entry.type,
          frameLabel(frame, category)
        );
      });
    }

    function discoverShowcaseFromListing(category) {
      return fetch("assets/showcase/" + category + "/", { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("no listing");
          return res.text();
        })
        .then(function (html) {
          var files = [];
          var re = /href="([^"]+)"/gi;
          var match;
          while ((match = re.exec(html))) {
            var name = decodeURIComponent(match[1].replace(/\/$/, ""));
            if (!name || name === ".." || name === ".") continue;
            if (name === ".gitkeep" || name.indexOf("/") !== -1) continue;
            if (showcaseMediaExt.test(name)) files.push(name);
          }
          if (!files.length) return null;
          files.sort(function (a, b) {
            var aVideo = showcaseVideoExt.test(a);
            var bVideo = showcaseVideoExt.test(b);
            if (aVideo !== bVideo) return aVideo ? -1 : 1;
            return a.localeCompare(b);
          });
          var file = files[0];
          return {
            file: file,
            type: showcaseVideoExt.test(file) ? "video" : "image",
          };
        })
        .catch(function () {
          return null;
        });
    }

    function loadShowcaseMedia() {
      var manifest = {};

      return fetch("assets/showcase/manifest.json?v=" + Date.now(), { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("manifest");
          return res.json();
        })
        .catch(function () {
          return {};
        })
        .then(function (fromFile) {
          manifest = fromFile && typeof fromFile === "object" ? fromFile : {};
          var pending = showcaseCategories.map(function (category) {
            if (manifest[category]) return Promise.resolve();
            return discoverShowcaseFromListing(category).then(function (entry) {
              if (entry) manifest[category] = entry;
            });
          });
          return Promise.all(pending).then(function () {
            return manifest;
          });
        })
        .then(applyShowcaseManifest);
    }

    loadShowcaseMedia();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      aboutGallery.querySelectorAll("video").forEach(playAboutVideo);
    });
  }

  var valuesSection = document.querySelector("[data-values-section]");
  var valuesMatrix = document.querySelector("[data-values-matrix]");
  if (valuesSection && valuesMatrix) {
    var valuesTiles = valuesMatrix.querySelectorAll(".values-tile");
    var valuesCanHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var valuesReducedMotion = prefersReducedMotion;
    var valuesTicking = false;
    var valuesTileHomes = null;

    function shouldHideValuesTiles(vh) {
      var introEl = valuesSection.querySelector(".values-layout__intro");
      if (!introEl) {
        return valuesSection.getBoundingClientRect().top > vh * 0.88;
      }
      var intro = introEl.getBoundingClientRect();
      /* Cuadros visibles solo cuando «Nuestros valores» entra en pantalla (no antes, en misión/visión) */
      return intro.top > vh * 0.82;
    }

    function setValuesTilesVisible(visible) {
      valuesSection.classList.toggle("is-values-dormant", !visible);
      valuesTiles.forEach(function (tile) {
        tile.style.opacity = visible ? "" : "0";
        tile.style.visibility = visible ? "" : "hidden";
      });
    }

    function clampValues(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function measureValuesTileHomes() {
      valuesMatrix.style.setProperty("--values-assemble", "1");
      valuesTiles.forEach(function (tile) {
        tile.style.transform = "";
      });
      void valuesMatrix.offsetHeight;

      var matrixRect = valuesMatrix.getBoundingClientRect();
      var cx = matrixRect.left + matrixRect.width / 2;
      var cy = matrixRect.top + matrixRect.height / 2;

      valuesTileHomes = [];
      valuesTiles.forEach(function (tile) {
        var rect = tile.getBoundingClientRect();
        var homeX = rect.left + rect.width / 2;
        var homeY = rect.top + rect.height / 2;
        var rayX = homeX - cx;
        var rayY = homeY - cy;
        var len = Math.hypot(rayX, rayY) || 1;
        valuesTileHomes.push({
          tile: tile,
          homeX: homeX,
          homeY: homeY,
          rayX: rayX / len,
          rayY: rayY / len,
        });
      });
    }

    function applyValuesViewportTravel(progress) {
      if (!valuesTileHomes) return;
      var vw = window.innerWidth || 1;
      var vh = window.innerHeight || 1;
      var travel = 1 - easeOutCubic(progress);
      var spread = Math.max(vw, vh) * 0.48;

      valuesTileHomes.forEach(function (home) {
        var startX = home.homeX + home.rayX * spread;
        var startY = home.homeY + home.rayY * spread;
        var dx = (startX - home.homeX) * travel;
        var dy = (startY - home.homeY) * travel;
        home.tile.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0)";
      });
    }

    function updateValuesAssemble() {
      valuesTicking = false;
      if (!valuesTileHomes) measureValuesTileHomes();

      var vh = window.innerHeight || 1;

      var matrixRect = valuesMatrix.getBoundingClientRect();
      var matrixCenterY = matrixRect.top + matrixRect.height / 2;
      var viewportCenterY = vh * 0.5;
      /* Unión cuando el centro de la cuadrícula llega al centro vertical del viewport */
      var assemblyRange = vh * 0.42;
      var delta = matrixCenterY - viewportCenterY;
      var progress = valuesReducedMotion
        ? 1
        : clampValues(1 - delta / assemblyRange, 0, 1);
      var assemble = progress.toFixed(3);

      valuesSection.style.setProperty("--values-assemble", assemble);
      valuesMatrix.style.setProperty("--values-assemble", assemble);

      var hideTiles = shouldHideValuesTiles(vh) && !valuesReducedMotion;
      setValuesTilesVisible(!hideTiles);

      if (valuesReducedMotion) {
        valuesTiles.forEach(function (tile) {
          tile.style.transform = "";
        });
      } else if (!hideTiles) {
        applyValuesViewportTravel(progress);
      }

      valuesMatrix.classList.toggle("is-assembled", !hideTiles && progress >= 0.94);
      valuesSection.classList.toggle("is-values-assembled", !hideTiles && progress >= 0.94);
    }

    function requestValuesAssemble() {
      if (valuesTicking) return;
      valuesTicking = true;
      window.requestAnimationFrame(updateValuesAssemble);
    }

    function remeasureValuesOnResize() {
      measureValuesTileHomes();
      requestValuesAssemble();
    }

    valuesMatrix.classList.add("values-matrix--viewport-travel");
    measureValuesTileHomes();
    updateValuesAssemble();
    window.addEventListener("scroll", requestValuesAssemble, { passive: true });
    window.addEventListener("resize", remeasureValuesOnResize);

    if (!valuesCanHover) {
      valuesTiles.forEach(function (tile) {
        tile.addEventListener("click", function () {
          if (!valuesMatrix.classList.contains("is-assembled")) return;
          var open = tile.classList.contains("is-open");
          valuesTiles.forEach(function (t) {
            t.classList.remove("is-open");
          });
          if (!open) tile.classList.add("is-open");
        });
      });

      document.addEventListener("click", function (e) {
        if (e.target.closest(".values-tile")) return;
        valuesTiles.forEach(function (t) {
          t.classList.remove("is-open");
        });
      });
    }
  }

  var sqModaHero = document.querySelector("[data-sq-moda-hero]");
  if (sqModaHero) {
    var sqModaImage = sqModaHero.querySelector("[data-sq-moda-hero-img]");
    var sqModaCopy = sqModaHero.querySelector("[data-sq-moda-hero-copy]");
    var sqModaTabs = sqModaHero.querySelectorAll("[data-sq-moda-tab]");

    function setSqModaTab(activeTab) {
      var nextImage = activeTab.getAttribute("data-image");
      var nextCopy = activeTab.getAttribute("data-copy");

      sqModaTabs.forEach(function (tab) {
        var active = tab === activeTab;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (sqModaCopy && nextCopy) {
        sqModaCopy.textContent = nextCopy;
      }

      if (sqModaImage && nextImage && sqModaImage.src !== nextImage) {
        sqModaImage.classList.add("is-changing");
        sqModaImage.addEventListener(
          "load",
          function () {
            sqModaImage.classList.remove("is-changing");
          },
          { once: true }
        );
        sqModaImage.src = nextImage;
      }
    }

    sqModaTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setSqModaTab(tab);
      });
    });
  }

  var strategicMap = document.querySelector("[data-strategic-map]");
  if (strategicMap) {
    var layerButtons = strategicMap.querySelectorAll("[data-layer]");
    layerButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var layer = btn.getAttribute("data-layer");
        if (!layer) return;
        strategicMap.setAttribute("data-active", layer);
        layerButtons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    });
  }

  if (form && feedback) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      feedback.hidden = false;
      feedback.classList.remove("is-error", "is-success");

      if (!form.checkValidity()) {
        feedback.textContent = "Por favor, completa los campos obligatorios.";
        feedback.classList.add("is-error");
        return;
      }

      // Demo: sustituir por fetch() a tu endpoint o action en el <form>
      feedback.textContent =
        "Gracias. Hemos recibido tu mensaje. Un equipo comercial se pondrá en contacto contigo.";
      feedback.classList.add("is-success");
      form.reset();
    });
  }
})();
