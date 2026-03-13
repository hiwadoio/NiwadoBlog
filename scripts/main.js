(() => {
    'use strict';

    // Утилиты
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
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

    // Элементы
    const topbarEl = $('.topbar');
    const asideEl = $('.aside');
    const asideLeftEl = $('.aside-left');
    const pageEl = $('.page');
    const actionMenuEl = $('.action-menu');

    // Создание обёртки для контента - REMOVED


    // Блокировка скролла
    let scrollLockCount = 0;
    let savedScrollY = 0;
    const getScrollbarWidth = () => Math.round(window.innerWidth - document.documentElement.clientWidth);

    const lockScroll = () => {
        if (++scrollLockCount > 1) return;
        document.body.classList.add('scroll-lock');
        document.documentElement.classList.add('scroll-lock');
    };

    const unlockScroll = () => {
        if (scrollLockCount === 0 || --scrollLockCount > 0) return;
        document.body.classList.remove('scroll-lock');
        document.documentElement.classList.remove('scroll-lock');
    };

    const preventScroll = (e) => {
        if (document.body.classList.contains('scroll-lock')) {
            e.preventDefault();
        }
    };

    const preventKeys = (e) => {
        if (document.body.classList.contains('scroll-lock')) {
            if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
                e.preventDefault();
            }
        }
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventKeys, { passive: false });

    // Action menu
    document.addEventListener('click', (e) => {
        if (actionMenuEl?.hasAttribute('open') && !actionMenuEl.contains(e.target)) {
            actionMenuEl.removeAttribute('open');
        }
    });

    // Comment form rules toggle
    (() => {
        const block = $('#comment-hint');
        const btn = block?.querySelector('[data-comment-rules-toggle]');
        if (!block || !btn) return;
        const label = (c) => (c ? 'Развернуть правила' : 'Свернуть правила');
        const isCollapsed = localStorage.getItem('commentFormRulesCollapsed') === 'true';
        block.classList.toggle('is-collapsed', isCollapsed);
        btn.setAttribute('aria-expanded', String(!isCollapsed));
        btn.setAttribute('aria-label', label(isCollapsed));
        btn.addEventListener('click', () => {
            const collapsed = block.classList.toggle('is-collapsed');
            localStorage.setItem('commentFormRulesCollapsed', String(collapsed));
            btn.setAttribute('aria-expanded', String(!collapsed));
            btn.setAttribute('aria-label', label(collapsed));
        });
    })();

    // Scroll to top
    const scrollTopBtn = $('.scroll-top');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', throttleRAF(() => {
            scrollTopBtn.classList.toggle('is-visible', window.scrollY > 200);
        }), { passive: true });
    }

    // Rating
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.rating-btn');
        if (!btn) return;
        const ratingBlock = btn.closest('.card-rating');
        const valueEl = ratingBlock?.querySelector('.rating-value');
        if (!ratingBlock || !valueEl) return;

        const wasUp = ratingBlock.querySelector('.rating-up')?.classList.contains('is-active') ?? false;
        const wasDown = ratingBlock.querySelector('.rating-down')?.classList.contains('is-active') ?? false;
        let value = parseInt(valueEl.textContent, 10) || 0;
        const action = btn.dataset.action;
        const isActive = btn.classList.contains('is-active');

        ratingBlock.querySelectorAll('.rating-btn').forEach((b) => b.classList.remove('is-active'));
        const delta = action === 'up'
            ? (isActive ? -1 : (wasDown ? 2 : 1))
            : (isActive ? 1 : -(wasUp ? 2 : 1));
        if (!isActive) btn.classList.add('is-active');
        valueEl.textContent = value + delta;
    });

    // Comment handlers (reply, toggle, reveal)
    document.addEventListener('click', (e) => {
        const replyBtn = e.target.closest('.comment-reply-btn[data-reply-trigger]');
        if (replyBtn) {
            const commentBody = replyBtn.closest('.comment-body');
            const template = $('#comment-reply-form-template')?.content;
            if (commentBody && template) {
                const existing = commentBody.querySelector('.comment-reply-form');
                if (existing) {
                    existing.remove();
                } else {
                    (replyBtn.closest('.comment-actions-row') || replyBtn.closest('.comment-actions'))?.after(template.cloneNode(true));
                }
            }
            return;
        }

        const toggleBtn = e.target.closest('.comment-toggle-btn[data-comment-toggle], .comment-branch-toggle-btn[data-branch-toggle]');
        if (toggleBtn) {
            const item = toggleBtn.closest('.comments-feed-item');
            if (item) {
                const isBranch = toggleBtn.matches('[data-branch-toggle]');
                const cls = isBranch ? 'is-branch-collapsed' : 'is-collapsed';
                const [openL, closeL] = isBranch
                    ? ['Развернуть ветку', 'Свернуть ветку']
                    : ['Развернуть комментарий', 'Свернуть комментарий'];
                item.classList.toggle(cls);
                const label = item.classList.contains(cls) ? openL : closeL;
                toggleBtn.setAttribute('aria-label', label);
                const tip = toggleBtn.closest('.comment-toggle-wrap')?.querySelector('.comment-toggle-tooltip');
                if (tip) tip.textContent = label;
            }
            return;
        }

        const veil = e.target.closest('.comment-text-veil');
        if (veil) veil.closest('.comments-feed-item')?.classList.add('is-revealed');
    });

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.comment-text-veil')) {
            e.preventDefault();
            e.target.closest('.comments-feed-item')?.classList.add('is-revealed');
        }
    });

    // Comment rating styles
    (() => {
        const list = $('.comments-feed-list');
        if (!list) return;

        const createBadge = () => {
            const wrap = document.createElement('span');
            wrap.className = 'comment-high-rating-wrap';
            wrap.innerHTML = '<span class="comment-high-rating-tooltip" aria-hidden="true">Полезный комментарий</span><span class="comment-high-rating-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-thumb-up"/></svg></span>';
            return wrap;
        };

        const wrapWithVeil = (textEl) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'comments-feed-text-wrapper';
            wrapper.innerHTML = '<span class="comment-text-veil" role="button" tabindex="0" aria-label="Показать комментарий"><span class="icon icon--sm comment-text-veil-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><use href="#icon-eye"/></svg></span></span>';
            textEl.parentNode.insertBefore(wrapper, textEl);
            wrapper.appendChild(textEl);
        };

        $$('.comments-feed-item', list).forEach((item) => {
            const valueEl = item.querySelector('.comment-rating-value');
            if (!valueEl) return;
            const rating = parseInt((valueEl.textContent || '').trim().replace(/\u2212/g, '-'), 10);
            if (!Number.isFinite(rating)) return;

            if (rating >= 5 && !item.classList.contains('comments-feed-item--author')) {
                item.classList.add('comments-feed-item--high-rating');
                const meta = item.querySelector('.comments-feed-meta');
                if (meta && !meta.querySelector('.comment-high-rating-icon')) {
                    const authorLink = meta.querySelector('.comment-author-link');
                    meta.insertBefore(createBadge(), authorLink?.nextSibling ?? meta.firstChild);
                }
            }

            if (rating <= -3 && !item.querySelector('.comments-feed-text-wrapper')) {
                item.classList.add('comments-feed-item--low-rating');
                const textEl = item.querySelector('.comments-feed-text');
                if (textEl) wrapWithVeil(textEl);
            }
        });
    })();

    // Comment sort
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.comments-feed-sort-option');
        if (option) {
            e.preventDefault();
            const dropdown = option.closest('.comments-feed-sort-dropdown');
            const triggerText = dropdown?.querySelector('.comments-feed-sort-trigger-text');
            if (dropdown && triggerText) {
                triggerText.textContent = option.textContent.trim();
                $$('.comments-feed-sort-option', dropdown).forEach((o) => o.classList.remove('is-active'));
                option.classList.add('is-active');
                dropdown.removeAttribute('open');
            }
            return;
        }
        const openDropdown = $('.comments-feed-sort-dropdown[open]');
        if (openDropdown && !openDropdown.contains(e.target)) openDropdown.removeAttribute('open');
    });

    // Card tags popup
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
            if (popup && tagsSource) {
                if (trigger.getAttribute('aria-expanded') === 'true') {
                    closeCardTagsPopup(popup, trigger);
                } else {
                    $$('.card-tags-popup').forEach((p) => p.setAttribute('hidden', ''));
                    $$('.card-tags-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
                    popup.innerHTML = '';
                    $$('a.tag', tagsSource).forEach((a) => popup.appendChild(a.cloneNode(true)));
                    popup.removeAttribute('hidden');
                    trigger.setAttribute('aria-expanded', 'true');
                }
            }
            return;
        }

        const tagLink = e.target.closest('.card-tags-popup a.tag');
        if (tagLink) {
            const popup = tagLink.closest('.card-tags-popup');
            const trigger = popup?.closest('.card-tags-mobile')?.querySelector('.card-tags-trigger');
            if (trigger) {
                closeCardTagsPopup(popup, trigger);
                return;
            }
        }

        const openPopup = $('.card-tags-popup:not([hidden])');
        if (openPopup) {
            const mobile = openPopup.closest('.card-tags-mobile');
            const t = mobile?.querySelector('.card-tags-trigger');
            if (t && !mobile?.contains(e.target)) closeCardTagsPopup(openPopup, t);
        }
    });

    // Modals (search, lightbox)
    const searchPopup = $('.search-popup');
    const searchPopupInput = $('.search-popup-input');
    const searchPopupForm = $('.search-popup-form');
    const lightbox = $('#lightbox');
    const lightboxImg = $('.lightbox-img');
    let lightboxOpener = null;
    let lightboxOpenerTabindex = null;

    const closeSearchPopup = () => {
        if (searchPopup) {
            $('[data-search-trigger]')?.focus({ preventScroll: true });
            searchPopup.setAttribute('aria-hidden', 'true');
            searchPopup.setAttribute('inert', '');
        }
        unlockScroll();
    };

    const closeLightbox = () => {
        const opener = lightboxOpener;
        const savedTabindex = lightboxOpenerTabindex;
        lightboxOpener = null;
        lightboxOpenerTabindex = null;
        if (lightbox) lightbox.setAttribute('aria-hidden', 'true');
        if (lightboxImg) lightboxImg.removeAttribute('src');
        unlockScroll();
        if (opener) {
            if (savedTabindex != null) opener.setAttribute('tabindex', savedTabindex);
            else opener.removeAttribute('tabindex');
            opener.focus?.();
        }
    };

    // Escape key для модалок
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const cardTagsTrigger = $('.card-tags-trigger[aria-expanded="true"]');
        if (cardTagsTrigger) {
            const popup = cardTagsTrigger.closest('.card-tags-mobile')?.querySelector('.card-tags-popup');
            if (popup) {
                closeCardTagsPopup(popup, cardTagsTrigger);
                e.preventDefault();
                return;
            }
        }
        if (searchPopup?.getAttribute('aria-hidden') === 'false') {
            closeSearchPopup();
            e.preventDefault();
        } else if (lightbox?.getAttribute('aria-hidden') === 'false') {
            closeLightbox();
            e.preventDefault();
        }
    });

    // Search popup
    if (searchPopup) {
        const openPopup = () => {
            lockScroll();
            requestAnimationFrame(() => {
                searchPopup.setAttribute('aria-hidden', 'false');
                searchPopup.removeAttribute('inert');
                if (actionMenuEl?.hasAttribute('open')) actionMenuEl.removeAttribute('open');
                if (searchPopupInput) setTimeout(() => searchPopupInput.focus({ preventScroll: true }), 100);
            });
        };

        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-search-trigger]');
            if (!trigger) return;
            e.preventDefault();
            (searchPopup.getAttribute('aria-hidden') === 'true' ? openPopup : closeSearchPopup)();
        });

        $$('.search-popup-close, .search-popup-overlay').forEach((el) => el?.addEventListener('click', closeSearchPopup));

        if (searchPopupForm && searchPopupInput) {
            searchPopupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchPopupInput.value.trim();
                if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
            });
        }
    }

    // Lightbox
    if (lightbox && lightboxImg) {
        const openLightbox = (src, opener) => {
            lockScroll();
            requestAnimationFrame(() => {
                lightboxOpener = opener || null;
                lightboxOpenerTabindex = opener ? opener.getAttribute('tabindex') : null;
                if (opener) opener.setAttribute('tabindex', '-1');
                lightboxImg.src = src;
                lightboxImg.alt = '';
                lightbox.setAttribute('aria-hidden', 'false');
                lightboxImg.focus();
            });
        };

        document.addEventListener('click', (e) => {
            const cardImage = e.target.closest('.card-image');
            if (!cardImage) return;
            const img = cardImage.querySelector('img');
            if (!img?.src) return;
            e.preventDefault();
            openLightbox(img.src, cardImage);
        });

        $('.lightbox-backdrop')?.addEventListener('click', closeLightbox);
    }

    // Aside widgets state
    if (asideEl) {
        const KEY = 'niwado-aside-widgets-open';
        const getWidgetKey = (el) => el.className.match(/widget--([a-z0-9_-]+)/i)?.[1] ?? null;
        const readState = () => {
            try {
                return JSON.parse(localStorage.getItem(KEY) || '{}');
            } catch {
                return {};
            }
        };
        const saveState = () => {
            const state = {};
            $$('.widget', asideEl).forEach((details) => {
                const key = getWidgetKey(details);
                if (key) state[key] = details.hasAttribute('open');
            });
            try {
                localStorage.setItem(KEY, JSON.stringify(state));
            } catch { }
        };

        const stored = readState();
        $$('.widget', asideEl).forEach((details) => {
            const key = getWidgetKey(details);
            if (key && stored[key] !== undefined) {
                details.toggleAttribute('open', stored[key]);
            }
            details.addEventListener('toggle', saveState);
        });
    }

    // Profile activity tabs
    (() => {
        const section = $('.profile-activity-tabs');
        const tabPosts = $('#profile-tab-posts');
        const tabComments = $('#profile-tab-comments');
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
