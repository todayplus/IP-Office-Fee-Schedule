/* =========================================================
   특허청 수수료정보안내 - 메인 스크립트
   기능: 테마전환, 검색, 즐겨찾기, TOC, 글자크기, 맨위로, 인쇄
   ========================================================= */
(function () {
    'use strict';

    var LS_THEME = 'fee_theme';
    var LS_FAV = 'fee_favorites';
    var LS_FONT = 'fee_font_scale';

    var body = document.body;
    var sections = Array.prototype.slice.call(document.querySelectorAll('.fee-section'));

    /* ---------------------------------------------------
       1) 테마 전환 (화이트 / 아이보리 / 블랙)
    --------------------------------------------------- */
    function applyTheme(theme) {
        body.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-btn').forEach(function (btn) {
            var isActive = btn.getAttribute('data-theme') === theme;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        try { localStorage.setItem(LS_THEME, theme); } catch (e) {}
    }

    document.querySelectorAll('.theme-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            applyTheme(btn.getAttribute('data-theme'));
        });
    });

    (function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem(LS_THEME); } catch (e) {}
        if (saved === 'white' || saved === 'ivory' || saved === 'black') {
            applyTheme(saved);
        } else {
            applyTheme('white');
        }
    })();

    /* ---------------------------------------------------
       2) 글자 크기 조절
    --------------------------------------------------- */
    var fontScale = 1;
    function applyFontScale() {
        document.documentElement.style.setProperty('--font-scale', fontScale.toFixed(2));
        try { localStorage.setItem(LS_FONT, String(fontScale)); } catch (e) {}
    }
    (function initFont() {
        var saved = null;
        try { saved = parseFloat(localStorage.getItem(LS_FONT)); } catch (e) {}
        if (!isNaN(saved) && saved >= 0.85 && saved <= 1.3) {
            fontScale = saved;
        }
        applyFontScale();
    })();
    var fontUpBtn = document.getElementById('fontUpBtn');
    var fontDownBtn = document.getElementById('fontDownBtn');
    if (fontUpBtn) fontUpBtn.addEventListener('click', function () {
        fontScale = Math.min(1.3, fontScale + 0.1);
        applyFontScale();
    });
    if (fontDownBtn) fontDownBtn.addEventListener('click', function () {
        fontScale = Math.max(0.85, fontScale - 0.1);
        applyFontScale();
    });

    /* ---------------------------------------------------
       3) TOC(목차) 자동 생성 + 활성 항목 추적 + 모바일 토글
    --------------------------------------------------- */
    var tocList = document.getElementById('tocList');
    var tocLinks = [];
    sections.forEach(function (sec) {
        var title = sec.getAttribute('data-title') || sec.querySelector('h2').textContent.trim();
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + sec.id;
        a.textContent = title;
        a.dataset.target = sec.id;
        li.appendChild(a);
        tocList.appendChild(li);
        tocLinks.push(a);

        a.addEventListener('click', function (e) {
            closeTocMobile();
        });
    });

    function setActiveToc(id) {
        tocLinks.forEach(function (a) {
            a.classList.toggle('active', a.dataset.target === id);
        });
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                setActiveToc(entry.target.id);
            }
        });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (sec) { observer.observe(sec); });

    var tocNav = document.getElementById('tocNav');
    var tocOverlay = document.getElementById('tocOverlay');
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var tocCloseBtn = document.getElementById('tocCloseBtn');

    function openTocMobile() {
        tocNav.classList.add('open');
        tocOverlay.hidden = false;
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }
    function closeTocMobile() {
        tocNav.classList.remove('open');
        tocOverlay.hidden = true;
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', function () {
        if (tocNav.classList.contains('open')) closeTocMobile();
        else openTocMobile();
    });
    if (tocCloseBtn) tocCloseBtn.addEventListener('click', closeTocMobile);
    if (tocOverlay) tocOverlay.addEventListener('click', closeTocMobile);

    /* ---------------------------------------------------
       4) 인쇄
    --------------------------------------------------- */
    var printLink = document.getElementById('printLink');
    if (printLink) {
        printLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.print();
        });
    }

    /* ---------------------------------------------------
       5) 즐겨찾기 (localStorage)
    --------------------------------------------------- */
    function getFavorites() {
        try {
            var raw = localStorage.getItem(LS_FAV);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }
    function saveFavorites(list) {
        try { localStorage.setItem(LS_FAV, JSON.stringify(list)); } catch (e) {}
    }

    var favToggleBtn = document.getElementById('favToggleBtn');
    var favPanel = document.getElementById('favPanel');
    var favOverlay = document.getElementById('favOverlay');
    var favPanelClose = document.getElementById('favPanelClose');
    var favList = document.getElementById('favList');
    var favCountEl = document.getElementById('favCount');

    function updateFavStars() {
        var favs = getFavorites();
        var favIds = favs.map(function (f) { return f.id; });
        document.querySelectorAll('.fee-section').forEach(function (sec) {
            var starBtn = sec.querySelector('.fav-star');
            if (!starBtn) return;
            var isFav = favIds.indexOf(sec.id) !== -1;
            starBtn.classList.toggle('active', isFav);
            var icon = starBtn.querySelector('i');
            if (icon) icon.className = isFav ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
        favCountEl.textContent = String(favs.length);
        favCountEl.hidden = favs.length === 0;
    }

    function renderFavList() {
        var favs = getFavorites();
        favList.innerHTML = '';
        if (favs.length === 0) {
            var emptyLi = document.createElement('li');
            emptyLi.className = 'fav-empty';
            emptyLi.innerHTML = '즐겨찾기한 항목이 없습니다.<br>각 항목 제목 옆의 <i class="fa-regular fa-star"></i> 버튼을 눌러 추가해 보세요.';
            favList.appendChild(emptyLi);
            return;
        }
        favs.forEach(function (f) {
            var li = document.createElement('li');
            var item = document.createElement('div');
            item.className = 'fav-item';
            var a = document.createElement('a');
            a.href = '#' + f.id;
            a.textContent = f.title;
            a.addEventListener('click', function () {
                closeFavPanel();
            });
            var delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.setAttribute('aria-label', '즐겨찾기 삭제: ' + f.title);
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.addEventListener('click', function () {
                toggleFavorite(f.id, f.title, true);
            });
            item.appendChild(a);
            item.appendChild(delBtn);
            li.appendChild(item);
            favList.appendChild(li);
        });
    }

    function toggleFavorite(id, title, forceRemove) {
        var favs = getFavorites();
        var idx = favs.findIndex(function (f) { return f.id === id; });
        if (idx !== -1 || forceRemove) {
            if (idx !== -1) favs.splice(idx, 1);
        } else {
            favs.push({ id: id, title: title });
        }
        saveFavorites(favs);
        updateFavStars();
        renderFavList();
    }

    document.querySelectorAll('.fav-star').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var sec = btn.closest('.fee-section');
            var title = sec.getAttribute('data-title') || sec.querySelector('h2').textContent.trim();
            toggleFavorite(sec.id, title);
        });
    });

    function openFavPanel() {
        favPanel.hidden = false;
        favOverlay.hidden = false;
        favToggleBtn.setAttribute('aria-expanded', 'true');
        favToggleBtn.classList.add('active');
        renderFavList();
    }
    function closeFavPanel() {
        favPanel.hidden = true;
        favOverlay.hidden = true;
        favToggleBtn.setAttribute('aria-expanded', 'false');
        favToggleBtn.classList.remove('active');
    }
    if (favToggleBtn) favToggleBtn.addEventListener('click', function () {
        if (favPanel.hidden) openFavPanel();
        else closeFavPanel();
    });
    if (favPanelClose) favPanelClose.addEventListener('click', closeFavPanel);
    if (favOverlay) favOverlay.addEventListener('click', closeFavPanel);

    updateFavStars();

    /* ---------------------------------------------------
       6) 검색 (제목/본문 텍스트 대상, 하이라이트 + 표시/숨김)
    --------------------------------------------------- */
    var searchInput = document.getElementById('searchInput');
    var searchBox = document.querySelector('.search-box');
    var searchClearBtn = document.getElementById('searchClearBtn');
    var searchStatusBar = document.getElementById('searchStatusBar');
    var searchStatusText = document.getElementById('searchStatusText');
    var searchStatusClose = document.getElementById('searchStatusClose');
    var noResultsEl = document.getElementById('noResults');

    // 검색 대상이 될 최소 블록 단위를 미리 수집 (h3 + 그 다음 형제들을 그룹으로 취급하지 않고,
    // 섹션 전체에서 텍스트 매칭 여부로 섹션 표시/숨김을 결정하는 단순하고 안전한 방식 사용)
    var originalHTML = {};
    sections.forEach(function (sec) {
        originalHTML[sec.id] = sec.innerHTML;
    });

    function clearHighlights(sec) {
        sec.innerHTML = originalHTML[sec.id];
        // 이벤트 재바인딩 (fav-star, 클릭 등)
        rebindSection(sec);
    }

    function rebindSection(sec) {
        var starBtn = sec.querySelector('.fav-star');
        if (starBtn) {
            starBtn.addEventListener('click', function () {
                var title = sec.getAttribute('data-title') || sec.querySelector('h2').textContent.trim();
                toggleFavorite(sec.id, title);
            });
        }
        updateFavStars();
    }

    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(root, keyword) {
        var regex = new RegExp('(' + escapeRegExp(keyword) + ')', 'gi');
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var nodes = [];
        var node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.trim() === '') continue;
            if (node.parentNode.closest('script,style')) continue;
            nodes.push(node);
        }
        nodes.forEach(function (n) {
            if (!regex.test(n.nodeValue)) { regex.lastIndex = 0; return; }
            regex.lastIndex = 0;
            var frag = document.createDocumentFragment();
            var lastIndex = 0;
            var match;
            var text = n.nodeValue;
            while ((match = regex.exec(text))) {
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                var mark = document.createElement('mark');
                mark.className = 'search-hit';
                mark.textContent = match[0];
                frag.appendChild(mark);
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            n.parentNode.replaceChild(frag, n);
        });
    }

    var searchDebounceTimer = null;
    function runSearch(keyword) {
        keyword = keyword.trim();
        var hasKeyword = keyword.length > 0;
        searchBox.classList.toggle('has-value', hasKeyword);

        if (!hasKeyword) {
            sections.forEach(function (sec) {
                clearHighlights(sec);
                sec.classList.remove('is-hidden-by-search');
            });
            searchStatusBar.hidden = true;
            noResultsEl.hidden = true;
            return;
        }

        var matchCount = 0;
        var lowerKw = keyword.toLowerCase();

        sections.forEach(function (sec) {
            clearHighlights(sec);
            var text = sec.textContent.toLowerCase();
            var isMatch = text.indexOf(lowerKw) !== -1;
            sec.classList.toggle('is-hidden-by-search', !isMatch);
            if (isMatch) {
                matchCount++;
                highlightText(sec, keyword);
            }
        });

        searchStatusBar.hidden = false;
        searchStatusText.textContent = '"' + keyword + '" 검색 결과: ' + matchCount + '개 항목에서 발견됨';
        noResultsEl.hidden = matchCount !== 0;
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchDebounceTimer);
            var value = searchInput.value;
            searchDebounceTimer = setTimeout(function () { runSearch(value); }, 200);
        });
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var firstVisible = sections.find(function (s) { return !s.classList.contains('is-hidden-by-search'); });
                if (firstVisible) {
                    firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            if (e.key === 'Escape') {
                searchInput.value = '';
                runSearch('');
                searchInput.blur();
            }
        });
    }
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', function () {
            searchInput.value = '';
            runSearch('');
            searchInput.focus();
        });
    }
    if (searchStatusClose) {
        searchStatusClose.addEventListener('click', function () {
            searchStatusBar.hidden = true;
        });
    }

    /* ---------------------------------------------------
       7) 맨 위로 버튼
    --------------------------------------------------- */
    var backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', function () {
        backToTopBtn.hidden = window.scrollY < 400;
    }, { passive: true });
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

})();
