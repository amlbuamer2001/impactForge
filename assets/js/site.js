/* =========================================================
   Impact Forge — shared site script
   المحتوى كله مكتوب في الـ HTML؛ الملف ده للتفاعل والحركة بس
   ========================================================= */
(function () {
  /* رابط منصة التعلّم: سيبيه فاضي لحد الإطلاق (أزرار [data-platform] هتظهر "قريبًا")، وبعدها حطي الرابط هنا بس */
  var PLATFORM_URL = "";

  var root = document.documentElement,
    body = document.body,
    header = document.querySelector(".header"),
    advisorsFilter = document.getElementById("advisors-filter"),
    advisorsGrid = document.getElementById("advisors-grid");
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  var langHooks = [];

  /* =====================================================
     I18N: كل النصوص في الـ HTML على شكل attributes
       <h1 ar="أهلا بك" en="Welcome"></h1>
     وأي attribute تاني بنفس الفكرة: ar-placeholder / en-placeholder،
     ar-alt / en-alt، ar-title / en-title، ar-aria-label / en-aria-label، ar-content / en-content
     (لو القيمة فيها وسوم زي <b> بتتحط كـ HTML)
     التبديل كله من هنا: setLang("ar" | "en")
     ===================================================== */
  var I18N_ATTRS = ["placeholder", "alt", "title", "aria-label", "content", "value"];
  var I18N_SEL = ["[ar]"].concat(I18N_ATTRS.map(function (a) { return "[ar-" + a + "]"; })).join(",");
  function applyLang(l) {
    $$(I18N_SEL).forEach(function (el) {
      var t = el.getAttribute(l);
      if (t !== null) { if (t.indexOf("<") > -1) el.innerHTML = t; else el.textContent = t; }
      I18N_ATTRS.forEach(function (a) { var v = el.getAttribute(l + "-" + a); if (v !== null) el.setAttribute(a, v); });
    });
  }
  applyLang(root.lang == "en" ? "en" : "ar");

  /* البرنامج المختار من الرابط (contact.html?program=nursing) */
  var wanted = new URLSearchParams(location.search).get("program") || new URLSearchParams(location.search).get("area");
  if (wanted) $$("select[data-programs]").forEach(function (s) { s.value = wanted; });

  /* =====================================================
     PLATFORM + "قريبًا" BUTTONS
     ===================================================== */
  $$("[data-platform]").forEach(function (a) {
    if (PLATFORM_URL) {
      a.href = PLATFORM_URL; a.target = "_blank"; a.rel = "noopener";
    } else {
      a.classList.add("is-soon"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link");
      a.title = "قريبًا / Coming soon";
    }
  });
  $$("[data-soon]").forEach(function (a) {
    var href = a.dataset.soon;
    if (href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
    else { a.classList.add("is-soon"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link"); a.title = "قريبًا / Coming soon"; }
  });

  /* =====================================================
     TABS (فلتر المستشارين) مع ARIA وتنقل بالأسهم
     ===================================================== */
  var tabIndicatorFx = null; /* مؤشر التاب: بيتعرّف في طبقة GSAP */
  $$(".tabs").forEach(function (tabs) {
    var els = tabs.getElementsByClassName("tab");
    tabs.setAttribute("role", "tablist");
    [].forEach.call(els, function (b, j) { b.setAttribute("role", "tab"); b.setAttribute("aria-selected", j == 0); b.tabIndex = j == 0 ? 0 : -1; });
    function select(k, focus) {
      [].forEach.call(els, function (x, j) {
        x.classList.toggle("is-active", j == k); x.setAttribute("aria-selected", j == k); x.tabIndex = j == k ? 0 : -1;
      });
      if (focus) els[k].focus();
      tabs.dispatchEvent(new CustomEvent("tabchange", { detail: els[k].dataset.v }));
      if (tabIndicatorFx) tabIndicatorFx(tabs);
    }
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".tab");
      if (b) select([].indexOf.call(els, b));
    });
    tabs.addEventListener("keydown", function (e) {
      var b = e.target.closest(".tab");
      if (!b) return;
      var n = els.length, k = [].indexOf.call(els, b), rtl = root.dir == "rtl", d = 0;
      if (e.key == "ArrowRight") d = rtl ? -1 : 1;
      if (e.key == "ArrowLeft") d = rtl ? 1 : -1;
      if (e.key == "Home") { e.preventDefault(); return select(0, true); }
      if (e.key == "End") { e.preventDefault(); return select(n - 1, true); }
      if (d) { e.preventDefault(); select((k + d + n) % n, true); }
    });
  });
  if (advisorsFilter)
    advisorsFilter.addEventListener("tabchange", function (e) {
      var shown = [];
      $$(".advisor-card", advisorsGrid).forEach(function (c) {
        var on = e.detail == "all" || c.dataset.p == e.detail;
        c.hidden = !on;
        if (on) shown.push(c);
      });
      if (root.classList.contains("gsap-enabled")) gsap.fromTo(shown, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" });
    });

  /* =====================================================
     LANGUAGE + MOBILE MENU
     ===================================================== */
  var menu = $(".nav-links"),
    burger = $(".menu-toggle");
  function setLang(l) {
    root.lang = l;
    root.dir = l == "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("lang", l); } catch (e) {}
    applyLang(l);
    langHooks.forEach(function (f) { f(); });
    if (root.classList.contains("gsap-enabled")) ScrollTrigger.refresh();
  }
  if ($(".lang-toggle")) $(".lang-toggle").onclick = function () { setLang(root.lang == "ar" ? "en" : "ar"); };

  function toggleMenu(open) {
    var o = typeof open == "boolean" ? open : !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", o);
    burger.setAttribute("aria-expanded", o);
  }
  if (burger) {
    burger.onclick = function () { toggleMenu(); };
    menu.onclick = function (e) { if (e.target.closest("a")) toggleMenu(false); };
    addEventListener("keydown", function (e) { if (e.key == "Escape") toggleMenu(false); });
  }

  /* =====================================================
     MARQUEE: الشريط فيه 4 عناصر في الـ HTML، بنكرّرهم 6 مرات (24)
     ===================================================== */
  $$(".marquee-track").forEach(function (track) {
    var base = [].slice.call(track.children);
    for (var k = 0; k < 5; k++) base.forEach(function (s) { track.appendChild(s.cloneNode(true)); });
  });

  /* =====================================================
     REVEAL (بدون GSAP) + PROGRESS + BACK TO TOP
     ===================================================== */
  if (!root.classList.contains("gsap-enabled")) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add("is-visible"); revealObserver.unobserve(x.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (x) { revealObserver.observe(x); });
  }

  var progress = $(".scroll-progress"),
    toTop = $(".back-to-top");
  function onScrollProgress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
    if (toTop) toTop.classList.toggle("is-visible", scrollY > 600);
    /* الهيدر بيلزق في أعلى الشاشة (inset 0) أول ما السكرول يبدأ */
    if (header) header.classList.toggle("is-scrolled", scrollY > 0);
  }
  onScrollProgress();
  addEventListener("scroll", onScrollProgress, { passive: true });
  if (toTop) toTop.onclick = function () { scrollTo({ top: 0, behavior: "smooth" }); };

  /* =====================================================
     FORMS (mailto لحد ما يبقى فيه باك إند)
     ===================================================== */
  $$("form.contact-form").forEach(function (f) {
    f.onsubmit = function (e) {
      e.preventDefault();
      var lines = $$("input, select, textarea", f).map(function (el) {
        var v = el.tagName == "SELECT" && el.selectedIndex > 0 ? el.options[el.selectedIndex].text : el.value;
        var lb = el.closest("label"), name = el.getAttribute("aria-label") || (lb && lb.firstElementChild && lb.firstElementChild.textContent) || el.name;
        if (el.type == "checkbox") v = el.checked ? "✓" : "✗";
        return name + ": " + v;
      });
      /* المستلم ونص رسالة التأكيد مكتوبين في الـ HTML: data-to على الفورم و .form-success */
      location.href = "mailto:" + (f.dataset.to || "") + "?subject=" + encodeURIComponent(f.dataset.subject || "Website inquiry") + "&body=" + encodeURIComponent(lines.join("\n"));
      f.classList.add("is-sent");
    };
  });

  /* =====================================================
     ABOUT CUBES (الرئيسية): المكعبين بيلفّوا وجه مع كل خطوة سكرول
     كل خطوة فيها "وقفة" قصيرة عشان الوجه يتقري قبل ما يلف
     ===================================================== */
  (function () {
    var track = $(".about-track");
    if (!track) return;
    var textCube = $(".cube-text", track),
      imageCube = $(".cube-image", track),
      steps = $$(".cube-face", textCube).length,
      buttons = $$(".cube-nav button", track),
      dims = [$$(".cube-dim", textCube), $$(".cube-dim", imageCube)],
      current = -1,
      queued = false;
    var smooth = function (x) { return x * x * (3 - 2 * x); };

    function render() {
      queued = false;
      var total = Math.max(1, track.offsetHeight - innerHeight),
        progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / total)),
        t = progress * (steps - 1),
        k = Math.min(steps - 2, Math.floor(t)),
        f = Math.min(1, Math.max(0, (t - k - 0.2) / 0.6)), /* 20% وقفة في أول وآخر كل خطوة */
        angle = (k + smooth(f)) * 90;
      track.style.setProperty("--about-p", progress.toFixed(3)); /* الكلمة الكبيرة في الخلفية بتزحف معاه */
      textCube.style.transform = "translateZ(calc(var(--s) / -2)) rotateX(" + angle + "deg)";
      imageCube.style.transform = "translateZ(calc(var(--s) / -2)) rotateX(" + -angle + "deg)";
      dims.forEach(function (list) {
        list.forEach(function (d, i) { d.style.opacity = Math.min(0.6, (Math.abs(angle - i * 90) / 90) * 0.6); });
      });
      var step = Math.round(angle / 90);
      if (step != current) {
        current = step;
        buttons.forEach(function (b, i) { if (i == step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
        if (!hovering) focusButton(buttons[step], false); /* التوهّج بيمشي مع الوجه الحالي */
      }
    }

    /* ---------- الناف اللزجة: شكل واحد للأزرار + جسور منحنية بينهم ---------- */
    var goo = $(".goo", track),
      gooWrap = $(".cube-nav-wrap", track),
      gooPaths = goo ? $$("path", goo) : [],
      glow = $("#cube-nav-glow"),
      R = 12, BRIDGE = 21.3, OVERLAP = 1.91,
      glowNow = { x: 0, y: 0 }, glowTo = { x: 0, y: 0 }, glowRaf = null, hovering = false;
    function roundRect(x, y, w, h, r) {
      return "M" + x + " " + (y + r) + " A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y +
        " L" + (x + w - r) + " " + y + " A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
        " L" + (x + w) + " " + (y + h - r) + " A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
        " L" + (x + r) + " " + (y + h) + " A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + " Z ";
    }
    function buildGoo() {
      if (!goo) return;
      /* ترتيب الأزرار على الشاشة (في RTL الأول على اليمين) عشان الجسور توصل الجيران */
      var bs = buttons.slice().sort(function (a, b) { return a.offsetLeft - b.offsetLeft; }),
        H = bs[0].offsetHeight, dx = R - OVERLAP, inset = R - Math.sqrt(R * R - dx * dx), d = "";
      bs.forEach(function (b) { d += roundRect(b.offsetLeft, 0, b.offsetWidth, H, R); });
      for (var i = 0; i < bs.length - 1; i++) {
        var x1 = bs[i].offsetLeft + bs[i].offsetWidth - OVERLAP, x2 = bs[i + 1].offsetLeft + OVERLAP;
        d += "M" + x1 + " " + inset + " A" + BRIDGE + " " + BRIDGE + " 0 0 0 " + x2 + " " + inset +
          " L" + x2 + " " + (H - inset) + " A" + BRIDGE + " " + BRIDGE + " 0 0 0 " + x1 + " " + (H - inset) + " Z ";
      }
      gooPaths.forEach(function (p) { p.setAttribute("d", d); });
      fitGoo();
      focusButton(buttons[Math.max(0, current)], true);
    }
    function fitGoo() {
      goo.style.transform = "";
      var s = Math.min(1, gooWrap.clientWidth / goo.offsetWidth);
      goo.style.transform = s < 1 ? "scale(" + s + ")" : "";
    }
    function setGlow(x, y) { glow.setAttribute("cx", x); glow.setAttribute("cy", y); }
    function glowTick() {
      glowNow.x += (glowTo.x - glowNow.x) * 0.18;
      glowNow.y += (glowTo.y - glowNow.y) * 0.18;
      setGlow(glowNow.x, glowNow.y);
      glowRaf = Math.abs(glowTo.x - glowNow.x) > 0.1 || Math.abs(glowTo.y - glowNow.y) > 0.1 ? requestAnimationFrame(glowTick) : null;
    }
    function moveGlow(x, y, snap) {
      glowTo.x = x; glowTo.y = y;
      if (snap) { glowNow.x = x; glowNow.y = y; setGlow(x, y); return; }
      if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
    }
    function focusButton(b, snap) {
      if (!goo || !b) return;
      buttons.forEach(function (x) { x.classList.toggle("is-hot", x === b); });
      moveGlow(b.offsetLeft + b.offsetWidth / 2, b.offsetHeight / 2, snap);
    }
    if (goo) {
      goo.addEventListener("pointermove", function (e) {
        hovering = true;
        var r = goo.getBoundingClientRect(), s = r.width / goo.offsetWidth;
        moveGlow((e.clientX - r.left) / s, (e.clientY - r.top) / s, false);
      });
      goo.addEventListener("pointerleave", function () { hovering = false; focusButton(buttons[current], false); });
      buttons.forEach(function (b) {
        b.addEventListener("pointerenter", function () { buttons.forEach(function (x) { x.classList.toggle("is-hot", x === b); }); });
        b.addEventListener("focus", function () { focusButton(b, false); });
      });
      langHooks.push(buildGoo); /* عرض الأزرار بيتغير مع اللغة */
      addEventListener("resize", buildGoo);
      if (document.fonts) document.fonts.ready.then(buildGoo);
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(render); } }

    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        var total = track.offsetHeight - innerHeight;
        scrollTo({ top: track.getBoundingClientRect().top + scrollY + (total * i) / (steps - 1), behavior: "smooth" });
      });
    });
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    render();
    buildGoo();
  })();

  /* =====================================================
     HIGHLIGHTS STRIP (الرئيسية): سكرول بسيط "بيزق" اللوحة فتتمرجح وتستقر
     ===================================================== */
  (function () {
    var strip = $(".highlights"),
      hold = $(".highlights-hold");
    if (!strip) return;
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      removeEventListener("scroll", check);
      hold.classList.add("is-active");
      strip.classList.add("is-swinging");
    }
    function check() { if (scrollY > 30) fire(); }
    strip.addEventListener("animationend", function (e) {
      if (e.animationName === "highlights-swing") strip.classList.add("is-settled");
    });
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      strip.classList.add("is-settled");
      hold.classList.add("is-active");
      return;
    }
    addEventListener("scroll", check, { passive: true });
    check();
  })();

  /* =====================================================
     GSAP MOTION LAYER (html.gsap-enabled بس)
     ===================================================== */
  if (!root.classList.contains("gsap-enabled")) return;
  gsap.registerPlugin(ScrollTrigger);

  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* تقسيم لكلمات (العربي ما ينفعش يتقسم حروف). mask=true: كل كلمة جوه قناع للـ reveal */
  function wrapNode(n, parent) {
    var o = document.createElement("span"), i = document.createElement("span");
    o.className = "word-mask"; i.className = "word-inner";
    parent.insertBefore(o, n); o.appendChild(i); i.appendChild(n);
    return i;
  }
  function split(el, mask) {
    var out = [];
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType == 3) {
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          var tn = document.createTextNode(p);
          el.insertBefore(tn, n);
          if (/^\s+$/.test(p)) return;
          if (mask) return out.push(wrapNode(tn, el));
          var s = document.createElement("span");
          s.className = "split-word"; el.insertBefore(s, tn); s.appendChild(tn); out.push(s);
        });
        el.removeChild(n);
      } else if (n.nodeType == 1) {
        if (!mask) out = out.concat(split(n, mask));
        else out.push(wrapNode(n, el)); /* زي <b>: يتحرك كوحدة عشان التدرج ما يبوظش */
      }
    });
    return out;
  }

  gsap.from(".header-wrapper", { yPercent: -120, duration: 1, ease: "expo.out" });

  /* ---------- HERO الرئيسية ---------- */
  if ($(".hero")) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .set(".fade-up", { visibility: "inherit" })
      .from(".hero .hero-pixels rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.09, from: "random" } }, 0.15)
      .from(".hero-arch", { scaleY: 0, transformOrigin: "50% 100%", duration: 1.4, ease: "expo.out" }, 0.2)
      .from(".hero-image", { yPercent: 14, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.45)
      .from(".hero .eyebrow", { rotationX: -95, scale: 0.7, autoAlpha: 0, transformPerspective: 600, transformOrigin: "50% 100%", duration: 1.1, ease: "back.out(1.8)", clearProps: "transform" }, 0.35)
      .from(split($(".hero-title"), true), { yPercent: 120, rotate: 6, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.45)
      .from($(".hero-subtitle") ? split($(".hero-subtitle"), true) : [], { yPercent: 120, duration: 0.9, ease: "expo.out", stagger: 0.05 }, 0.65)
      .from(".vision-badge", { y: 40, rotate: -5, autoAlpha: 0, duration: 1, ease: "back.out(1.6)" }, 0.8)
      .from(".hero-lead", { y: 30, autoAlpha: 0, duration: 0.9 }, 0.75)
      .from(".hero .actions > *", { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.9);

    var heroTrigger = function () { return { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }; };
    gsap.to(".hero-visual", { yPercent: 10, ease: "none", scrollTrigger: heroTrigger() });
    gsap.to(".hero-intro, .hero-content", { y: -70, ease: "none", scrollTrigger: heroTrigger() });
    gsap.to(".hero .hero-pixels", { rotate: -8, yPercent: -30, ease: "none", scrollTrigger: heroTrigger() });

    if (fine) {
      var hero = $(".hero"),
        layers = [[".hero-image", -14], [".hero-glow", 40],[".hero .hero-pixels", 22], [".vision-badge", -12]].map(function (l) {
          var el = $(l[0]);
          return { d: l[1], x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }) };
        });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l) { l.x(px * l.d); l.y(py * l.d * 0.7); });
      });
      hero.addEventListener("pointerleave", function () { layers.forEach(function (l) { l.x(0); l.y(0); }); });
    }
  }

  /* ---------- هيرو الصفحات الداخلية ---------- */
  if ($(".page-hero")) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .set(".page-hero-content", { visibility: "inherit" })
      .from(".page-hero .page-hero-pixels rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.09, from: "random" } }, 0.1)
      .from(".page-hero-ring", { scale: 0.6, autoAlpha: 0, duration: 1.6, ease: "expo.out", stagger: 0.15 }, 0.1)
      .from(".page-hero-number", { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.3)
      .from(".page-hero .breadcrumbs, .page-hero .eyebrow, .page-hero-content > .english-name", { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.2)
      .from(split($(".page-hero h1"), true), { yPercent: 120, rotate: 5, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0.3)
      .from(".page-hero-sub, .page-hero .actions > *", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.6);
    gsap.to(".page-hero-ring-a", { rotation: 360, duration: 70, ease: "none", repeat: -1 });
    gsap.to(".page-hero .page-hero-pixels", { rotate: -8, yPercent: -30, ease: "none", scrollTrigger: { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".page-hero-number", { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- HEADER: يختفي مع النزول ويرجع مع الطلوع ---------- */
  var headerShown = true;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (s) {
      var show = s.direction < 0 || s.scroll() < 200 || (menu && menu.classList.contains("is-open"));
      if (show == headerShown) return;
      headerShown = show;
      gsap.to(header, { yPercent: show ? 0 : -140, duration: 0.5, ease: "power3.out" });
    },
  });

  /* ---------- عناوين السكاشن: الكلمات تطلع من قناع ---------- */
  $$("main section:not(.hero):not(.page-hero) h2").forEach(function (h) {
    gsap.from(split(h, true), {
      yPercent: 120, rotate: 5, duration: 1.1, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: h, start: "top 88%", once: true },
    });
  });

  /* ---------- ظهور عام لمحتوى .reveal ---------- */
  $$(".reveal").forEach(function (item) {
    item.classList.add("is-visible");
    if (item.matches(".about-cards, .bento")) return;
    var kids = [].filter.call(item.children, function (k) { return k.tagName != "H2"; });
    gsap.from(kids, {
      y: 46, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: item, start: "top 86%", once: true },
    });
  });

  /* ---------- الـ kicker: الشارة بتتقلب لفوق من تحت (3D) وهي داخلة ---------- */
  $$(".kicker").forEach(function (k) {
    gsap.from(k, {
      rotationX: -95, scale: 0.7, transformPerspective: 600, transformOrigin: "50% 100%",
      duration: 1.1, ease: "back.out(1.8)", clearProps: "transform",
      scrollTrigger: { trigger: k, start: "top 90%", once: true },
    });
  });

  /* ---------- القيم: كارت مطوي (زي الأكورديون) بيتفرد مع السكرول — ديسكتوب بس ---------- */
  if ($(".fold-card"))
    gsap.matchMedia().add("(min-width: 721px)", function () {
      var folds = $$(".fold-card .fold"), skew = 15;
      gsap.set(".fold-card", { scaleX: 0.6 });
      gsap.set(folds, {
        skewY: function (i) { return i % 2 ? -skew : skew; },
        filter: function (i) { return i % 2 ? "brightness(0.75)" : "brightness(1.25)"; },
      });
      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".values-stage", start: "top top", end: "+=150%", pin: true, scrub: 1 },
      })
        .to(".fold-card", { scaleX: 1 }, 0)
        .to(folds, { skewY: 0, filter: "brightness(1)" }, 0)
        .to(".fold-hint", { autoAlpha: 0 }, 0);
    });

  /* ---------- الشكل المترابط (About) ---------- */
  if ($(".about-cards"))
    gsap.timeline({ scrollTrigger: { trigger: ".about-cards", start: "top 75%", once: true } })
      .from(".about-shape path", { scale: 0.6, rotate: -8, autoAlpha: 0, transformOrigin: "50% 50%", duration: 1.3, ease: "expo.out" })
      .from(".about-card", { y: 70, scale: 0.88, autoAlpha: 0, duration: 1, ease: "back.out(1.4)", stagger: 0.14 }, 0.25)
      .from(".about-card-image", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut", stagger: 0.14 }, 0.3);

  /* ---------- النص بيتقري مع السكرول ---------- */
  /* النص اللي بيتقري مع السكرول: بيتعاد تقسيمه لما اللغة تتبدّل */
  var scrubTweens = [];
  function initScrub() {
    scrubTweens.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    scrubTweens = [];
    $$(".scrub-text").forEach(function (q) {
      var ps = $$("p", q);
      (ps.length ? ps : [q]).forEach(function (p) {
        scrubTweens.push(gsap.fromTo(split(p, false), { opacity: 0.16 }, {
          opacity: 1, ease: "none", stagger: 0.1,
          scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 50%", scrub: true },
        }));
      });
    });
  }
  initScrub();
  langHooks.push(initScrub);
  if ($(".message-photo img")) {
    gsap.from(".message-photo img", { clipPath: "inset(100% 0% 0% 0% round 24px)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".message-photo", start: "top 80%", once: true } });
    gsap.to(".message-photo img", { yPercent: -6, ease: "none", scrollTrigger: { trigger: ".message-photo", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------- كروت البرامج المتراصة: اللي فات بيصغر لما اللي بعده يغطيه ---------- */
  var slides = $$(".program-slide");
  slides.forEach(function (slide, i) {
    var card = slide.firstElementChild;
    gsap.from($(".program-icon", card), { scale: 0.3, rotate: -120, duration: 1.2, ease: "back.out(1.8)", scrollTrigger: { trigger: slide, start: "top 85%", once: true } });
    gsap.from($(".program-number", card), { yPercent: 60, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: slide, start: "top 85%", once: true } });
    var next = slides[i + 1];
    if (next && next.parentNode == slide.parentNode)
      gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.9, filter: "brightness(0.55)", ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top 25%", scrub: true },
      });
  });

  /* ---------- MARQUEE: سرعته واتجاهه حسب السكرول ---------- */
  if ($(".marquee")) {
    var loops = $$(".marquee-track").map(function (track, i) {
      var tw = gsap.fromTo(track, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: 40, ease: "none", repeat: -1 });
      tw.totalTime(tw.duration() * 50); /* نبدأ من نقطة بعيدة عشان الرجوع لورا يشتغل */
      return tw;
    });
    var speed = { v: 1 };
    var applySpeed = function () { loops.forEach(function (tw) { tw.timeScale(speed.v); }); };
    ScrollTrigger.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: function (s) {
        var v = s.getVelocity() / 250;
        speed.v = Math.abs(v) < 1 ? s.direction : gsap.utils.clamp(-8, 8, v);
        applySpeed();
        gsap.to(speed, { v: s.direction, duration: 1.2, ease: "power2.out", overwrite: true, onUpdate: applySpeed });
      },
    });
    gsap.from(".marquee-row", { xPercent: function (i) { return i ? 30 : -30; }, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".marquee", start: "top 85%", once: true } });
  }

  /* ---------- BENTO ---------- */
  if ($(".bento")) {
    gsap.from(".bento-tile", {
      clipPath: "inset(100% 0% 0% 0% round 22px)", duration: 1.1, ease: "expo.inOut", stagger: { each: 0.1, from: "random" }, clearProps: "clipPath",
      scrollTrigger: { trigger: ".bento", start: "top 80%", once: true },
    });
    gsap.from(".bento-icon", { scale: 0, rotate: -90, duration: 1, ease: "back.out(2)", stagger: 0.08, delay: 0.5, scrollTrigger: { trigger: ".bento", start: "top 80%", once: true } });
    if (fine)
      $$(".bento-tile").forEach(function (tile) {
        gsap.set(tile, { transformPerspective: 800 });
        var rx = gsap.quickTo(tile, "rotationX", { duration: 0.5, ease: "power3" }),
          ry = gsap.quickTo(tile, "rotationY", { duration: 0.5, ease: "power3" });
        tile.addEventListener("pointermove", function (e) {
          var r = tile.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 14);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 14);
        });
        tile.addEventListener("pointerleave", function () { rx(0); ry(0); });
      });
  }

  /* ---------- مدار البرامج ---------- */
  if ($(".orbit")) {
    gsap.to(".orbit-ring", { rotation: 360, duration: 40, ease: "none", repeat: -1 });
    gsap.to(".orbit-item", { rotation: -360, duration: 40, ease: "none", repeat: -1 });
    gsap.from(".orbit-item", { scale: 0, duration: 0.9, ease: "back.out(2)", stagger: 0.1, scrollTrigger: { trigger: ".orbit", start: "top 80%", once: true } });
  }

  /* ---------- خط المحاور + مسار المنهجية ---------- */
  $$(".timeline").forEach(function (timeline) {
    gsap.fromTo($(".timeline-fill", timeline), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: timeline, start: "top 70%", end: "bottom 70%", scrub: true } });
    $$("li", timeline).forEach(function (li) {
      ScrollTrigger.create({ trigger: li, start: "top 70%", onEnter: function () { li.classList.add("is-active"); }, onLeaveBack: function () { li.classList.remove("is-active"); } });
      gsap.from($("span", li), { x: root.dir == "rtl" ? -40 : 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 88%", once: true } });
    });
  });
  $$(".method-path").forEach(function (path) {
    gsap.fromTo($(".method-path-fill", path), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: path, start: "top 80%", end: "bottom 55%", scrub: true } });
  });

  /* ---------- مؤشر التاب اللي بيتزحلق ---------- */
  var tabsLists = $$(".tabs");
  tabsLists.forEach(function (tabs) {
    var indicator = document.createElement("span");
    indicator.className = "tab-indicator";
    tabs.appendChild(indicator);
  });
  tabIndicatorFx = function (tabs, instant) {
    var active = $(".tab.is-active", tabs), indicator = $(".tab-indicator", tabs);
    if (active && indicator) gsap.to(indicator, { x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight, duration: instant ? 0 : 0.6, ease: "power3.inOut" });
  };
  function placeTabs() { tabsLists.forEach(function (tabs) { tabIndicatorFx(tabs, true); }); }
  placeTabs();
  langHooks.push(placeTabs);
  addEventListener("resize", placeTabs);
  if (document.fonts) document.fonts.ready.then(function () { placeTabs(); ScrollTrigger.refresh(); });

  /* ---------- FOOTER: أعمدة الهوية + المربعات ---------- */
  gsap.from(".footer-bars i", {
    scaleY: 0, ease: "none", stagger: 0.12,
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "top 55%", scrub: 1 },
  });
  if ($(".cta-pixels"))
    gsap.from(".cta-pixels rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.1, from: "random" }, scrollTrigger: { trigger: ".cta-pixels", start: "top 80%", once: true } });

  /* ---------- إضاءة تتبع الماوس على الكروت ---------- */
  if (fine) {
    $$(".bento-tile, .vm-card, .program-card, .card, .advisor-card, .program-summary, .next-program").forEach(function (el) {
      el.classList.add("spotlight");
      el.insertAdjacentHTML("afterbegin", '<i class="spotlight-glow" aria-hidden="true"></i>');
    });
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".spotlight");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--x", e.clientX - r.left + "px");
      el.style.setProperty("--y", e.clientY - r.top + "px");
    });
  }

  /* ---------- أزرار مغناطيسية ---------- */
  if (fine)
    $$(".btn:not(.is-soon), .lang-toggle").forEach(function (b) {
      var mx = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" }),
        my = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.45);
      });
      b.addEventListener("pointerleave", function () { mx(0); my(0); });
    });

  /* ---------- مؤشر الماوس ---------- */
  if (fine) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    body.appendChild(cursor);
    var cx = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" }),
      cy = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", function (e) {
      cursor.classList.add("is-active");
      cx(e.clientX); cy(e.clientY);
      cursor.classList.toggle("is-hover", !!(e.target.closest && e.target.closest("a:not(.is-soon), button, .bento-tile, input, textarea, select")));
    });
    root.addEventListener("pointerleave", function () { cursor.classList.remove("is-active"); });
  }
})();