/* =========================================================
   Impact Forge — shared site script
   المحتوى كله مكتوب في الـ HTML؛ الملف ده للتفاعل والحركة بس
   ========================================================= */
(function () {
  /* رابط منصة التعلّم: سيبيه فاضي لحد الإطلاق (أزرار [data-platform] هتظهر "قريبًا")، وبعدها حطي الرابط هنا بس */
  var PLATFORM_URL = "";

  var root = document.documentElement,
    body = document.body,
    hd = document.getElementById("hd"),
    advFilter = document.getElementById("advFilter"),
    advGrid = document.getElementById("advGrid");
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  var langHooks = [];

  /* البرنامج المختار من الرابط (contact.html?program=nursing) */
  var wanted = new URLSearchParams(location.search).get("program");
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
  var tabFx = null; /* مؤشر التاب: بيتعرّف في طبقة GSAP */
  $$(".tabs").forEach(function (tabs) {
    var els = tabs.getElementsByClassName("tab");
    tabs.setAttribute("role", "tablist");
    [].forEach.call(els, function (b, j) { b.setAttribute("role", "tab"); b.setAttribute("aria-selected", j == 0); b.tabIndex = j == 0 ? 0 : -1; });
    function select(k, focus) {
      [].forEach.call(els, function (x, j) {
        x.classList.toggle("on", j == k); x.setAttribute("aria-selected", j == k); x.tabIndex = j == k ? 0 : -1;
      });
      if (focus) els[k].focus();
      tabs.dispatchEvent(new CustomEvent("tabchange", { detail: els[k].dataset.v }));
      if (tabFx) tabFx(tabs);
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
  if (advFilter)
    advFilter.addEventListener("tabchange", function (e) {
      var shown = [];
      $$(".ac", advGrid).forEach(function (c) {
        var on = e.detail == "all" || c.dataset.p == e.detail;
        c.hidden = !on;
        if (on) shown.push(c);
      });
      if (root.classList.contains("gs")) gsap.fromTo(shown, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" });
    });

  /* =====================================================
     LANGUAGE + MOBILE MENU
     ===================================================== */
  var menu = $("#nv"),
    burger = $("#bg");
  function setLang(l) {
    root.lang = l;
    root.dir = l == "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("lang", l); } catch (e) {}
    langHooks.forEach(function (f) { f(); });
    if (root.classList.contains("gs")) ScrollTrigger.refresh();
  }
  if ($("#lg")) $("#lg").onclick = function () { setLang(root.lang == "ar" ? "en" : "ar"); };

  function toggleMenu(open) {
    var o = typeof open == "boolean" ? open : !menu.classList.contains("o");
    menu.classList.toggle("o", o);
    burger.setAttribute("aria-expanded", o);
  }
  if (burger) {
    burger.onclick = function () { toggleMenu(); };
    menu.onclick = function (e) { if (e.target.closest("a")) toggleMenu(false); };
    addEventListener("keydown", function (e) { if (e.key == "Escape") toggleMenu(false); });
  }

  /* =====================================================
     REVEAL (بدون GSAP) + PROGRESS + BACK TO TOP
     ===================================================== */
  if (!root.classList.contains("gs")) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add("v"); revealObserver.unobserve(x.target); }
      });
    }, { threshold: 0.12 });
    $$(".rv").forEach(function (x) { revealObserver.observe(x); });
  }

  var progress = $("#pr"),
    toTop = $("#tp");
  function onScrollProgress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
    if (toTop) toTop.classList.toggle("s", scrollY > 600);
  }
  onScrollProgress();
  addEventListener("scroll", onScrollProgress, { passive: true });
  if (toTop) toTop.onclick = function () { scrollTo({ top: 0, behavior: "smooth" }); };

  /* =====================================================
     FORMS (mailto لحد ما يبقى فيه باك إند)
     ===================================================== */
  $$("form.cf").forEach(function (f) {
    f.onsubmit = function (e) {
      e.preventDefault();
      var lines = $$("input, select, textarea", f).map(function (el) {
        var v = el.tagName == "SELECT" && el.selectedIndex > 0 ? el.options[el.selectedIndex].text : el.value;
        return (el.getAttribute("aria-label") || el.name) + ": " + v;
      });
      /* المستلم ونص رسالة التأكيد مكتوبين في الـ HTML: data-to على الفورم و .cf-ok */
      location.href = "mailto:" + (f.dataset.to || "") + "?subject=" + encodeURIComponent(f.dataset.subject || "Website inquiry") + "&body=" + encodeURIComponent(lines.join("\n"));
      f.classList.add("sent");
    };
  });

  /* =====================================================
     HANGING STRIP (الرئيسية): سكرول بسيط "بيزق" اللوحة فتتمرجح وتستقر
     ===================================================== */
  (function () {
    var strip = $("#strip"),
      hold = $("#stripHold");
    if (!strip) return;
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      removeEventListener("scroll", check);
      hold.classList.add("on");
      strip.classList.add("on");
    }
    function check() { if (scrollY > 30) fire(); }
    strip.addEventListener("animationend", function (e) {
      if (e.animationName === "panelSwing") strip.classList.add("done");
    });
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      strip.classList.add("done");
      hold.classList.add("on");
      return;
    }
    addEventListener("scroll", check, { passive: true });
    check();
  })();

  /* =====================================================
     GSAP MOTION LAYER (html.gs بس)
     ===================================================== */
  if (!root.classList.contains("gs")) return;
  gsap.registerPlugin(ScrollTrigger);

  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* تقسيم لكلمات (العربي ما ينفعش يتقسم حروف). mask=true: كل كلمة جوه قناع للـ reveal */
  function wrapNode(n, parent) {
    var o = document.createElement("span"), i = document.createElement("span");
    o.className = "wd"; i.className = "wi";
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
          s.className = "mw"; el.insertBefore(s, tn); s.appendChild(tn); out.push(s);
        });
        el.removeChild(n);
      } else if (n.nodeType == 1) {
        var lang = n.classList.contains("ar") || n.classList.contains("en");
        if (lang || !mask) out = out.concat(split(n, mask));
        else out.push(wrapNode(n, el)); /* زي <b>: يتحرك كوحدة عشان التدرج ما يبوظش */
      }
    });
    return out;
  }

  gsap.from(".nav-wrapper", { yPercent: -120, duration: 1, ease: "expo.out" });

  /* ---------- HERO الرئيسية ---------- */
  if ($(".hx")) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .set(".rise", { visibility: "inherit" })
      .from(".hx .px rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.09, from: "random" } }, 0.15)
      .from(".hx-arch", { scaleY: 0, transformOrigin: "50% 100%", duration: 1.4, ease: "expo.out" }, 0.2)
      .from(".hx-or", { scale: 0.5, autoAlpha: 0, duration: 1.6, ease: "expo.out", stagger: 0.15 }, 0.3)
      .from(".hx-im", { yPercent: 14, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.45)
      .from(".hx .eb", { y: 20, autoAlpha: 0, duration: 0.8 }, 0.35)
      .from(split($(".h1"), true), { yPercent: 120, rotate: 6, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.45)
      .from(split($(".h1-2"), true), { yPercent: 120, duration: 0.9, ease: "expo.out", stagger: 0.05 }, 0.65)
      .from(".v30", { y: 40, rotate: -5, autoAlpha: 0, duration: 1, ease: "back.out(1.6)" }, 0.8)
      .from(".ld", { y: 30, autoAlpha: 0, duration: 0.9 }, 0.75)
      .from(".hx .ha > *", { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.9);

    gsap.to(".hx-or.a", { rotation: 360, duration: 60, ease: "none", repeat: -1 });
    gsap.to(".hx-or.b", { rotation: -360, duration: 90, ease: "none", repeat: -1 });

    var heroST = function () { return { trigger: ".hx", start: "top top", end: "bottom top", scrub: true }; };
    gsap.to(".hx-v", { yPercent: 10, ease: "none", scrollTrigger: heroST() });
    gsap.to(".hx-a, .hx-c", { y: -70, ease: "none", scrollTrigger: heroST() });
    gsap.to(".hx .px", { rotate: -8, yPercent: -30, ease: "none", scrollTrigger: heroST() });

    if (fine) {
      var hero = $(".hx"),
        layers = [[".hx-im", -14], [".hx-gl", 40], [".hx-or.a", 26], [".hx-or.b", -34], [".hx .px", 22], [".v30", -12]].map(function (l) {
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
  if ($(".ph")) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .set(".ph-in", { visibility: "inherit" })
      .from(".ph .px rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.09, from: "random" } }, 0.1)
      .from(".ph-ring", { scale: 0.6, autoAlpha: 0, duration: 1.6, ease: "expo.out", stagger: 0.15 }, 0.1)
      .from(".ph-num", { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.3)
      .from(".ph .crumbs, .ph .eb, .ph-in > .en-name", { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.2)
      .from(split($(".ph h1"), true), { yPercent: 120, rotate: 5, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0.3)
      .from(".ph-sub, .ph .ha > *", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.6);
    gsap.to(".ph-ring.a", { rotation: 360, duration: 70, ease: "none", repeat: -1 });
    gsap.to(".ph .px", { rotate: -8, yPercent: -30, ease: "none", scrollTrigger: { trigger: ".ph", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".ph-num", { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".ph", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- HEADER: يختفي مع النزول ويرجع مع الطلوع ---------- */
  var shown = true;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (s) {
      var show = s.direction < 0 || s.scroll() < 200 || (menu && menu.classList.contains("o"));
      if (show == shown) return;
      shown = show;
      gsap.to(hd, { yPercent: show ? 0 : -140, duration: 0.5, ease: "power3.out" });
    },
  });

  /* ---------- عناوين السكاشن: الكلمات تطلع من قناع ---------- */
  $$("main section:not(.hx):not(.ph) h2").forEach(function (h) {
    gsap.from(split(h, true), {
      yPercent: 120, rotate: 5, duration: 1.1, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: h, start: "top 88%", once: true },
    });
  });

  /* ---------- ظهور عام لمحتوى .rv ---------- */
  $$(".rv").forEach(function (rv) {
    rv.classList.add("v");
    if (rv.matches(".ab-cards, .gal")) return;
    var kids = [].filter.call(rv.children, function (k) { return k.tagName != "H2"; });
    gsap.from(kids, {
      y: 46, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: rv, start: "top 86%", once: true },
    });
  });

  /* ---------- الشكل المترابط ---------- */
  if ($(".ab-cards"))
    gsap.timeline({ scrollTrigger: { trigger: ".ab-cards", start: "top 75%", once: true } })
      .from(".ab-shape path", { scale: 0.6, rotate: -8, autoAlpha: 0, transformOrigin: "50% 50%", duration: 1.3, ease: "expo.out" })
      .from(".ab-c", { y: 70, scale: 0.88, autoAlpha: 0, duration: 1, ease: "back.out(1.4)", stagger: 0.14 }, 0.25)
      .from(".ab-img", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut", stagger: 0.14 }, 0.3);

  /* ---------- النص بيتقري مع السكرول ---------- */
  $$(".scrub").forEach(function (q) {
    var ps = $$("p", q);
    (ps.length ? ps : [q]).forEach(function (p) {
      gsap.fromTo(split(p, false), { opacity: 0.16 }, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 50%", scrub: true },
      });
    });
  });
  if ($(".pf img")) {
    gsap.from(".pf img", { clipPath: "inset(100% 0% 0% 0% round 24px)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".pf", start: "top 80%", once: true } });
    gsap.to(".pf img", { yPercent: -6, ease: "none", scrollTrigger: { trigger: ".pf", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------- كروت متراصة: اللي فات بيصغر لما اللي بعده يغطيه ---------- */
  var sks = $$(".sk");
  sks.forEach(function (c, i) {
    var inner = c.firstElementChild;
    gsap.from($(".sk-ic", inner), { scale: 0.3, rotate: -120, duration: 1.2, ease: "back.out(1.8)", scrollTrigger: { trigger: c, start: "top 85%", once: true } });
    gsap.from($(".sk-n", inner), { yPercent: 60, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 85%", once: true } });
    var next = sks[i + 1];
    if (next && next.parentNode == c.parentNode)
      gsap.fromTo(inner, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.9, filter: "brightness(0.55)", ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top 25%", scrub: true },
      });
  });

  /* ---------- MARQUEE: سرعته واتجاهه حسب السكرول ---------- */
  if ($(".mq")) {
    var loops = $$(".mq-t").map(function (tr, i) {
      var tw = gsap.fromTo(tr, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: 40, ease: "none", repeat: -1 });
      tw.totalTime(tw.duration() * 50); /* نبدأ من نقطة بعيدة عشان الرجوع لورا يشتغل */
      return tw;
    });
    var speed = { v: 1 };
    var applySpeed = function () { loops.forEach(function (tw) { tw.timeScale(speed.v); }); };
    ScrollTrigger.create({
      trigger: ".mq", start: "top bottom", end: "bottom top",
      onUpdate: function (s) {
        var v = s.getVelocity() / 250;
        speed.v = Math.abs(v) < 1 ? s.direction : gsap.utils.clamp(-8, 8, v);
        applySpeed();
        gsap.to(speed, { v: s.direction, duration: 1.2, ease: "power2.out", overwrite: true, onUpdate: applySpeed });
      },
    });
    gsap.from(".mq-row", { xPercent: function (i) { return i ? 30 : -30; }, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".mq", start: "top 85%", once: true } });
  }

  /* ---------- BENTO ---------- */
  if ($(".gal")) {
    gsap.from(".gt", {
      clipPath: "inset(100% 0% 0% 0% round 22px)", duration: 1.1, ease: "expo.inOut", stagger: { each: 0.1, from: "random" }, clearProps: "clipPath",
      scrollTrigger: { trigger: ".gal", start: "top 80%", once: true },
    });
    gsap.from(".gt .gi", { scale: 0, rotate: -90, duration: 1, ease: "back.out(2)", stagger: 0.08, delay: 0.5, scrollTrigger: { trigger: ".gal", start: "top 80%", once: true } });
    if (fine)
      $$(".gt").forEach(function (g) {
        gsap.set(g, { transformPerspective: 800 });
        var rx = gsap.quickTo(g, "rotationX", { duration: 0.5, ease: "power3" }),
          ry = gsap.quickTo(g, "rotationY", { duration: 0.5, ease: "power3" });
        g.addEventListener("pointermove", function (e) {
          var r = g.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 14);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 14);
        });
        g.addEventListener("pointerleave", function () { rx(0); ry(0); });
      });
  }

  /* ---------- مدار البرامج ---------- */
  if ($(".orbit")) {
    gsap.to(".orb-ring", { rotation: 360, duration: 40, ease: "none", repeat: -1 });
    gsap.to(".orb-i", { rotation: -360, duration: 40, ease: "none", repeat: -1 });
    gsap.from(".orb-i", { scale: 0, duration: 0.9, ease: "back.out(2)", stagger: 0.1, scrollTrigger: { trigger: ".orbit", start: "top 80%", once: true } });
  }

  /* ---------- خط المحاور + مسار المنهجية ---------- */
  $$(".tl").forEach(function (tl) {
    gsap.fromTo($(".tl-fill", tl), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 70%", end: "bottom 70%", scrub: true } });
    $$("li", tl).forEach(function (li) {
      ScrollTrigger.create({ trigger: li, start: "top 70%", onEnter: function () { li.classList.add("on"); }, onLeaveBack: function () { li.classList.remove("on"); } });
      gsap.from($("span", li), { x: root.dir == "rtl" ? -40 : 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 88%", once: true } });
    });
  });
  $$(".path").forEach(function (pth) {
    gsap.fromTo($(".path-fill", pth), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: pth, start: "top 80%", end: "bottom 55%", scrub: true } });
  });

  /* ---------- مؤشر التاب اللي بيتزحلق ---------- */
  var tabsList = $$(".tabs");
  tabsList.forEach(function (tabs) {
    var ind = document.createElement("span");
    ind.className = "tab-ind";
    tabs.appendChild(ind);
  });
  tabFx = function (tabs, instant) {
    var on = $(".tab.on", tabs), ind = $(".tab-ind", tabs);
    if (on && ind) gsap.to(ind, { x: on.offsetLeft, y: on.offsetTop, width: on.offsetWidth, height: on.offsetHeight, duration: instant ? 0 : 0.6, ease: "power3.inOut" });
  };
  function placeTabs() { tabsList.forEach(function (tb) { tabFx(tb, true); }); }
  placeTabs();
  langHooks.push(placeTabs);
  addEventListener("resize", placeTabs);
  if (document.fonts) document.fonts.ready.then(function () { placeTabs(); ScrollTrigger.refresh(); });

  /* ---------- FOOTER: أعمدة الهوية + المربعات ---------- */
  gsap.from(".bars i", {
    scaleY: 0, ease: "none", stagger: 0.12,
    scrollTrigger: { trigger: ".ft", start: "top bottom", end: "top 55%", scrub: 1 },
  });
  if ($(".px-deco"))
    gsap.from(".px-deco rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.1, from: "random" }, scrollTrigger: { trigger: ".px-deco", start: "top 80%", once: true } });

  /* ---------- إضاءة تتبع الماوس على الكروت ---------- */
  if (fine) {
    $$(".gt, .vmc, .sk-in, .card, .ac, .pd-card, .nxt").forEach(function (el) {
      el.classList.add("spot");
      el.insertAdjacentHTML("afterbegin", '<i class="sp" aria-hidden="true"></i>');
    });
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--x", e.clientX - r.left + "px");
      el.style.setProperty("--y", e.clientY - r.top + "px");
    });
  }

  /* ---------- أزرار مغناطيسية ---------- */
  if (fine)
    $$(".chy-btn:not(.is-soon), .lang").forEach(function (b) {
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
    var cur = document.createElement("div");
    cur.className = "cur";
    cur.setAttribute("aria-hidden", "true");
    body.appendChild(cur);
    var cx = gsap.quickTo(cur, "x", { duration: 0.45, ease: "power3" }),
      cy = gsap.quickTo(cur, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", function (e) {
      cur.classList.add("on");
      cx(e.clientX); cy(e.clientY);
      cur.classList.toggle("h", !!(e.target.closest && e.target.closest("a:not(.is-soon), button, .gt, input, textarea, select")));
    });
    root.addEventListener("pointerleave", function () { cur.classList.remove("on"); });
  }
})();
