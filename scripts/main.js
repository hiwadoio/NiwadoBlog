(() => {
    'use strict';

    const throttleRAF = (fn) => {
        let rafId = null;
        return (...args) => {
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    fn(...args);
                    rafId = null;
                });
            }
        };
    };

    document.addEventListener('click', (event) => {
        const menu = document.querySelector('.action-menu');
        if (!menu?.hasAttribute('open')) return;
        if (!menu.contains(event.target)) {
            menu.removeAttribute('open');
        }
    });

    (function initCommentFormRulesToggle() {
        const STORAGE_KEY = 'commentFormRulesCollapsed';
        const block = document.getElementById('comment-hint');
        const btn = block?.querySelector('[data-comment-rules-toggle]');
        if (!block || !btn) return;
        const isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        if (isCollapsed) {
            block.classList.add('is-collapsed');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Развернуть правила');
        }
        btn.addEventListener('click', () => {
            const collapsed = block.classList.toggle('is-collapsed');
            localStorage.setItem(STORAGE_KEY, String(collapsed));
            btn.setAttribute('aria-expanded', String(!collapsed));
            btn.setAttribute('aria-label', collapsed ? 'Развернуть правила' : 'Свернуть правила');
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

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.rating-btn');
        if (!btn) return;

        const ratingBlock = btn.closest('.card-rating');
        const valueElement = ratingBlock?.querySelector('.rating-value');
        if (!ratingBlock || !valueElement) return;

        const upBtn = ratingBlock.querySelector('.rating-up');
        const downBtn = ratingBlock.querySelector('.rating-down');
        const wasUpActive = upBtn?.classList.contains('is-active') ?? false;
        const wasDownActive = downBtn?.classList.contains('is-active') ?? false;

        let currentValue = parseInt(valueElement.textContent, 10) || 0;
        const action = btn.dataset.action;
        const isActive = btn.classList.contains('is-active');

        ratingBlock.querySelectorAll('.rating-btn').forEach((b) => b.classList.remove('is-active'));

        if (action === 'up') {
            if (isActive) {
                currentValue -= 1;
            } else {
                currentValue += wasDownActive ? 2 : 1;
                btn.classList.add('is-active');
            }
        } else if (action === 'down') {
            if (isActive) {
                currentValue += 1;
            } else {
                currentValue -= wasUpActive ? 2 : 1;
                btn.classList.add('is-active');
            }
        }

        valueElement.textContent = currentValue;
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.comment-reply-btn[data-reply-trigger]');
        if (!btn) return;

        const actions = btn.closest('.comment-actions');
        const commentBody = btn.closest('.comment-body');
        if (!actions || !commentBody) return;

        const template = document.getElementById('comment-reply-form-template');
        if (!template || !template.content) return;

        const existing = commentBody.querySelector('.comment-reply-form');
        if (existing) {
            existing.remove();
            return;
        }

        const clone = template.content.cloneNode(true);
        const row = btn.closest('.comment-actions-row');
        (row || actions).after(clone);
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.comment-toggle-btn[data-comment-toggle]');
        if (!btn) return;
        const item = btn.closest('.comments-feed-item');
        const wrap = btn.closest('.comment-toggle-wrap');
        const tooltip = wrap?.querySelector('.comment-toggle-tooltip');
        if (!item) return;
        item.classList.toggle('is-collapsed');
        const label = item.classList.contains('is-collapsed') ? 'Развернуть комментарий' : 'Свернуть комментарий';
        btn.setAttribute('aria-label', label);
        if (tooltip) tooltip.textContent = label;
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.comment-branch-toggle-btn[data-branch-toggle]');
        if (!btn) return;
        const item = btn.closest('.comments-feed-item');
        const wrap = btn.closest('.comment-toggle-wrap');
        const tooltip = wrap?.querySelector('.comment-toggle-tooltip');
        if (!item) return;
        item.classList.toggle('is-branch-collapsed');
        const label = item.classList.contains('is-branch-collapsed') ? 'Развернуть ветку' : 'Свернуть ветку';
        btn.setAttribute('aria-label', label);
        if (tooltip) tooltip.textContent = label;
    });

    (function initCommentRatingStyles() {
        const list = document.querySelector('.comments-feed-list');
        if (!list) return;
        list.querySelectorAll('.comments-feed-item').forEach((item) => {
            const valueEl = item.querySelector('.comment-rating-value');
            if (!valueEl) return;
            const raw = (valueEl.textContent || '').trim().replace(/\u2212/g, '-');
            const rating = parseInt(raw, 10);
            if (!Number.isFinite(rating)) return;
            if (rating >= 5 && !item.classList.contains('comments-feed-item--author')) {
                item.classList.add('comments-feed-item--high-rating');
                const meta = item.querySelector('.comments-feed-meta');
                if (meta && !meta.querySelector('.comment-high-rating-icon')) {
                    const authorLink = meta.querySelector('.comment-author-link');
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
                    wrap.appendChild(tooltip);
                    wrap.appendChild(iconWrap);
                    meta.insertBefore(wrap, authorLink ? authorLink.nextSibling : meta.firstChild);
                }
            }
            if (rating <= -3) {
                item.classList.add('comments-feed-item--low-rating');
                let wrapper = item.querySelector('.comments-feed-text-wrapper');
                if (!wrapper) {
                    const textEl = item.querySelector('.comments-feed-text');
                    if (textEl) {
                        wrapper = document.createElement('div');
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
                        wrapper.appendChild(veil);
                        wrapper.appendChild(textEl);
                    }
                }
            }
        });
    })();

    document.addEventListener('click', (event) => {
        const option = event.target.closest('.comments-feed-sort-option');
        if (option) {
            event.preventDefault();
            const dropdown = option.closest('.comments-feed-sort-dropdown');
            const triggerText = dropdown?.querySelector('.comments-feed-sort-trigger-text');
            if (triggerText) {
                triggerText.textContent = option.textContent.trim();
                dropdown.querySelectorAll('.comments-feed-sort-option').forEach((o) => o.classList.remove('is-active'));
                option.classList.add('is-active');
                dropdown?.removeAttribute('open');
            }
            return;
        }
        const openDropdown = document.querySelector('.comments-feed-sort-dropdown[open]');
        if (openDropdown && !openDropdown.contains(event.target)) {
            openDropdown.removeAttribute('open');
        }
    });

    document.addEventListener('click', (event) => {
        const veil = event.target.closest('.comment-text-veil');
        if (!veil) return;
        const item = veil.closest('.comments-feed-item');
        if (item) item.classList.add('is-revealed');
    });

    document.addEventListener('keydown', (event) => {
        const veil = event.target.closest('.comment-text-veil');
        if (!veil) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const item = veil.closest('.comments-feed-item');
        if (item) item.classList.add('is-revealed');
    });

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.card-tags-trigger');
        if (trigger) {
            e.stopPropagation();
            const mobile = trigger.closest('.card-tags-mobile');
            const popup = mobile?.querySelector('.card-tags-popup');
            const footer = trigger.closest('.card-footer');
            const tagsSource = footer?.querySelector('.card-footer-tags');
            if (!popup || !tagsSource) return;

            if (trigger.getAttribute('aria-expanded') === 'true') {
                if (document.activeElement && popup.contains(document.activeElement)) trigger.focus();
                popup.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
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
            if (mobile && !mobile.contains(e.target)) {
                const t = mobile.querySelector('.card-tags-trigger');
                if (t) {
                    if (document.activeElement && openPopup.contains(document.activeElement)) t.focus();
                    openPopup.setAttribute('hidden', '');
                    t.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const trigger = document.querySelector('.card-tags-trigger[aria-expanded="true"]');
        if (!trigger) return;
        const popup = trigger.closest('.card-tags-mobile')?.querySelector('.card-tags-popup');
        if (popup) {
            if (document.activeElement && popup.contains(document.activeElement)) trigger.focus();
            popup.setAttribute('hidden', '');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('click', (e) => {
        const tagLink = e.target.closest('.card-tags-popup a.tag');
        if (tagLink) {
            const popup = tagLink.closest('.card-tags-popup');
            const trigger = popup?.closest('.card-tags-mobile')?.querySelector('.card-tags-trigger');
            if (trigger) {
                popup.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
            }
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
            if (searchTrigger) searchTrigger.focus();
            searchPopup.setAttribute('aria-hidden', 'true');
            searchPopup.setAttribute('inert', '');
        }
        document.body.style.overflow = '';
    };

    const closeLightbox = () => {
        const opener = lightboxOpener;
        const savedTabindex = lightboxOpenerTabindex;
        lightboxOpener = null;
        lightboxOpenerTabindex = null;
        if (lightbox) lightbox.setAttribute('aria-hidden', 'true');
        if (lightboxImg) lightboxImg.removeAttribute('src');
        document.body.style.overflow = '';
        if (opener) {
            if (savedTabindex !== undefined && savedTabindex !== null) {
                opener.setAttribute('tabindex', savedTabindex);
            } else {
                opener.removeAttribute('tabindex');
            }
            opener.focus?.();
        }
    };

    if (searchPopup) {
        const openPopup = () => {
            searchPopup.setAttribute('aria-hidden', 'false');
            searchPopup.removeAttribute('inert');
            document.body.style.overflow = 'hidden';

            const actionMenu = document.querySelector('.action-menu');
            if (actionMenu?.hasAttribute('open')) {
                actionMenu.removeAttribute('open');
            }

            if (searchPopupInput) {
                setTimeout(() => searchPopupInput.focus(), 100);
            }
        };

        document.addEventListener('click', (event) => {
            const searchTrigger = event.target.closest('[data-search-trigger]');
            if (!searchTrigger) return;

            event.preventDefault();
            if (searchPopup.getAttribute('aria-hidden') === 'true') {
                openPopup();
            } else {
                closeSearchPopup();
            }
        });

        if (searchPopupClose) {
            searchPopupClose.addEventListener('click', closeSearchPopup);
        }

        if (searchPopupOverlay) {
            searchPopupOverlay.addEventListener('click', closeSearchPopup);
        }

        if (searchPopupForm && searchPopupInput) {
            searchPopupForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const query = searchPopupInput.value.trim();
                if (query) {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
            });
        }
    }

    if (lightbox && lightboxImg) {
        const openLightbox = (src, opener) => {
            lightboxOpener = opener || null;
            lightboxOpenerTabindex = opener ? opener.getAttribute('tabindex') : null;
            if (opener) opener.setAttribute('tabindex', '-1');
            lightboxImg.src = src;
            lightboxImg.alt = '';
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (lightboxImg.hasAttribute('tabindex')) {
                requestAnimationFrame(() => lightboxImg.focus());
            }
        };

        document.addEventListener('click', (event) => {
            const cardImage = event.target.closest('.card-image');
            if (!cardImage) return;
            const img = cardImage.querySelector('img');
            if (!img?.src) return;
            event.preventDefault();
            openLightbox(img.src, cardImage);
        });

        if (lightboxBackdrop) {
            lightboxBackdrop.addEventListener('click', closeLightbox);
        }
    }

    const ASIDE_WIDGETS_STORAGE_KEY = 'niwado-aside-widgets-open';

    const getWidgetKey = (el) => {
        const match = el.className.match(/widget--([a-z0-9_-]+)/i);
        return match ? match[1] : null;
    };

    const readAsideWidgetsState = () => {
        try {
            const raw = localStorage.getItem(ASIDE_WIDGETS_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const saveAsideWidgetsState = (asideEl) => {
        if (!asideEl) return;
        const state = {};
        asideEl.querySelectorAll('.widget').forEach((details) => {
            const key = getWidgetKey(details);
            if (key) state[key] = details.hasAttribute('open');
        });
        try {
            localStorage.setItem(ASIDE_WIDGETS_STORAGE_KEY, JSON.stringify(state));
        } catch (_) { }
    };

    const aside = document.querySelector('.aside');
    if (aside) {
        const stored = readAsideWidgetsState();
        aside.querySelectorAll('.widget').forEach((details) => {
            const key = getWidgetKey(details);
            if (key && stored[key] !== undefined) {
                if (stored[key]) {
                    details.setAttribute('open', '');
                } else {
                    details.removeAttribute('open');
                }
            }
            details.addEventListener('toggle', () => saveAsideWidgetsState(aside));
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (searchPopup?.getAttribute('aria-hidden') === 'false') {
            closeSearchPopup();
            event.preventDefault();
            return;
        }
        if (lightbox?.getAttribute('aria-hidden') === 'false') {
            closeLightbox();
            event.preventDefault();
        }
    });

    (function initProfileActivityTabs() {
        const section = document.querySelector('.profile-activity-tabs');
        const tabPosts = document.getElementById('profile-tab-posts');
        const tabComments = document.getElementById('profile-tab-comments');
        if (!section || !tabPosts || !tabComments) return;
        function showPosts() {
            section.classList.remove('profile-activity-tabs--comments');
            section.classList.add('profile-activity-tabs--posts');
            tabPosts.setAttribute('aria-selected', 'true');
            tabComments.setAttribute('aria-selected', 'false');
        }
        function showComments() {
            section.classList.remove('profile-activity-tabs--posts');
            section.classList.add('profile-activity-tabs--comments');
            tabPosts.setAttribute('aria-selected', 'false');
            tabComments.setAttribute('aria-selected', 'true');
        }
        section.classList.add('profile-activity-tabs--posts');
        tabPosts.addEventListener('click', showPosts);
        tabComments.addEventListener('click', showComments);
    })();
})();