/* =========================================================
   Impact Forge — shared site script
   المحتوى كله مكتوب في الـ HTML؛ الملف ده للتفاعل والحركة بس
   ========================================================= */
/* =========================================================
   البريلودر ("الصَّهر") — أول حاجة في الملف عشان يوقف حركات GSAP قبل ما تبدأ
   - بيظهر في أول صفحة من الزيارة بس (sessionStorage)، الصفحات اللي بعدها بتفتح على طول
   - العدّاد بيمشي مع تحميل الصور الفعلي، وبيكمّل لـ 100 مع window.load
   - حد أدنى ~1 ثانية (عشان ما يبقاش وميض) وحد أقصى 6 ثواني (لو حاجة اتأخرت)
   - حركة الدخول بتاعة الصفحة (GSAP) متوقفة لحد ما الستارة تفتح
   ========================================================= */
(function () {
  var root = document.documentElement,
    el = document.getElementById("preloader");
  if (!el) { root.classList.remove("is-loading"); return; } /* صفحة من غير بريلودر: ما نقفلش السكرول */
  if (root.classList.contains("no-preload")) { el.remove(); return; }

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches,
    count = el.querySelector(".pl-count"),
    bar = el.querySelector(".pl-bar b"),
    start = performance.now(),
    MIN = reduce ? 400 : 1100, MAX = 6000,
    shown = 0, loaded = false, finished = false;

  root.classList.add("is-loading"); /* (بيتضاف كمان من الـ head عشان السكرول يتقفل من أول لحظة) */
  /* حركات الصفحة تستنى لحد ما الستارة تفتح */
  if (window.gsap) gsap.globalTimeline.pause();

  /* النسبة الحقيقية: الصور اللي خلصت تحميل */
  function target() {
    if (loaded) return 100;
    var imgs = document.images, n = imgs.length, done = 0;
    for (var i = 0; i < n; i++) if (imgs[i].complete) done++;
    var t = n ? (done / n) * 90 : 60;
    /* شوية تقدّم مع الوقت عشان ما يقفش لو صورة بطيئة */
    return Math.min(95, Math.max(t, ((performance.now() - start) / MAX) * 95));
  }
  function tick() {
    if (finished) return;
    var t = target();
    shown += (t - shown) * 0.12;
    if (t == 100 && 100 - shown < 0.6) shown = 100;
    var v = Math.round(shown);
    count.textContent = v;
    bar.style.transform = "scaleX(" + (shown / 100).toFixed(3) + ")";
    if (shown >= 100 && performance.now() - start >= MIN) return finish();
    requestAnimationFrame(tick);
  }
  function finish() {
    if (finished) return;
    finished = true;
    count.textContent = 100;
    bar.style.transform = "scaleX(1)";
    el.classList.add("is-done");
    try { sessionStorage.setItem("if-preloaded", "1"); } catch (e) {}
    /* بعد ما الستارة تخلص: نشيل البريلودر ونشغّل حركات الصفحة */
    setTimeout(function () {
      root.classList.remove("is-loading");
      if (window.gsap) { gsap.globalTimeline.resume(); if (window.ScrollTrigger) ScrollTrigger.refresh(); }
      el.remove();
    }, reduce ? 350 : 1250);
  }

  addEventListener("load", function () { loaded = true; });
  setTimeout(function () { loaded = true; }, MAX); /* أقصى مدة */
  requestAnimationFrame(tick);
})();

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
  if (wanted) {
    $$("select[data-programs]").forEach(function (s) { s.value = wanted; });
    /* صفحة التسجيل: كروت البرامج (radio) */
    $$('input[type="radio"][name="program"]').forEach(function (r) { r.checked = r.value == wanted; });
    /* خدماتنا الاستشارية: شرايح المجالات (checkbox) — ?area=management */
    $$('input[type="checkbox"][name="area"]').forEach(function (c) { if (c.value == wanted) c.checked = true; });
  }

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
      /* مجموعة شرايح مطلوبة (data-required-group): لازم اختيار واحد على الأقل */
      var groups = $$(".cf-chips[data-required-group]", f), missing = null;
      groups.forEach(function (g) {
        var ok = $$("input:checked", g).length > 0, err = g.parentNode.querySelector(".org-area-error");
        if (err) err.hidden = ok;
        if (!ok && !missing) missing = g;
      });
      if (missing) { $("input", missing).focus(); return; }
      var lines = $$("input, select, textarea", f).filter(function (el) {
        /* الشرايح (radio/checkbox جوه .cf-chip): المختار بس */
        return !(el.closest(".cf-chip") || el.closest(".reg-program")) || el.checked;
      }).map(function (el) {
        var v = el.tagName == "SELECT" && el.selectedIndex > 0 ? el.options[el.selectedIndex].text : el.value;
        var lb = el.closest("label"), name = el.getAttribute("aria-label") || (lb && lb.firstElementChild && lb.firstElementChild.textContent) || el.name;
        if (el.type == "checkbox") v = el.checked ? "✓" : "✗";
        if (el.closest(".cf-chip") || el.closest(".reg-program")) {
          /* اسم المجموعة: عنوان الشرايح لو موجود، وإلا عنوان الجزء */
          var grp = el.closest(".cf-topics"), gl = grp && grp.querySelector(".cf-topics-label, legend"),
            fs = el.closest("fieldset"), lg = fs && fs.querySelector("legend");
          name = (gl || lg) ? (gl || lg).textContent.replace(/\s*\*.*$/, "") : el.name;
          v = el.nextElementSibling ? el.nextElementSibling.textContent : el.value;
        }
        return name.trim() + ": " + v.trim();
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
     PROGRAMS 3D (الرئيسية): كروت متراصة بمنظور
     التقليب: سحب بالماوس (رأسي أو أفقي) · عجلة الماوس · سحب أفقي باللمس · الأسهم · القائمة · النقط
     الموضع "pos" رقم عشري، فالكروت بتمشي مع إيد المستخدم وهو بيسحب وبعدين بتستقر على أقرب كارت
     ===================================================== */
  (function () {
    var box = $(".pgx");
    if (!box) return;
    var stage = $(".pgx-stage", box),
      anchors = $$(".pgx-anchor", box),
      cards = $$(".pgx-card", box),
      rows = $$(".pgx-row", box),
      details = $$(".pgx-detail", box),
      dots = $$(".pgx-dot", box),
      prev = $(".pgx-prev", box),
      next = $(".pgx-next", box),
      count = $(".pgx-count", box),
      N = cards.length,
      active = 0;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /* يرسم الكروت حوالين موضع عشري (نفس معادلات التصميم الأصلي، بس متصلة عشان السحب) */
    function layout(pos) {
      anchors.forEach(function (an, i) {
        var o = i - pos, n = Math.abs(o), s = o < 0 ? -1 : 1, k = Math.min(n, 1), card = cards[i];
        an.style.zIndex = String(20 - Math.round(n * 2));
        card.style.opacity = n > 2.5 ? 0 : n > 2 ? (2.5 - n) * 2 * 0.88 : 1 - 0.12 * k;
        card.style.pointerEvents = n > 2 ? "none" : "auto";
        card.style.transform = n < 0.001 ? "none"
          : "translateY(" + s * 83 * n + "%) translateZ(" + -260 * n + "px) scale(" + (1 - 0.055 * n) + ") rotateX(" + -s * k * (56 + 4 * n) + "deg)";
        card.lastElementChild.style.opacity = Math.min(n * 0.125, 0.3);
      });
    }
    function select(i) {
      active = clamp(Math.round(i), 0, N - 1);
      layout(active);
      /* زرار الكارت النشط بس هو اللي يتوصله بالـ Tab */
      cards.forEach(function (c, j) {
        var cta = $(".pgx-cta", c);
        if (cta) cta.tabIndex = j == active ? 0 : -1;
        c.parentNode.setAttribute("aria-hidden", j == active ? "false" : "true");
      });
      rows.forEach(function (r, j) { r.setAttribute("aria-pressed", j == active); });
      dots.forEach(function (d, j) { d.setAttribute("aria-current", j == active); });
      details.forEach(function (d, j) { d.hidden = j != active; });
      if (count) count.textContent = pad(active + 1) + " / " + pad(N);
      if (prev) prev.disabled = active == 0;
      if (next) next.disabled = active == N - 1;
    }

    rows.forEach(function (r, i) { r.addEventListener("click", function () { select(i); }); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { select(i); }); });
    if (prev) prev.addEventListener("click", function () { select(active - 1); });
    if (next) next.addEventListener("click", function () { select(active + 1); });

    /* الكيبورد: فوق/تحت، ويمين/شمال حسب اتجاه اللغة */
    stage.addEventListener("keydown", function (e) {
      var rtl = root.dir == "rtl", d = 0;
      if (e.key == "ArrowUp") d = -1;
      if (e.key == "ArrowDown") d = 1;
      if (e.key == "ArrowLeft") d = rtl ? 1 : -1;
      if (e.key == "ArrowRight") d = rtl ? -1 : 1;
      if (d) { e.preventDefault(); select(active + d); }
    });

    /* عجلة الماوس فوق الكروت: كارت لكل حركة. في الأول/الآخر بتسيب الصفحة تسكرول عادي */
    var wheelSum = 0, wheelAt = 0;
    stage.addEventListener("wheel", function (e) {
      var dir = e.deltaY > 0 ? 1 : -1, target = active + dir;
      if (Math.abs(e.deltaY) < 1 || target < 0 || target > N - 1) { wheelSum = 0; return; }
      e.preventDefault();
      if (Date.now() - wheelAt < 450) return;
      wheelSum += e.deltaY;
      if (Math.abs(wheelSum) >= 40) { wheelSum = 0; wheelAt = Date.now(); select(target); }
    }, { passive: false });

    /* السحب: الماوس رأسي أو أفقي، واللمس أفقي بس (الرأسي يسكرول الصفحة) */
    var drag = null, suppressClick = false, STEP = 120;
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, start: active, t: Date.now(), d: 0, moved: false, mouse: e.pointerType == "mouse" };
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y,
        horiz = Math.abs(dx) > Math.abs(dy),
        /* سالب = التالي: السحب لفوق، أو ناحية اتجاه القراءة */
        d = drag.mouse && !horiz ? dy : (root.dir == "rtl" ? -dx : dx);
      if (!drag.moved) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (!drag.mouse && !horiz) { drag = null; return; } /* لمس رأسي = سكرول الصفحة */
        drag.moved = true;
        box.classList.add("is-dragging");
        try { stage.setPointerCapture(drag.id); } catch (err) {}
      }
      drag.d = d;
      layout(clamp(drag.start - d / STEP, -0.35, N - 1 + 0.35));
    });
    function endDrag() {
      if (!drag) return;
      var d = drag, quick = Date.now() - d.t < 280;
      drag = null;
      if (!d.moved) return;
      box.classList.remove("is-dragging");
      suppressClick = true;
      /* سحبة سريعة قصيرة = كارت واحد؛ غير كده أقرب كارت للموضع */
      var target = quick && Math.abs(d.d) > 25 ? d.start + (d.d < 0 ? 1 : -1) : d.start - d.d / STEP;
      select(target);
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    /* الضغط: بعد سحبة ما يفتحش اللينك؛ وعلى كارت مش نشط يجيبه لقدّام بدل ما يفتحه */
    stage.addEventListener("click", function (e) {
      if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
      var card = e.target.closest(".pgx-card"), i = cards.indexOf(card);
      if (card && i != active) { e.preventDefault(); select(i); }
    }, true);

    select(0);
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
  /* بوستر كلمة المستشارة: البوستر بيقوم من ميل 3D، والصورة بتنكشف جوه القوس */
  if ($(".poster")) {
    gsap.fromTo(".poster", { rotateX: 14, y: 60, scale: 0.94 }, {
      rotateX: 0, y: 0, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".advisor-poster", start: "top 95%", end: "top 25%", scrub: true },
    });
    gsap.timeline({ scrollTrigger: { trigger: ".poster-grid", start: "top 75%", once: true } })
      .fromTo(".poster-arch", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 28px 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 28px 28px)", duration: 1.4, ease: "expo.inOut" })
      .from(".poster-arch-line", { autoAlpha: 0, x: 18, y: 18, duration: 1, ease: "expo.out" }, 0.6)
      .from(".poster-stamp-link", { scale: 0, duration: 1, ease: "back.out(1.7)", clearProps: "transform" }, 0.9)
      .from(".poster-tag", { autoAlpha: 0, y: 20, duration: 0.8, ease: "expo.out" }, 1)
      .from(".poster-mark", { autoAlpha: 0, yPercent: 40, duration: 1, ease: "expo.out" }, 0.3);
    gsap.to(".poster-arch img", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".poster", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.to(".poster-watermark", { xPercent: -12, ease: "none", scrollTrigger: { trigger: ".poster", start: "top bottom", end: "bottom top", scrub: true } });
  }
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
  /* CTA: اللوحة بتقوم من ميل 3D مع السكرول، وبعدين المحتوى وقائمة البرامج بيدخلوا بالتتابع */
  if ($(".cta-panel")) {
    gsap.fromTo(".cta-panel", { rotateX: 12, y: 50, scale: 0.95 }, {
      rotateX: 0, y: 0, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top 95%", end: "top 35%", scrub: true },
    });
    gsap.timeline({ scrollTrigger: { trigger: ".cta-panel", start: "top 75%", once: true } })
      .from(".cta-pixels rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.1, from: "random" } }, 0)
      .from(".cta-copy > *", { y: 34, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.1)
      .from(".cta-progs-label, .cta-prog", { x: root.dir == "rtl" ? -40 : 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07 }, 0.35);
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
/* =========================================================
   رحلة المتدرب: مسار متعرّج بين الأرقام، بيترسم مع السكرول
   - المسار بيتحسب من أماكن الأرقام الفعلية (بيتعاد مع تغيير المقاس/اللغة)
   - الخط الملوّن بيتملى، ونقطة مضيئة على راسه، وكل محطة بتنوّر لما الخط يوصلها
   ========================================================= */
(function () {
  var jr = document.querySelector(".jr");
  if (!jr) return;
  var root = document.documentElement,
    svg = jr.querySelector(".jr-svg"),
    track = jr.querySelector(".jr-track"),
    line = jr.querySelector(".jr-line"),
    dot = jr.querySelector(".jr-dot"),
    grad = svg.querySelector("#jrGrad"),
    steps = [].slice.call(jr.querySelectorAll(".jr-step")),
    badges = steps.map(function (s) { return s.querySelector(".jr-badge"); }),
    animated = root.classList.contains("gsap-enabled") && window.ScrollTrigger,
    len = 0, stops = [], progress = animated ? 0 : 1;

  /* قطعة بين نقطتين: أفقي → رأسي في النص → أفقي، بزوايا مدوّرة */
  function seg(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dy) < 1 || Math.abs(dx) < 1) return " L" + b.x + " " + b.y;
    var mx = (a.x + b.x) / 2, sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1,
      r = Math.min(18, Math.abs(dx) / 2, Math.abs(dy) / 2);
    return " L" + (mx - sx * r) + " " + a.y +
      " Q" + mx + " " + a.y + " " + mx + " " + (a.y + sy * r) +
      " L" + mx + " " + (b.y - sy * r) +
      " Q" + mx + " " + b.y + " " + (mx + sx * r) + " " + b.y +
      " L" + b.x + " " + b.y;
  }

  function build() {
    var box = jr.getBoundingClientRect();
    var pts = badges.map(function (b) {
      var r = b.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2 - box.left), y: Math.round(r.top + r.height / 2 - box.top) };
    });
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
    grad.setAttribute("x1", pts[0].x); grad.setAttribute("y1", pts[0].y);
    grad.setAttribute("x2", pts[pts.length - 1].x); grad.setAttribute("y2", pts[pts.length - 1].y);
    var d = "M" + pts[0].x + " " + pts[0].y, probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stops = [0];
    for (var i = 1; i < pts.length; i++) {
      d += seg(pts[i - 1], pts[i]);
      probe.setAttribute("d", d);
      stops.push(probe.getTotalLength());
    }
    track.setAttribute("d", d);
    line.setAttribute("d", d);
    len = line.getTotalLength();
    line.style.strokeDasharray = len + " " + len;
    render();
  }

  function render() {
    var at = len * progress;
    line.style.strokeDashoffset = len - at;
    if (len) {
      var p = line.getPointAtLength(Math.max(0.01, at));
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
    }
    jr.classList.toggle("is-drawing", progress > 0.001 && progress < 0.999);
    var last = -1;
    steps.forEach(function (s, i) {
      var on = at >= stops[i] - 4;
      s.classList.toggle("is-on", on);
      if (on) last = i;
    });
    steps.forEach(function (s, i) { s.classList.toggle("is-current", i == last && progress < 0.999); });
  }

  build();
  window.addEventListener("load", build);
  /* تغيير اللغة بيقلب الاتجاه → الأرقام بتتبدّل أماكنها */
  new MutationObserver(function () { requestAnimationFrame(build); }).observe(root, { attributes: true, attributeFilter: ["dir", "lang"] });

  if (!animated) { window.addEventListener("resize", build); return; }

  ScrollTrigger.addEventListener("refreshInit", build);
  ScrollTrigger.create({
    trigger: jr, start: "top 72%", end: "bottom 62%", scrub: 0.6,
    onUpdate: function (self) { progress = self.progress; render(); },
  });
  /* دخول الكروت: بتتقلب من تحت بمنظور */
  gsap.from(jr.querySelectorAll(".jr-fig"), {
    y: 70, rotateX: -24, transformPerspective: 900, transformOrigin: "50% 100%", autoAlpha: 0,
    duration: 1.1, ease: "expo.out", stagger: 0.12,
    scrollTrigger: { trigger: jr, start: "top 82%", once: true },
  });
  gsap.from(jr.querySelectorAll(".jr-badge"), {
    scale: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.12, delay: 0.3, clearProps: "transform",
    scrollTrigger: { trigger: jr, start: "top 82%", once: true },
  });
})();

/* =========================================================
   لماذا إمباكتفورج: كروت متعلّقة بتتمرجح (زنبرك بسيط)
   - الماوس: اسحب الكارت يمين/شمال وسيبه يتمرجح
   - اللمس: الضغطة بتدّي الكارت زقّة خفيفة (والسكرول شغال عادي)
   - الكشّاف بيلف ناحية الكارت اللي عليه الماوس
   - الكروت بتنزل من فوق وتتمرجح لما السكشن يظهر
   ========================================================= */
(function () {
  var box = document.querySelector(".whyx");
  if (!box) return;
  var root = document.documentElement,
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches,
    narrow = matchMedia("(max-width: 1080px)"),
    beam = box.querySelector(".whyx-beam"),
    pool = box.querySelector(".whyx-pool"),
    L = { a: 0, ta: 0, x: 0, tx: 0, y: 0, ty: 0 },
    t = 0, running = false;

  var S = [].slice.call(box.querySelectorAll(".whyx-card")).map(function (el) {
    var base = parseFloat(getComputedStyle(el).getPropertyValue("--a")) || 0;
    var s = { el: el, base: base, a: base * (narrow.matches ? 0.45 : 1), v: 0, drag: false, x0: 0, a0: 0, ph: Math.random() * 6 };

    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType != "mouse") { s.v += (Math.random() > 0.5 ? 1 : -1) * 2.4; return; }
      s.drag = true; s.x0 = e.clientX; s.a0 = s.a;
      el.classList.add("is-drag"); el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!s.drag) return;
      s.a = Math.max(-40, Math.min(40, s.a0 + (e.clientX - s.x0) * 0.25)); s.v = 0;
    });
    function up() { s.drag = false; el.classList.remove("is-drag"); }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    /* الكشّاف يتبع الكارت (ماوس بس، وفي التصميم الكبير) */
    el.addEventListener("pointerenter", function (e) {
      if (e.pointerType != "mouse") return;
      var b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2 - b.left - b.width / 2, cy = r.top + r.height / 2 - b.top + 90;
      L.ta = -Math.atan2(cx, cy) * 180 / Math.PI;
      L.tx = cx; L.ty = r.top - b.top - 120;
      el.classList.add("is-lit");
    });
    el.addEventListener("pointerleave", function () {
      L.ta = 0; L.tx = 0; L.ty = 0;
      el.classList.remove("is-lit");
    });
    return s;
  });

  function frame() {
    if (!running) return;
    t += 0.016;
    L.a += (L.ta - L.a) * 0.07; L.x += (L.tx - L.x) * 0.07; L.y += (L.ty - L.y) * 0.07;
    beam.style.rotate = L.a + "deg";
    pool.style.translate = L.x + "px " + L.y + "px";
    /* في الشاشات الصغيرة الكروت أعرض، فالميل بيبقى أهدى */
    var f = narrow.matches ? 0.45 : 1;
    S.forEach(function (s) {
      if (!s.drag) {
        var sway = Math.sin(t * 1.1 + s.ph) * 0.5;
        s.v += (s.base * f + sway - s.a) * 0.06; s.v *= 0.93; s.a += s.v;
      }
      s.el.style.rotate = s.a.toFixed(3) + "deg";
    });
    requestAnimationFrame(frame);
  }
  if (reduce) return;

  /* اللوب شغال بس والسكشن ظاهر */
  new IntersectionObserver(function (en) {
    var vis = en[0].isIntersecting;
    if (vis && !running) { running = true; requestAnimationFrame(frame); }
    else if (!vis) running = false;
  }).observe(box);

  /* دخول: الكروت بتنزل من فوق، ولما توصل تاخد زقّة فتتمرجح */
  if (root.classList.contains("gsap-enabled") && window.gsap) {
    S.forEach(function (s, i) {
      gsap.from(s.el, {
        y: -360, autoAlpha: 0, duration: 1.1, ease: "power3.in", delay: i * 0.12,
        scrollTrigger: { trigger: box, start: "top 70%", once: true },
        onComplete: function () { s.v += (i % 2 ? 1 : -1) * (narrow.matches ? 1.2 : 2.4); },
      });
    });
    gsap.from(".whyx-beam, .whyx-lamp", { autoAlpha: 0, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: box, start: "top 75%", once: true } });
  }
})();

/* =========================================================
   صفحة البرامج: أكورديون بيتفتح
   - الضغط على أي برنامج (أو زرار اسمه) يفرده ويقفل الباقي
   - الأسهم بتتنقل بين البرامج (حسب اتجاه الصفحة)، و Home/End لأول/آخر واحد
   ========================================================= */
(function () {
  var acc = document.querySelector(".pacc");
  if (!acc) return;
  var root = document.documentElement,
    panels = [].slice.call(acc.querySelectorAll(".pa")),
    buttons = panels.map(function (p) { return p.querySelector(".pa-title button"); });

  function open(i, focus) {
    panels.forEach(function (p, j) {
      var on = j == i;
      p.classList.toggle("is-open", on);
      buttons[j].setAttribute("aria-expanded", on);
    });
    if (focus) buttons[i].focus();
  }

  panels.forEach(function (p, i) {
    p.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; /* زرار "تفاصيل البرنامج" يشتغل عادي */
      if (!p.classList.contains("is-open")) open(i);
    });
  });

  acc.addEventListener("keydown", function (e) {
    var i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    var rtl = root.dir == "rtl", vertical = matchMedia("(max-width: 860px)").matches, n = null;
    if (e.key == "Home") n = 0;
    else if (e.key == "End") n = panels.length - 1;
    else if (vertical ? e.key == "ArrowDown" : e.key == (rtl ? "ArrowLeft" : "ArrowRight")) n = Math.min(panels.length - 1, i + 1);
    else if (vertical ? e.key == "ArrowUp" : e.key == (rtl ? "ArrowRight" : "ArrowLeft")) n = Math.max(0, i - 1);
    if (n === null) return;
    e.preventDefault();
    open(n, true);
  });

  /* دخول: الأعمدة بتطلع من تحت بالتتابع */
  if (root.classList.contains("gsap-enabled") && window.gsap) {
    gsap.from(panels, {
      y: 70, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.08, clearProps: "transform,opacity,visibility",
      scrollTrigger: { trigger: acc, start: "top 85%", once: true },
    });
  }
})();

/* =========================================================
   تفاصيل البرنامج: فهرس "في هذه الصفحة" بيعلّم القسم اللي بتقراه
   ========================================================= */
(function () {
  var links = [].slice.call(document.querySelectorAll(".pd-toc a"));
  if (!links.length || !("IntersectionObserver" in window)) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var visible = {};
  function update() {
    /* أول قسم ظاهر من فوق هو الحالي */
    var current = null;
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (!current && visible[id]) current = id;
    });
    if (!current) return;
    links.forEach(function (a) {
      var on = a.getAttribute("href") == "#" + current;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    update();
  }, { rootMargin: "-120px 0px -55% 0px" });
  Object.keys(map).forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) io.observe(sec);
  });
})();

/* =========================================================
   المدونة: تابات الفلتر بشكل cube-nav (لزجة + توهّج بيتبع الماوس) + الفلترة
   ========================================================= */
(function () {
  var nav = document.querySelector(".blog-filter-tabs");
  if (!nav) return;
  var root = document.documentElement,
    tabs = [].slice.call(nav.querySelectorAll("button")),
    goo = document.querySelector(".blog-filter-goo"),
    wrap = document.querySelector(".blog-filter-wrap"),
    paths = [].slice.call(goo.querySelectorAll("path")),
    glow = document.getElementById("blog-filter-glow"),
    cards = [].slice.call(document.querySelectorAll(".blog-card")),
    featured = document.querySelector(".blog-featured"),
    empty = document.querySelector(".blog-empty"),
    R = 12, BRIDGE = 21.3, OVERLAP = 1.91,
    now = { x: 0, y: 0 }, to = { x: 0, y: 0 }, raf = null, hovering = false;

  function active() { return tabs.filter(function (t) { return t.getAttribute("aria-pressed") == "true"; })[0] || tabs[0]; }

  /* نفس شكل cube-nav: مستطيل مدوّر لكل زرار + جسر منحني بين كل جارين */
  function rr(x, y, w, h, r) {
    return "M" + x + " " + (y + r) + " A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y +
      " L" + (x + w - r) + " " + y + " A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
      " L" + (x + w) + " " + (y + h - r) + " A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
      " L" + (x + r) + " " + (y + h) + " A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + " Z ";
  }
  function build() {
    var bs = tabs.slice().sort(function (a, b) { return a.offsetLeft - b.offsetLeft; }),
      H = bs[0].offsetHeight, dx = R - OVERLAP, inset = R - Math.sqrt(R * R - dx * dx), d = "";
    bs.forEach(function (b) { d += rr(b.offsetLeft, 0, b.offsetWidth, H, R); });
    for (var i = 0; i < bs.length - 1; i++) {
      var x1 = bs[i].offsetLeft + bs[i].offsetWidth - OVERLAP, x2 = bs[i + 1].offsetLeft + OVERLAP;
      d += "M" + x1 + " " + inset + " A" + BRIDGE + " " + BRIDGE + " 0 0 0 " + x2 + " " + inset +
        " L" + x2 + " " + (H - inset) + " A" + BRIDGE + " " + BRIDGE + " 0 0 0 " + x1 + " " + (H - inset) + " Z ";
    }
    paths.forEach(function (p) { p.setAttribute("d", d); });
    fit();
    hot(active(), true);
  }
  /* لو أعرض من المساحة: تصغير خفيف، ولو محتاج تصغير كبير → سكرول أفقي (عشان الكلام يفضل مقروء) */
  function fit() {
    goo.style.transform = "";
    var s = Math.min(1, wrap.clientWidth / goo.offsetWidth);
    var scroll = s < 0.8;
    wrap.classList.toggle("is-scroll", scroll);
    goo.style.transform = !scroll && s < 1 ? "scale(" + s + ")" : "";
  }
  function setGlow(x, y) { glow.setAttribute("cx", x); glow.setAttribute("cy", y); }
  function tick() {
    now.x += (to.x - now.x) * 0.18; now.y += (to.y - now.y) * 0.18;
    setGlow(now.x, now.y);
    raf = Math.abs(to.x - now.x) > 0.1 || Math.abs(to.y - now.y) > 0.1 ? requestAnimationFrame(tick) : null;
  }
  function moveGlow(x, y, snap) {
    to.x = x; to.y = y;
    if (snap) { now.x = x; now.y = y; setGlow(x, y); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function hot(b, snap) {
    tabs.forEach(function (t) { t.classList.toggle("is-hot", t === b); });
    moveGlow(b.offsetLeft + b.offsetWidth / 2, b.offsetHeight / 2, snap);
  }

  goo.addEventListener("pointermove", function (e) {
    hovering = true;
    var r = goo.getBoundingClientRect(), s = r.width / goo.offsetWidth;
    moveGlow((e.clientX - r.left) / s, (e.clientY - r.top) / s, false);
  });
  goo.addEventListener("pointerleave", function () { hovering = false; hot(active(), false); });

  /* الفلترة */
  function filter(tab) {
    var cat = tab.dataset.cat, shown = 0;
    tabs.forEach(function (t) { t.setAttribute("aria-pressed", t === tab); });
    cards.forEach(function (card) {
      var on = cat == "all" || card.dataset.cat == cat;
      card.classList.toggle("is-out", !on);
      card.classList.remove("is-in");
      if (on) { void card.offsetWidth; card.classList.add("is-in"); shown++; }
    });
    /* المقال المميّز ثابت فوق (مش جزء من الفلترة) */
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = shown;
    hot(tab, false);
    if (wrap.classList.contains("is-scroll")) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    /* لو نازلين تحت والشريط ثابت: نرجع لأول النتايج عشان التغيير يبان */
    if (bar && bar.classList.contains("is-stuck")) {
      var y = grid.getBoundingClientRect().top + scrollY - bar.offsetHeight - parseFloat(getComputedStyle(bar).top) - 16;
      scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* الشريط بياخد خلفية لما يثبت تحت الهيدر */
  var bar = document.querySelector(".blog-toolbar"),
    grid = document.querySelector(".blog-grid"),
    count = document.querySelector(".blog-results-count b");
  function stuck() {
    if (!bar) return;
    var top = parseFloat(getComputedStyle(bar).top) || 0;
    bar.classList.toggle("is-stuck", bar.getBoundingClientRect().top <= top + 0.5 && grid.getBoundingClientRect().bottom > top + bar.offsetHeight);
  }
  addEventListener("scroll", stuck, { passive: true });
  stuck();
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { filter(t); });
    t.addEventListener("pointerenter", function () { tabs.forEach(function (x) { x.classList.toggle("is-hot", x === t); }); });
    t.addEventListener("focus", function () { hot(t, false); });
    /* الأسهم بتتنقل بين التابات */
    t.addEventListener("keydown", function (e) {
      var rtl = root.dir == "rtl", n = null;
      if (e.key == (rtl ? "ArrowLeft" : "ArrowRight")) n = Math.min(tabs.length - 1, i + 1);
      else if (e.key == (rtl ? "ArrowRight" : "ArrowLeft")) n = Math.max(0, i - 1);
      if (n === null) return;
      e.preventDefault(); tabs[n].focus(); filter(tabs[n]);
    });
  });

  build();
  addEventListener("resize", build);
  if (document.fonts) document.fonts.ready.then(build);
  new MutationObserver(function () { requestAnimationFrame(build); }).observe(root, { attributes: true, attributeFilter: ["lang", "dir"] });
})();


/* =========================================================
   تفاصيل المقال: أزرار المشاركة (نسخ الرابط + واتساب + X + لينكدإن)
   ========================================================= */
(function () {
  var box = document.querySelector(".blog-post-share");
  if (!box) return;
  var url = location.href.split("#")[0],
    title = (document.querySelector(".blog-post-title") || document.querySelector("h1")).textContent.trim(),
    status = box.querySelector(".blog-share-status"),
    rtl = function () { return document.documentElement.dir == "rtl"; };
  var links = {
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(title + " " + url),
    x: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url),
    linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url),
  };
  [].forEach.call(box.querySelectorAll("a[data-share]"), function (a) { a.href = links[a.dataset.share]; });
  var copy = box.querySelector('[data-share="copy"]');
  if (copy) copy.addEventListener("click", function () {
    function done(ok) {
      status.textContent = ok ? (rtl() ? "تم نسخ الرابط ✓" : "Link copied ✓") : (rtl() ? "تعذّر النسخ" : "Couldn’t copy");
      clearTimeout(done.t); done.t = setTimeout(function () { status.textContent = ""; }, 2500);
    }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });
})();

/* =========================================================
   خدماتنا الاستشارية: الكروت بتبدأ متراصة ومايلة في النص، وبتتفرد لأماكنها مع السكرول
   السهم في كل كارت بيودي للنموذج ونوع الجهة متحدد
   ========================================================= */
(function () {
  var track = document.querySelector(".svc-track");
  if (!track) return;
  var root = document.documentElement,
    grid = track.querySelector(".svc-grid"),
    slots = [].slice.call(grid.children),
    still = matchMedia("(max-width: 1000px), (prefers-reduced-motion: reduce)"),
    ROT = [-9.4, 0.6, -0.6, 9.4], TY = [0, -6, -12, -18],
    queued = false;
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  function update() {
    queued = false;
    if (still.matches) {
      slots.forEach(function (s) { s.style.transform = ""; s.style.zIndex = ""; });
      return;
    }
    var r = track.getBoundingClientRect(), total = track.offsetHeight - innerHeight,
      p = Math.min(1, Math.max(0, -r.top / total)),
      k = 1 - ease(Math.min(1, p / 0.7)), /* 1 = متراصين، 0 = في أماكنهم */
      gc = grid.clientWidth / 2,
      rtl = root.dir == "rtl";
    slots.forEach(function (s, i) {
      s.style.zIndex = k > 0.02 ? slots.length - i : "";
      if (k <= 0.001) { s.style.transform = ""; return; }
      var dx = (gc - (s.offsetLeft + s.offsetWidth / 2)) * k,
        rot = (rtl ? -ROT[i] : ROT[i]) * k;
      s.style.transform = "translate(" + dx.toFixed(1) + "px," + (TY[i] * k).toFixed(1) + "px) scale(" + (1 - 0.16 * k).toFixed(3) + ") rotate(" + rot.toFixed(2) + "deg)";
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  if (still.addEventListener) still.addEventListener("change", queue);
  update();

  /* السهم: يحدد نوع الجهة في النموذج قبل ما ينزل له */
  [].forEach.call(track.querySelectorAll(".svc-arrow[data-org-type]"), function (a) {
    a.addEventListener("click", function () {
      var r = document.querySelector('input[name="org_type"][value="' + a.dataset.orgType + '"]');
      if (r) r.checked = true;
    });
  });
})();

/* =========================================================
   عرض "المروحة" العام (.fan-track): نفس حركة كروت خدماتنا الاستشارية
   الكروت بتبدأ متراصة ومايلة في النص، وبتتفرد لأماكنها مع السكرول
   ========================================================= */
(function () {
  var tracks = [].slice.call(document.querySelectorAll(".fan-track"));
  if (!tracks.length) return;
  var root = document.documentElement,
    still = matchMedia("(max-width: 1000px), (prefers-reduced-motion: reduce)"),
    ease = function (t) { return 1 - Math.pow(1 - t, 3); },
    queued = false;
  /* زوايا الميل والإزاحة لكل كارت حسب عددهم (الأطراف أكتر ميل) */
  function rotFor(i, n) { var m = (n - 1) / 2; return n < 2 ? 0 : ((i - m) / m) * 9.4 + (i % 2 ? 0.6 : -0.6); }

  function update() {
    queued = false;
    tracks.forEach(function (track) {
      var grid = track.querySelector(".fan-grid");
      if (!grid) return;
      var slots = [].slice.call(grid.children), n = slots.length;
      if (still.matches) { slots.forEach(function (s) { s.style.transform = ""; s.style.zIndex = ""; }); return; }
      var r = track.getBoundingClientRect(), total = Math.max(1, track.offsetHeight - innerHeight),
        p = Math.min(1, Math.max(0, -r.top / total)),
        k = 1 - ease(Math.min(1, p / 0.7)),
        gc = grid.clientWidth / 2,
        rtl = root.dir == "rtl";
      slots.forEach(function (s, i) {
        s.style.position = "relative";
        s.style.zIndex = k > 0.02 ? n - i : "";
        if (k <= 0.001) { s.style.transform = ""; return; }
        var dx = (gc - (s.offsetLeft + s.offsetWidth / 2)) * k,
          rot = (rtl ? -1 : 1) * rotFor(i, n) * k;
        s.style.transform = "translate(" + dx.toFixed(1) + "px," + (-6 * i * k).toFixed(1) + "px) scale(" + (1 - 0.16 * k).toFixed(3) + ") rotate(" + rot.toFixed(2) + "deg)";
      });
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  if (still.addEventListener) still.addEventListener("change", queue);
  update();
})();
