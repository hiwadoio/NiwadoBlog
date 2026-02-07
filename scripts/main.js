(() => {
    'use strict';

    const throttleRAF = (fn) => {
        let rafId = null;
        return (...args) => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                fn(...args);
                rafId = null;
            });
        };
    };

    let bodyScrollLockY = null;
    let bodyScrollLockCount = 0;
    const topbarEl = document.querySelector('.topbar');
    const asideEl = document.querySelector('.aside');

    if (topbarEl && !document.querySelector('.main-scroll-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'main-scroll-wrap';
        let el = topbarEl.nextElementSibling;
        while (el) {
            const next = el.nextElementSibling;
            if (!el.matches('.search-popup, .lightbox')) wrap.appendChild(el);
            el = next;
        }
        topbarEl.after(wrap);
    }

    const getScrollbarWidth = () => Math.round(window.innerWidth - document.documentElement.clientWidth);

    const lockBodyScroll = () => {
        bodyScrollLockCount += 1;
        if (bodyScrollLockCount > 1) return;
        bodyScrollLockY = Math.round(window.scrollY);
        const wrap = document.querySelector('.main-scroll-wrap');
        if (wrap && topbarEl) {
            const top = Math.round(topbarEl.offsetHeight - bodyScrollLockY);
            const sb = getScrollbarWidth();
            document.body.style.minHeight = `${document.documentElement.scrollHeight}px`;
            document.body.style.overflow = document.documentElement.style.overflow = 'hidden';
            document.body.classList.add('scroll-lock');
            if (sb > 0) {
                document.body.style.paddingRight = topbarEl.style.paddingRight = `${sb}px`;
                if (asideEl) asideEl.style.transform = `translateX(-${sb}px)`;
            }
            wrap.style.cssText = `position:fixed;top:${top}px;left:0;right:0;width:100%;bottom:0;overflow:hidden;z-index:100;box-sizing:border-box${sb > 0 ? `;padding-right:${sb}px` : ''}`;
        } else {
            document.body.classList.add('scroll-lock');
            Object.assign(document.body.style, {
                position: 'fixed', top: `-${bodyScrollLockY}px`, left: '0', right: '0', width: '100%', overflow: 'hidden'
            });
        }
    };

    const BODY_STYLE_KEYS = ['minHeight', 'paddingRight', 'overflow', 'position', 'top', 'left', 'right', 'width'];
    const unlockBodyScroll = () => {
        if (bodyScrollLockCount === 0) return;
        bodyScrollLockCount -= 1;
        if (bodyScrollLockCount > 0) return;
        const y = bodyScrollLockY;
        bodyScrollLockY = null;
        document.body.classList.remove('scroll-lock');
        document.documentElement.style.overflow = '';
        const wrap = document.querySelector('.main-scroll-wrap');
        if (wrap) wrap.style.cssText = '';
        for (const k of BODY_STYLE_KEYS) document.body.style[k] = '';
        if (topbarEl) topbarEl.style.paddingRight = '';
        if (asideEl) asideEl.style.transform = '';
        const prev = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, y);
        document.documentElement.style.scrollBehavior = prev;
    };

    const actionMenuEl = document.querySelector('.action-menu');
    document.addEventListener('click', (e) => {
        if (actionMenuEl?.hasAttribute('open') && !actionMenuEl.contains(e.target)) {
            actionMenuEl.removeAttribute('open');
        }
    });

    (function initCommentFormRulesToggle() {
        const KEY = 'commentFormRulesCollapsed';
        const block = document.getElementById('comment-hint');
        const btn = block?.querySelector('[data-comment-rules-toggle]');
        if (!block || !btn) return;
        const label = (c) => (c ? 'Развернуть правила' : 'Свернуть правила');
        const isCollapsed = localStorage.getItem(KEY) === 'true';
        block.classList.toggle('is-collapsed', isCollapsed);
        btn.setAttribute('aria-expanded', String(!isCollapsed));
        btn.setAttribute('aria-label', label(isCollapsed));
        btn.addEventListener('click', () => {
            const collapsed = block.classList.toggle('is-collapsed');
            localStorage.setItem(KEY, String(collapsed));
            btn.setAttribute('aria-expanded', String(!collapsed));
            btn.setAttribute('aria-label', label(collapsed));
        });
    })();

    const scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const handleScroll = throttleRAF(() => {
            scrollTopBtn.classList.toggle('is-visible', window.scrollY > 200);
        });

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.rating-btn');
        if (!btn) return;

        const ratingBlock = btn.closest('.card-rating');
        const valueElement = ratingBlock?.querySelector('.rating-value');
        if (!ratingBlock || !valueElement) return;

        const wasUpActive = ratingBlock.querySelector('.rating-up')?.classList.contains('is-active') ?? false;
        const wasDownActive = ratingBlock.querySelector('.rating-down')?.classList.contains('is-active') ?? false;

        let currentValue = parseInt(valueElement.textContent, 10) || 0;
        const action = btn.dataset.action;
        const isActive = btn.classList.contains('is-active');

        ratingBlock.querySelectorAll('.rating-btn').forEach((b) => b.classList.remove('is-active'));
        const delta = action === 'up' ? (isActive ? -1 : (wasDownActive ? 2 : 1)) : (isActive ? 1 : -(wasUpActive ? 2 : 1));
        currentValue += delta;
        if (!isActive) btn.classList.add('is-active');
        valueElement.textContent = currentValue;
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.comment-reply-btn[data-reply-trigger]');
        if (!btn) return;

        const actions = btn.closest('.comment-actions');
        const commentBody = btn.closest('.comment-body');
        if (!actions || !commentBody) return;

        const template = document.getElementById('comment-reply-form-template');
        if (!template?.content) return;

        const existing = commentBody.querySelector('.comment-reply-form');
        if (existing) {
            existing.remove();
            return;
        }

        const clone = template.content.cloneNode(true);
        (btn.closest('.comment-actions-row') || actions).after(clone);
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.comment-toggle-btn[data-comment-toggle], .comment-branch-toggle-btn[data-branch-toggle]');
        if (!btn) return;
        const item = btn.closest('.comments-feed-item');
        if (!item) return;
        const isBranch = btn.matches('[data-branch-toggle]');
        const cls = isBranch ? 'is-branch-collapsed' : 'is-collapsed';
        const [openL, closeL] = isBranch ? ['Развернуть ветку', 'Свернуть ветку'] : ['Развернуть комментарий', 'Свернуть комментарий'];
        item.classList.toggle(cls);
        const label = item.classList.contains(cls) ? openL : closeL;
        btn.setAttribute('aria-label', label);
        const tip = btn.closest('.comment-toggle-wrap')?.querySelector('.comment-toggle-tooltip');
        if (tip) tip.textContent = label;
    });

    (function initCommentRatingStyles() {
        const list = document.querySelector('.comments-feed-list');
        if (!list) return;

        const createHighRatingBadge = () => {
            const wrap = document.createElement('span');
            wrap.className = 'comment-high-rating-wrap';
            const tooltip = document.createElement('span');
            tooltip.className = 'comment-high-rating-tooltip';
            tooltip.setAttribute('aria-hidden', 'true');
            tooltip.textContent = 'Полезный комментарий';
            const iconWrap = document.createElement('span');
            iconWrap.className = 'comment-high-rating-icon';
            iconWrap.setAttribute('aria-hidden', 'true');
            iconWrap.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-thumb-up"/></svg>';
            wrap.append(tooltip, iconWrap);
            return wrap;
        };

        const wrapWithLowRatingVeil = (textEl) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'comments-feed-text-wrapper';
            const veil = document.createElement('span');
            veil.className = 'comment-text-veil';
            veil.setAttribute('role', 'button');
            veil.setAttribute('tabindex', '0');
            veil.setAttribute('aria-label', 'Показать комментарий');
            const icon = document.createElement('span');
            icon.className = 'icon icon--sm comment-text-veil-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><use href="#icon-eye"/></svg>';
            veil.appendChild(icon);
            textEl.parentNode.insertBefore(wrapper, textEl);
            wrapper.append(veil, textEl);
            return wrapper;
        };

        list.querySelectorAll('.comments-feed-item').forEach((item) => {
            const valueEl = item.querySelector('.comment-rating-value');
            if (!valueEl) return;
            const raw = (valueEl.textContent || '').trim().replace(/\u2212/g, '-');
            const rating = parseInt(raw, 10);
            if (!Number.isFinite(rating)) return;

            if (rating >= 5 && !item.classList.contains('comments-feed-item--author')) {
                item.classList.add('comments-feed-item--high-rating');
                const meta = item.querySelector('.comments-feed-meta');
                const authorLink = meta?.querySelector('.comment-author-link');
                if (meta && !meta.querySelector('.comment-high-rating-icon')) {
                    meta.insertBefore(createHighRatingBadge(), authorLink?.nextSibling ?? meta.firstChild);
                }
            }

            if (rating <= -3) {
                item.classList.add('comments-feed-item--low-rating');
                if (!item.querySelector('.comments-feed-text-wrapper')) {
                    const textEl = item.querySelector('.comments-feed-text');
                    if (textEl) wrapWithLowRatingVeil(textEl);
                }
            }
        });
    })();

    document.addEventListener('click', (e) => {
        const option = e.target.closest('.comments-feed-sort-option');
        if (option) {
            e.preventDefault();
            const dropdown = option.closest('.comments-feed-sort-dropdown');
            const triggerText = dropdown?.querySelector('.comments-feed-sort-trigger-text');
            if (!dropdown || !triggerText) return;
            triggerText.textContent = option.textContent.trim();
            dropdown.querySelectorAll('.comments-feed-sort-option').forEach((o) => o.classList.remove('is-active'));
            option.classList.add('is-active');
            dropdown.removeAttribute('open');
            return;
        }
        const openDropdown = document.querySelector('.comments-feed-sort-dropdown[open]');
        if (openDropdown && !openDropdown.contains(e.target)) openDropdown.removeAttribute('open');
    });

    const revealVeil = (target) => {
        const item = target?.closest('.comment-text-veil')?.closest('.comments-feed-item');
        if (item) item.classList.add('is-revealed');
    };
    document.addEventListener('click', (e) => revealVeil(e.target));
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.comment-text-veil')) {
            e.preventDefault();
            revealVeil(e.target);
        }
    });

    const closeCardTagsPopup = (popup, trigger) => {
        if (document.activeElement && popup.contains(document.activeElement)) trigger.focus();
        popup.setAttribute('hidden', '');
        trigger.setAttribute('aria-expanded', 'false');
    };

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.card-tags-trigger');
        if (trigger) {
            e.stopPropagation();
            const mobile = trigger.closest('.card-tags-mobile');
            const popup = mobile?.querySelector('.card-tags-popup');
            const tagsSource = trigger.closest('.card-footer')?.querySelector('.card-footer-tags');
            if (!popup || !tagsSource) return;

            if (trigger.getAttribute('aria-expanded') === 'true') {
                closeCardTagsPopup(popup, trigger);
            } else {
                document.querySelectorAll('.card-tags-popup').forEach((p) => p.setAttribute('hidden', ''));
                document.querySelectorAll('.card-tags-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
                popup.innerHTML = '';
                tagsSource.querySelectorAll('a.tag').forEach((a) => popup.appendChild(a.cloneNode(true)));
                popup.removeAttribute('hidden');
                trigger.setAttribute('aria-expanded', 'true');
            }
            return;
        }
        const openPopup = document.querySelector('.card-tags-popup:not([hidden])');
        if (openPopup) {
            const mobile = openPopup.closest('.card-tags-mobile');
            const t = mobile?.querySelector('.card-tags-trigger');
            if (t && !mobile?.contains(e.target)) closeCardTagsPopup(openPopup, t);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        let closed = false;
        const cardTagsTrigger = document.querySelector('.card-tags-trigger[aria-expanded="true"]');
        if (cardTagsTrigger) {
            const popup = cardTagsTrigger.closest('.card-tags-mobile')?.querySelector('.card-tags-popup');
            if (popup) {
                closeCardTagsPopup(popup, cardTagsTrigger);
                closed = true;
            }
        } else if (searchPopup?.getAttribute('aria-hidden') === 'false') {
            closeSearchPopup();
            closed = true;
        } else if (lightbox?.getAttribute('aria-hidden') === 'false') {
            closeLightbox();
            closed = true;
        }
        if (closed) e.preventDefault();
    });

    document.addEventListener('click', (e) => {
        const tagLink = e.target.closest('.card-tags-popup a.tag');
        if (tagLink) {
            const popup = tagLink.closest('.card-tags-popup');
            const trigger = popup?.closest('.card-tags-mobile')?.querySelector('.card-tags-trigger');
            if (trigger) closeCardTagsPopup(popup, trigger);
        }
    });

    const searchPopup = document.querySelector('.search-popup');
    const searchPopupClose = document.querySelector('.search-popup-close');
    const searchPopupInput = document.querySelector('.search-popup-input');
    const searchPopupOverlay = document.querySelector('.search-popup-overlay');
    const searchPopupForm = document.querySelector('.search-popup-form');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxBackdrop = document.querySelector('.lightbox-backdrop');
    let lightboxOpener = null;
    let lightboxOpenerTabindex = null;

    const closeSearchPopup = () => {
        if (searchPopup) {
            const searchTrigger = document.querySelector('[data-search-trigger]');
            if (searchTrigger) searchTrigger.focus({ preventScroll: true });
            searchPopup.setAttribute('aria-hidden', 'true');
            searchPopup.setAttribute('inert', '');
        }
        unlockBodyScroll();
    };

    const closeLightbox = () => {
        const opener = lightboxOpener;
        const savedTabindex = lightboxOpenerTabindex;
        lightboxOpener = null;
        lightboxOpenerTabindex = null;
        if (lightbox) lightbox.setAttribute('aria-hidden', 'true');
        if (lightboxImg) lightboxImg.removeAttribute('src');
        unlockBodyScroll();
        if (opener) {
            if (savedTabindex != null) opener.setAttribute('tabindex', savedTabindex);
            else opener.removeAttribute('tabindex');
            opener.focus?.();
        }
    };

    if (searchPopup) {
        const openPopup = () => {
            lockBodyScroll();
            searchPopup.setAttribute('aria-hidden', 'false');
            searchPopup.removeAttribute('inert');

            if (actionMenuEl?.hasAttribute('open')) actionMenuEl.removeAttribute('open');

            if (searchPopupInput) {
                setTimeout(() => searchPopupInput.focus({ preventScroll: true }), 100);
            }
        };

        document.addEventListener('click', (e) => {
            const searchTrigger = e.target.closest('[data-search-trigger]');
            if (!searchTrigger) return;
            e.preventDefault();
            (searchPopup.getAttribute('aria-hidden') === 'true' ? openPopup : closeSearchPopup)();
        });

        [searchPopupClose, searchPopupOverlay].forEach((el) => el?.addEventListener('click', closeSearchPopup));

        if (searchPopupForm && searchPopupInput) {
            searchPopupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchPopupInput.value.trim();
                if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
            });
        }
    }

    if (lightbox && lightboxImg) {
        const openLightbox = (src, opener) => {
            lockBodyScroll();
            lightboxOpener = opener || null;
            lightboxOpenerTabindex = opener ? opener.getAttribute('tabindex') : null;
            if (opener) opener.setAttribute('tabindex', '-1');
            lightboxImg.src = src;
            lightboxImg.alt = '';
            lightbox.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => lightboxImg.focus());
        };

        document.addEventListener('click', (e) => {
            const cardImage = e.target.closest('.card-image');
            if (!cardImage) return;
            const img = cardImage.querySelector('img');
            if (!img?.src) return;
            e.preventDefault();
            openLightbox(img.src, cardImage);
        });

        if (lightboxBackdrop) {
            lightboxBackdrop.addEventListener('click', closeLightbox);
        }
    }

    const ASIDE_WIDGETS_STORAGE_KEY = 'niwado-aside-widgets-open';

    const getWidgetKey = (el) => el.className.match(/widget--([a-z0-9_-]+)/i)?.[1] ?? null;

    const readAsideWidgetsState = () => {
        try {
            return JSON.parse(localStorage.getItem(ASIDE_WIDGETS_STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    };

    const saveAsideWidgetsState = (asideContainer) => {
        if (!asideContainer) return;
        const state = {};
        asideContainer.querySelectorAll('.widget').forEach((details) => {
            const key = getWidgetKey(details);
            if (key) state[key] = details.hasAttribute('open');
        });
        try {
            localStorage.setItem(ASIDE_WIDGETS_STORAGE_KEY, JSON.stringify(state));
        } catch (_) { }
    };

    if (asideEl) {
        const stored = readAsideWidgetsState();
        asideEl.querySelectorAll('.widget').forEach((details) => {
            const key = getWidgetKey(details);
            if (key && stored[key] !== undefined) {
                details.toggleAttribute('open', stored[key]);
            }
            details.addEventListener('toggle', () => saveAsideWidgetsState(asideEl));
        });
    }

    (function initProfileActivityTabs() {
        const section = document.querySelector('.profile-activity-tabs');
        const tabPosts = document.getElementById('profile-tab-posts');
        const tabComments = document.getElementById('profile-tab-comments');
        if (!section || !tabPosts || !tabComments) return;
        const setTab = (posts) => {
            section.classList.toggle('profile-activity-tabs--posts', posts);
            section.classList.toggle('profile-activity-tabs--comments', !posts);
            tabPosts.setAttribute('aria-selected', String(posts));
            tabComments.setAttribute('aria-selected', String(!posts));
        };
        section.classList.add('profile-activity-tabs--posts');
        tabPosts.addEventListener('click', () => setTab(true));
        tabComments.addEventListener('click', () => setTab(false));
    })();
})();