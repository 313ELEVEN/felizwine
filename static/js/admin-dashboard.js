const state = window.__FELIZ_ADMIN_STATE__ || {
    menu_items: [],
    labels: [],
    ads: [],
    orders: [],
    page_content: { key: "menu_page", title: "", subtitle: "", visible: true, payload: {} },
};

state.menuAdminType = 1;
state.menuAdminCategory = "";
state.activeMenuItemId = null;

const saveTimers = new Map();
const els = {};
const REQUEST_TIMEOUT_MS = 20000;
const AUTH_EXPIRED_MESSAGE = "Сессия администратора истекла. Обновите страницу и войдите снова.";
const NETWORK_TIMEOUT_MESSAGE = "Сервер слишком долго отвечает. Проверьте соединение и обновите страницу.";

const FOOD_CATEGORY_ORDER = [
    "Завтрак / Breakfast",
    "Супы / Soups",
    "Закуски / Appetizers",
    "Салаты / Salads",
    "Морепродукты и Рыба / Seafood and Fish",
    "Паста / Pasta",
    "Мясные блюда / Meat Dishes",
    "Бургеры и другое / Burgers & More",
    "Десерты / Desserts",
];

const DRINK_CATEGORY_ORDER = [
    "Кофе / Coffee",
    "Чай / Tea",
    "Соки и Вода / Juices & Water",
    "Пиво и закуски / Beer & Snacks",
    "Безалкогольные коктейли / Non-alcoholic cocktails",
    "Алкогольные коктейли / Alcoholic cocktails",
    "Виски / Whisky",
    "Коньяк / Divin",
    "Игристые / Sparkling",
    "Белые вина / White Wines",
    "Розовые вина / Rosé Wines",
    "Красные вина / Red Wines",
];

const FOOD_CATEGORY_SET = new Set(FOOD_CATEGORY_ORDER);
const DRINK_CATEGORY_SET = new Set(DRINK_CATEGORY_ORDER);

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normaliseSearch(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function slugify(value) {
    return normaliseSearch(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "group";
}

function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function setGlobalStatus(message, type = "idle") {
    if (!els.saveIndicator) return;
    els.saveIndicator.textContent = message;
    els.saveIndicator.classList.toggle("is-saving", type === "saving");
    els.saveIndicator.classList.toggle("is-error", type === "error");
}

function setCardStatus(card, message, type = "idle") {
    const statusNode = card?.querySelector("[data-card-status]");
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.classList.toggle("is-saving", type === "saving");
    statusNode.classList.toggle("is-error", type === "error");
}

async function requestJSON(url, options = {}) {
    const { headers, timeout = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                ...headers,
            },
            signal: controller.signal,
            ...fetchOptions,
        });

        const isJson = response.headers.get("content-type")?.includes("application/json");
        const payload = isJson ? await response.json() : null;

        if (response.status === 401 || response.status === 403) {
            throw new Error(payload?.message || AUTH_EXPIRED_MESSAGE);
        }
        if (!response.ok) {
            throw new Error(payload?.message || "Запрос завершился с ошибкой.");
        }
        return payload;
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error(NETWORK_TIMEOUT_MESSAGE);
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestJSON("/admin/upload", {
        method: "POST",
        body: formData,
    });
}

function scheduleSave(key, callback, delay = 900) {
    window.clearTimeout(saveTimers.get(key));
    setGlobalStatus("Сохраняю изменения...", "saving");
    saveTimers.set(
        key,
        window.setTimeout(async () => {
            saveTimers.delete(key);
            try {
                await callback();
                setGlobalStatus("Все изменения сохранены");
            } catch (error) {
                const message = error?.message || "Не удалось сохранить изменения.";
                setGlobalStatus(message, "error");
                showToast(message);
            }
        }, delay),
    );
}

function upsertById(collection, updatedEntity) {
    const index = collection.findIndex((entity) => entity.id === updatedEntity.id);
    if (index >= 0) {
        collection[index] = updatedEntity;
    } else {
        collection.unshift(updatedEntity);
    }
}

function inferMenuType(category, fallback = 1) {
    if (FOOD_CATEGORY_SET.has(category)) return 1;
    if (DRINK_CATEGORY_SET.has(category)) return 0;
    return Number(fallback) ? 1 : 0;
}

function menuItemType(item) {
    return inferMenuType(item.category, item.is_food ? 1 : 0);
}

function categoryOrderForType(type) {
    return Number(type) === 0 ? DRINK_CATEGORY_ORDER : FOOD_CATEGORY_ORDER;
}

function categoriesForType(type) {
    const items = state.menu_items.filter((item) => menuItemType(item) === Number(type));
    const unique = [...new Set(items.map((item) => item.category).filter(Boolean))];
    const order = categoryOrderForType(type);
    const ordered = order.filter((category) => unique.includes(category));
    const remaining = unique.filter((category) => !order.includes(category)).sort((a, b) => a.localeCompare(b));
    return ordered.concat(remaining);
}

function uniqueCategories() {
    return [...new Set(state.menu_items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function groupMenuItems() {
    const groups = new Map();
    state.menu_items
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .forEach((item) => {
            const key = item.category || "Без категории";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
        });
    return [...groups.entries()];
}

function labelOptions(selectedId) {
    const options = [`<option value="">Без бейджа</option>`];
    state.labels
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .forEach((label) => {
            options.push(
                `<option value="${label.id}" ${Number(selectedId) === label.id ? "selected" : ""}>${escapeHtml(label.badge_text || label.name)}</option>`,
            );
        });
    return options.join("");
}

function categoryOptions(selectedCategory) {
    return uniqueCategories()
        .map(
            (category) =>
                `<option value="${escapeHtml(category)}" ${category === selectedCategory ? "selected" : ""}>${escapeHtml(category)}</option>`,
        )
        .join("");
}

function formatPrice(price) {
    return `${Number(price || 0).toFixed(0)} MDL`;
}

function setExpandableState(toggle, body, isOpen) {
    if (!toggle || !body) return;
    toggle.classList.toggle("is-open", isOpen);
    body.classList.toggle("is-open", isOpen);
}

function focusCard(targetId) {
    const node = document.getElementById(targetId);
    if (!node) return;
    const group = node.closest("[data-collection-group]");
    if (group) {
        const toggle = group.querySelector(".collection-group-toggle");
        const body = group.querySelector(".collection-group-body");
        setExpandableState(toggle, body, true);
    }
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    node.classList.add("is-focused");
    window.clearTimeout(focusCard.timer);
    focusCard.timer = window.setTimeout(() => node.classList.remove("is-focused"), 1800);
}

function focusGroup(targetId) {
    const node = document.getElementById(targetId);
    if (!node) return;
    const toggle = node.querySelector(".collection-group-toggle");
    const body = node.querySelector(".collection-group-body");
    setExpandableState(toggle, body, true);
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    node.classList.add("is-focused");
    window.clearTimeout(focusGroup.timer);
    focusGroup.timer = window.setTimeout(() => node.classList.remove("is-focused"), 1800);
}

function bindCategoryButtons(container) {
    container?.querySelectorAll("[data-admin-category]").forEach((button) => {
        button.addEventListener("click", () => {
            state.menuAdminType = Number(button.dataset.adminType || 1);
            state.menuAdminCategory = button.dataset.adminCategory || "";
            renderMenuItems();
            renderNavigator();
            renderCategoryJumpLinks();
            document.getElementById("menu-section-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function renderCategoryJumpLinks() {
    const categories = categoriesForType(state.menuAdminType);
    const itemsForType = state.menu_items.filter((item) => menuItemType(item) === state.menuAdminType);
    const markup = categories.length
        ? categories
              .map((category) => {
                  const count = itemsForType.filter((item) => item.category === category).length;
                  return `
                      <button
                          type="button"
                          class="quickbar-chip ${category === state.menuAdminCategory ? "is-active" : ""}"
                          data-admin-category="${escapeHtml(category)}"
                          data-admin-type="${state.menuAdminType}"
                      >
                          <span>${escapeHtml(category)}</span>
                          <small>${count}</small>
                      </button>
                  `;
              })
              .join("")
        : `<div class="empty-card">Категории появятся после добавления товаров.</div>`;

    if (els.adminJumpCategories) {
        els.adminJumpCategories.innerHTML = markup;
        bindCategoryButtons(els.adminJumpCategories);
    }

    if (els.menuCategoryChips) {
        els.menuCategoryChips.innerHTML = markup;
        bindCategoryButtons(els.menuCategoryChips);
    }
}

function renderSummary() {
    if (!els.adminSummary) return;
    const cards = [
        { label: "Товаров", value: state.menu_items.length },
        { label: "Категорий", value: uniqueCategories().length },
        { label: "Бейджей", value: state.labels.length },
        { label: "Баннеров", value: state.ads.length },
        { label: "Заказов", value: state.orders.length },
        { label: "Видимых баннеров", value: state.ads.filter((ad) => ad.visible).length },
    ];
    els.adminSummary.innerHTML = cards
        .map(
            (card) => `
                <article class="summary-card">
                    <span class="summary-label">${escapeHtml(card.label)}</span>
                    <strong class="summary-value">${card.value}</strong>
                </article>
            `,
        )
        .join("");
}

function renderNavigator() {
    if (!els.menuNavigator) return;
    const foodCategories = categoriesForType(1);
    const drinkCategories = categoriesForType(0);
    if (!foodCategories.length && !drinkCategories.length) {
        els.menuNavigator.innerHTML = `<div class="empty-card">Категории ещё не добавлены.</div>`;
        return;
    }

    const block = (title, type, categories) => `
        <section class="navigator-group">
            <div class="navigator-group-title">
                <strong>${title}</strong>
                <span>${categories.length} категорий</span>
            </div>
            <div class="quickbar-links">
                ${categories
                    .map(
                        (category) => `
                            <button
                                type="button"
                                class="quickbar-chip ${state.menuAdminType === type && state.menuAdminCategory === category ? "is-active" : ""}"
                                data-admin-category="${escapeHtml(category)}"
                                data-admin-type="${type}"
                            >
                                <span>${escapeHtml(category)}</span>
                            </button>
                        `,
                    )
                    .join("")}
            </div>
        </section>
    `;

    els.menuNavigator.innerHTML = [block("Еда", 1, foodCategories), block("Напитки", 0, drinkCategories)]
        .filter(Boolean)
        .join("");
    bindCategoryButtons(els.menuNavigator);
}

function applySearchFilter() {
    const query = normaliseSearch(els.adminSearch?.value);

    document.querySelectorAll("[data-searchable-card]").forEach((card) => {
        const haystack = card.dataset.search || normaliseSearch(card.textContent);
        const matches = !query || haystack.includes(query);
        card.classList.toggle("search-hidden", !matches);
    });

    document.querySelectorAll("[data-collection-group]").forEach((group) => {
        const visibleCount = group.querySelectorAll("[data-searchable-card]:not(.search-hidden)").length;
        const toggle = group.querySelector(".collection-group-toggle");
        const body = group.querySelector(".collection-group-body");
        group.classList.toggle("search-hidden", Boolean(query && visibleCount === 0));
        if (query && visibleCount > 0) {
            setExpandableState(toggle, body, true);
        }
    });

    document.querySelectorAll("[data-nav-group]").forEach((group) => {
        const items = group.querySelectorAll("[data-nav-search]");
        let matches = 0;
        items.forEach((item) => {
            const visible = !query || item.dataset.navSearch.includes(query);
            item.classList.toggle("search-hidden", !visible);
            if (visible) matches += 1;
        });
        group.classList.toggle("search-hidden", Boolean(query && matches === 0));
        if (query && matches > 0) {
            const toggle = group.querySelector(".navigator-group-toggle");
            const body = group.querySelector(".navigator-items");
            setExpandableState(toggle, body, true);
        }
    });

    document.querySelectorAll("[data-search-section]").forEach((section) => {
        const cards = section.querySelectorAll("[data-searchable-card]");
        if (!cards.length) return;
        const visibleCards = section.querySelectorAll("[data-searchable-card]:not(.search-hidden)").length;
        section.classList.toggle("search-hidden", Boolean(query && visibleCards === 0));
    });
}

function syncSidebar() {
    renderSummary();
    renderNavigator();
    applySearchFilter();
}

function renderPageContent() {
    const payload = state.page_content.payload || {};
    els.pageContentForm.innerHTML = `
        <div class="inline-fields">
            <label class="field span-6">
                <span>Заголовок страницы</span>
                <input type="text" name="title" value="${escapeHtml(state.page_content.title || "")}">
            </label>
            <label class="field span-6">
                <span>Подзаголовок страницы</span>
                <input type="text" name="subtitle" value="${escapeHtml(state.page_content.subtitle || "")}">
            </label>
            <label class="field span-6">
                <span>Hero заголовок</span>
                <input type="text" name="hero_title" value="${escapeHtml(payload.hero_title || "")}">
            </label>
            <label class="field span-6">
                <span>Hero подзаголовок</span>
                <input type="text" name="hero_subtitle" value="${escapeHtml(payload.hero_subtitle || "")}">
            </label>
            <label class="field span-4">
                <span>Eyebrow</span>
                <input type="text" name="hero_eyebrow" value="${escapeHtml(payload.hero_eyebrow || "")}">
            </label>
            <label class="field span-4">
                <span>Заголовок меню</span>
                <input type="text" name="menu_title" value="${escapeHtml(payload.menu_title || "")}">
            </label>
            <label class="field span-4">
                <span>Подпись меню</span>
                <input type="text" name="menu_subtitle" value="${escapeHtml(payload.menu_subtitle || "")}">
            </label>
            <label class="field span-6">
                <span>Заголовок секции рекламы</span>
                <input type="text" name="ads_title" value="${escapeHtml(payload.ads_title || "")}">
            </label>
            <label class="field span-6">
                <span>Подпись секции рекламы</span>
                <input type="text" name="ads_subtitle" value="${escapeHtml(payload.ads_subtitle || "")}">
            </label>
        </div>
        <label class="checkbox-field">
            <input type="checkbox" name="visible" ${state.page_content.visible ? "checked" : ""}>
            <span>Показывать блок контента</span>
        </label>
    `;

    els.pageContentForm.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => scheduleSave("page-content", savePageContent));
        input.addEventListener("change", () => scheduleSave("page-content", savePageContent, 500));
    });
}

async function savePageContent() {
    const formData = new FormData(els.pageContentForm);
    const payload = {
        title: formData.get("title"),
        subtitle: formData.get("subtitle"),
        visible: formData.get("visible") === "on",
        payload: {
            hero_title: formData.get("hero_title"),
            hero_subtitle: formData.get("hero_subtitle"),
            hero_eyebrow: formData.get("hero_eyebrow"),
            menu_title: formData.get("menu_title"),
            menu_subtitle: formData.get("menu_subtitle"),
            ads_title: formData.get("ads_title"),
            ads_subtitle: formData.get("ads_subtitle"),
        },
    };
    const result = await requestJSON(`/admin/page-content/${state.page_content.key || "menu_page"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    state.page_content = result.page_content;
}

function renderLabels() {
    if (!els.labelsList) return;
    if (!state.labels.length) {
        els.labelsList.innerHTML = `<div class="empty-card">Бейджи ещё не созданы.</div>`;
        return;
    }

    els.labelsList.innerHTML = state.labels
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map(
            (label) => `
                <article
                    class="admin-product-card ${state.activeLabelId === label.id ? "is-active" : ""}"
                    data-label-card="${label.id}"
                >
                    <div class="admin-product-media" style="background:${escapeHtml(label.color || "#d6a95f")}; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 2.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${escapeHtml(label.emoji || "🏷️")}</span>
                    </div>
                    <div class="admin-product-meta">
                        <div class="admin-product-price-row">
                            <strong class="admin-product-price" style="color: ${escapeHtml(label.color || "#d6a95f")}">${escapeHtml(label.badge_text || label.name)}</strong>
                            <span class="admin-product-kicker">#${label.sort_order}</span>
                        </div>
                        <div class="admin-product-title">${escapeHtml(label.name)}</div>
                    </div>
                </article>
            `,
        )
        .join("");

    els.labelsList.querySelectorAll("[data-label-card]").forEach((card) => {
        card.addEventListener("click", () => openLabelEditor(Number(card.dataset.labelCard)));
    });
}

function openLabelEditor(labelId) {
    state.activeLabelId = labelId;
    renderLabels();
    renderLabelEditor();
    els.menuEditorDrawer?.classList.add("is-open");
    els.menuEditorBackdrop?.classList.add("is-visible");
}

function renderLabelEditor() {
    if (!els.menuEditorBody || !els.menuEditorTitle) return;
    const label = state.labels.find((l) => l.id === state.activeLabelId);
    if (!label) {
        els.menuEditorTitle.textContent = "Бейдж";
        setMenuEditorStatus("Выберите бейдж для редактирования.");
        els.menuEditorBody.innerHTML = `<div class="empty-card">Выберите бейдж в сетке, чтобы открыть редактор.</div>`;
        return;
    }

    els.menuEditorTitle.textContent = label.name;
    setMenuEditorStatus("Автосохранение активно");
    els.menuEditorBody.innerHTML = `
        <form id="label-editor-form" class="menu-editor-form" data-label-id="${label.id}">
            <div class="inline-fields">
                <label class="field span-6">
                    <span>Название (внутреннее)</span>
                    <input type="text" name="name" value="${escapeHtml(label.name)}">
                </label>
                <label class="field span-6">
                    <span>Текст на бейдже</span>
                    <input type="text" name="badge_text" value="${escapeHtml(label.badge_text || "")}">
                </label>
                <label class="field span-4">
                    <span>Emoji</span>
                    <input type="text" name="emoji" value="${escapeHtml(label.emoji || "")}">
                </label>
                <label class="field span-4">
                    <span>Цвет (HEX)</span>
                    <input type="text" name="color" value="${escapeHtml(label.color || "#d6a95f")}">
                </label>
                <label class="field span-4">
                    <span>Порядок</span>
                    <input type="number" name="sort_order" value="${Number(label.sort_order || 0)}">
                </label>
                <label class="field span-12">
                    <label class="checkbox-field">
                        <input type="checkbox" name="visible" ${label.visible ? "checked" : ""}>
                        <span>Виден на сайте</span>
                    </label>
                </label>
            </div>
            <div class="upload-row">
                <div class="label-preview" style="background:${escapeHtml(label.color || "#d6a95f")}; padding: 1rem 2rem; border-radius: 999px; font-size: 1.2rem;">
                    ${escapeHtml(label.badge_text || label.name)}
                </div>
                <button class="danger-button" type="button" data-delete-label-item="${label.id}">
                    <i class="fa-solid fa-trash"></i>
                    <span>Удалить</span>
                </button>
            </div>
        </form>
    `;

    const form = $("label-editor-form");
    form.querySelectorAll("input").forEach((input) => {
        const key = `label-editor-${label.id}`;
        const handler = () => {
            setMenuEditorStatus("Сохраняю...", "saving");
            scheduleSave(key, () => saveLabelForm(form));
        };
        input.addEventListener("input", handler);
        input.addEventListener("change", handler);
    });

    form.querySelector("[data-delete-label-item]")?.addEventListener("click", () => deleteLabel(label.id));
}

async function saveLabelForm(form) {
    const id = Number(form.dataset.labelId);
    const payload = {
        name: form.querySelector('[name="name"]').value,
        badge_text: form.querySelector('[name="badge_text"]').value,
        emoji: form.querySelector('[name="emoji"]').value,
        color: form.querySelector('[name="color"]').value,
        sort_order: Number(form.querySelector('[name="sort_order"]').value || 0),
        visible: form.querySelector('[name="visible"]').checked,
    };
    const result = await requestJSON(`/admin/labels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    upsertById(state.labels, result.label);
    setMenuEditorStatus("Сохранено");
    renderLabels();
    renderLabelEditor();
    renderMenuItems();
    syncSidebar();
}

async function createLabel() {
    const result = await requestJSON("/admin/labels", { method: "POST" });
    upsertById(state.labels, result.label);
    renderLabels();
    syncSidebar();
    openLabelEditor(result.label.id);
    showToast("Новый бейдж создан.");
}

async function deleteLabel(id) {
    await requestJSON(`/admin/labels/${id}`, { method: "DELETE" });
    state.labels = state.labels.filter((label) => label.id !== id);
    if (state.activeLabelId === id) {
        state.activeLabelId = null;
        renderLabelEditor();
    }
    renderLabels();
    renderMenuItems();
    syncSidebar();
    showToast("Бейдж удалён.");
}

function renderAds() {
    if (!els.adsList) return;
    if (!state.ads.length) {
        els.adsList.innerHTML = `<div class="empty-card">Рекламные карточки ещё не созданы.</div>`;
        return;
    }

    els.adsList.innerHTML = state.ads
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        .map(
            (ad) => `
                <article
                    class="admin-product-card ${state.activeAdId === ad.id ? "is-active" : ""}"
                    data-ad-card="${ad.id}"
                >
                    <div class="admin-product-media">
                        <img src="${escapeHtml(ad.image_url || "/static/images/image1.webp")}" alt="${escapeHtml(ad.title)}">
                    </div>
                    <div class="admin-product-meta">
                        <div class="admin-product-price-row">
                            <strong class="admin-product-price">${escapeHtml(ad.cta_text || "Подробнее")}</strong>
                            <span class="admin-product-kicker">Порядок: ${ad.sort_order}</span>
                        </div>
                        <div class="admin-product-title">${escapeHtml(ad.title)}</div>
                        <div class="admin-product-note">${escapeHtml(ad.description || "Кликните для редактирования.")}</div>
                    </div>
                </article>
            `,
        )
        .join("");

    els.adsList.querySelectorAll("[data-ad-card]").forEach((card) => {
        card.addEventListener("click", () => openAdEditor(Number(card.dataset.adCard)));
    });
}

function openAdEditor(adId) {
    state.activeAdId = adId;
    renderAds();
    renderAdEditor();
    els.menuEditorDrawer?.classList.add("is-open");
    els.menuEditorBackdrop?.classList.add("is-visible");
}

function renderAdEditor() {
    if (!els.menuEditorBody || !els.menuEditorTitle) return;
    const ad = state.ads.find((a) => a.id === state.activeAdId);
    if (!ad) {
        els.menuEditorTitle.textContent = "Баннер";
        setMenuEditorStatus("Выберите баннер для редактирования.");
        els.menuEditorBody.innerHTML = `<div class="empty-card">Выберите баннер в сетке, чтобы открыть редактор.</div>`;
        return;
    }

    els.menuEditorTitle.textContent = ad.title;
    setMenuEditorStatus("Автосохранение активно");
    els.menuEditorBody.innerHTML = `
        <form id="ad-editor-form" class="menu-editor-form" data-ad-id="${ad.id}">
            <div class="inline-fields">
                <label class="field span-6">
                    <span>Заголовок</span>
                    <input type="text" name="title" value="${escapeHtml(ad.title)}">
                </label>
                <label class="field span-6">
                    <span>Описание</span>
                    <input type="text" name="description" value="${escapeHtml(ad.description || "")}">
                </label>
                <label class="field span-6">
                    <span>CTA текст</span>
                    <input type="text" name="cta_text" value="${escapeHtml(ad.cta_text || "")}">
                </label>
                <label class="field span-6">
                    <span>CTA ссылка</span>
                    <input type="text" name="cta_url" value="${escapeHtml(ad.cta_url || "")}">
                </label>
                <label class="field span-8">
                    <span>Изображение</span>
                    <input type="text" name="image_url" value="${escapeHtml(ad.image_url || "")}">
                </label>
                <label class="field span-4">
                    <span>Порядок</span>
                    <input type="number" name="sort_order" value="${Number(ad.sort_order || 0)}">
                </label>
                <label class="field span-12">
                    <label class="checkbox-field">
                        <input type="checkbox" name="visible" ${ad.visible ? "checked" : ""}>
                        <span>Виден в ленте</span>
                    </label>
                </label>
                <label class="field span-6">
                    <span>Eyebrow</span>
                    <input type="text" name="eyebrow" value="${escapeHtml(ad.payload?.eyebrow || "")}" placeholder="Feliz Wine Bar">
                </label>
                <label class="field span-6">
                    <span>Geo страны</span>
                    <input
                        type="text"
                        name="allowed_countries"
                        value="${escapeHtml((ad.allowed_countries || ad.payload?.allowed_countries || []).join(", "))}"
                        placeholder="CZ, MD"
                    >
                </label>
            </div>
            <div class="upload-row">
                <label class="upload-button">
                    <input class="hidden" type="file" accept="image/*" data-upload-ad-item="${ad.id}">
                    <i class="fa-solid fa-upload"></i>
                    <span>Загрузить изображение</span>
                </label>
                <button class="danger-button" type="button" data-delete-ad-item="${ad.id}">
                    <i class="fa-solid fa-trash"></i>
                    <span>Удалить</span>
                </button>
            </div>
            ${ad.image_url ? `<img class="preview-image" src="${escapeHtml(ad.image_url)}" alt="${escapeHtml(ad.title)}">` : ""}
        </form>
    `;

    const form = $("ad-editor-form");
    form.querySelectorAll("input").forEach((input) => {
        const key = `ad-editor-${ad.id}`;
        const handler = () => {
            setMenuEditorStatus("Сохраняю...", "saving");
            scheduleSave(key, () => saveAdForm(form));
        };
        input.addEventListener("input", handler);
        input.addEventListener("change", handler);
    });

    form.querySelector("[data-upload-ad-item]")?.addEventListener("change", async (event) => {
        const input = event.currentTarget;
        if (!input.files?.[0]) return;
        setMenuEditorStatus("Загружаю изображение...", "saving");
        const result = await uploadFile(input.files[0]);
        form.querySelector('[name="image_url"]').value = result.url;
        await saveAdForm(form);
    });

    form.querySelector("[data-delete-ad-item]")?.addEventListener("click", () => deleteAd(ad.id));
}

async function saveAdForm(form) {
    const id = Number(form.dataset.adId);
    const eyebrow = form.querySelector('[name="eyebrow"]').value.trim();
    const allowedCountries = form.querySelector('[name="allowed_countries"]').value
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
    const existingAd = state.ads.find((ad) => ad.id === id);
    const adMetaPayload = {
        ...((existingAd && existingAd.payload) || {}),
    };

    if (eyebrow) {
        adMetaPayload.eyebrow = eyebrow;
    } else {
        delete adMetaPayload.eyebrow;
    }

    if (allowedCountries.length) {
        adMetaPayload.allowed_countries = allowedCountries;
    } else {
        delete adMetaPayload.allowed_countries;
    }

    const payload = {
        title: form.querySelector('[name="title"]').value,
        description: form.querySelector('[name="description"]').value,
        cta_text: form.querySelector('[name="cta_text"]').value,
        cta_url: form.querySelector('[name="cta_url"]').value,
        image_url: form.querySelector('[name="image_url"]').value,
        sort_order: Number(form.querySelector('[name="sort_order"]').value || 0),
        visible: form.querySelector('[name="visible"]').checked,
        payload: adMetaPayload,
    };
    const result = await requestJSON(`/admin/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    upsertById(state.ads, result.ad);
    setMenuEditorStatus("Сохранено");
    renderAds();
    renderAdEditor();
    syncSidebar();
}

async function createAd() {
    const result = await requestJSON("/admin/ads", { method: "POST" });
    upsertById(state.ads, result.ad);
    renderAds();
    syncSidebar();
    openAdEditor(result.ad.id);
    showToast("Новый баннер создан.");
}

async function deleteAd(id) {
    await requestJSON(`/admin/ads/${id}`, { method: "DELETE" });
    state.ads = state.ads.filter((ad) => ad.id !== id);
    if (state.activeAdId === id) {
        state.activeAdId = null;
        renderAdEditor();
    }
    renderAds();
    syncSidebar();
    showToast("Баннер удалён.");
}

function setMenuEditorStatus(message, type = "idle") {
    if (!els.menuEditorStatus) return;
    els.menuEditorStatus.textContent = message;
    els.menuEditorStatus.classList.toggle("is-saving", type === "saving");
    els.menuEditorStatus.classList.toggle("is-error", type === "error");
}

function activeMenuItem() {
    return state.menu_items.find((item) => item.id === state.activeMenuItemId) || null;
}

function openMenuEditor(itemId) {
    state.activeMenuItemId = itemId;
    renderMenuItems();
    renderMenuEditor();
    els.menuEditorDrawer?.classList.add("is-open");
    els.menuEditorBackdrop?.classList.add("is-visible");
    els.menuEditorDrawer?.setAttribute("aria-hidden", "false");
}

function closeMenuEditor() {
    state.activeMenuItemId = null;
    state.activeAdId = null;
    els.menuEditorDrawer?.classList.remove("is-open");
    els.menuEditorBackdrop?.classList.remove("is-visible");
    els.menuEditorDrawer?.setAttribute("aria-hidden", "true");
    renderMenuItems();
    renderMenuEditor();
    renderAds();
}

function renderMenuEditor() {
    if (!els.menuEditorBody || !els.menuEditorTitle) return;
    const item = activeMenuItem();
    if (!item) {
        els.menuEditorTitle.textContent = "Товар";
        setMenuEditorStatus("Выберите карточку для редактирования.");
        els.menuEditorBody.innerHTML = `<div class="empty-card">Выберите товар в сетке, чтобы открыть редактор.</div>`;
        return;
    }

    els.menuEditorTitle.textContent = item.name;
    setMenuEditorStatus("Автосохранение активно");
    els.menuEditorBody.innerHTML = `
        <form id="menu-item-editor-form" class="menu-editor-form" data-item-id="${item.id}">
            <div class="inline-fields">
                <label class="field span-6">
                    <span>Название</span>
                    <input type="text" name="name" value="${escapeHtml(item.name)}">
                </label>
                <label class="field span-6">
                    <span>Категория</span>
                    <select name="category">
                        <option value="${escapeHtml(item.category)}">${escapeHtml(item.category)}</option>
                        ${categoryOptions(item.category)}
                    </select>
                </label>
                <label class="field span-6">
                    <span>Новая категория</span>
                    <input type="text" name="new_category" value="">
                </label>
                <label class="field span-6">
                    <span>Тип</span>
                    <select name="is_food">
                        <option value="1" ${menuItemType(item) === 1 ? "selected" : ""}>Еда</option>
                        <option value="0" ${menuItemType(item) === 0 ? "selected" : ""}>Напитки</option>
                    </select>
                </label>
                <label class="field span-12">
                    <span>Описание</span>
                    <textarea name="description">${escapeHtml(item.description || "")}</textarea>
                </label>
                <label class="field span-4">
                    <span>Цена</span>
                    <input type="number" step="0.01" name="price" value="${Number(item.price || 0)}">
                </label>
                <label class="field span-4">
                    <span>Порядок</span>
                    <input type="number" name="sort_order" value="${Number(item.sort_order || 0)}">
                </label>
                <label class="field span-4">
                    <span>Бейдж</span>
                    <select name="label_id">
                        ${labelOptions(item.label_id)}
                    </select>
                </label>
                <label class="field span-8">
                    <span>Изображение</span>
                    <input type="text" name="image_url" value="${escapeHtml(item.image_url || "")}">
                </label>
                <label class="field span-4">
                    <span>Видимость</span>
                    <label class="checkbox-field">
                        <input type="checkbox" name="visible" ${item.visible ? "checked" : ""}>
                        <span>Показывать на сайте</span>
                    </label>
                </label>
            </div>
            <div class="upload-row">
                <label class="upload-button">
                    <input class="hidden" type="file" accept="image/*" data-upload-active-item="${item.id}">
                    <i class="fa-solid fa-upload"></i>
                    <span>Загрузить изображение</span>
                </label>
                ${item.label?.badge_text ? `<div class="label-preview" style="background:${escapeHtml(item.label.color || "#d6a95f")}">${escapeHtml(item.label.badge_text)}</div>` : ""}
                <button class="danger-button" type="button" data-delete-active-item="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                    <span>Удалить</span>
                </button>
            </div>
            ${item.image_url ? `<img class="preview-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : `<div class="empty-card">Добавьте изображение, чтобы видеть превью.</div>`}
        </form>
    `;

    const form = $("menu-item-editor-form");
    if (!form) return;
    form.querySelectorAll("input, textarea, select").forEach((input) => {
        const key = `item-editor-${item.id}`;
        const handler = () => {
            setMenuEditorStatus("Сохраняю...", "saving");
            scheduleSave(key, () => saveMenuItemForm(form));
        };
        input.addEventListener("input", handler);
        input.addEventListener("change", handler);
    });

    form.querySelector("[data-upload-active-item]")?.addEventListener("change", async (event) => {
        const input = event.currentTarget;
        if (!input.files?.[0]) return;
        setMenuEditorStatus("Загружаю изображение...", "saving");
        const result = await uploadFile(input.files[0]);
        form.querySelector('[name="image_url"]').value = result.url;
        await saveMenuItemForm(form);
    });

    form.querySelector("[data-delete-active-item]")?.addEventListener("click", () => deleteMenuItem(item.id));
}

async function saveMenuItemForm(form) {
    const id = Number(form.dataset.itemId);
    const payload = {
        name: form.querySelector('[name="name"]').value,
        category: form.querySelector('[name="category"]').value,
        new_category: form.querySelector('[name="new_category"]').value,
        description: form.querySelector('[name="description"]').value,
        price: Number(form.querySelector('[name="price"]').value || 0),
        sort_order: Number(form.querySelector('[name="sort_order"]').value || 0),
        is_food: Number(form.querySelector('[name="is_food"]').value || 1),
        label_id: form.querySelector('[name="label_id"]').value,
        image_url: form.querySelector('[name="image_url"]').value,
        visible: form.querySelector('[name="visible"]').checked,
    };

    const result = await requestJSON(`/admin/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    upsertById(state.menu_items, result.item);
    state.activeMenuItemId = result.item.id;
    state.menuAdminType = menuItemType(result.item);
    state.menuAdminCategory = result.item.category;
    setMenuEditorStatus("Сохранено");
    renderMenuItems();
    renderMenuEditor();
    syncSidebar();
}

function filteredMenuItemsForAdmin() {
    const query = normaliseSearch(els.adminSearch?.value);
    const typeItems = state.menu_items.filter((item) => menuItemType(item) === state.menuAdminType);
    const categories = categoriesForType(state.menuAdminType);
    if (!state.menuAdminCategory || !categories.includes(state.menuAdminCategory)) {
        state.menuAdminCategory = categories[0] || "";
    }
    if (query) {
        return typeItems.filter((item) => normaliseSearch([item.name, item.category, item.description, item.label?.badge_text].join(" ")).includes(query));
    }
    return typeItems.filter((item) => item.category === state.menuAdminCategory);
}

function renderMenuItems() {
    if (!els.menuItemsList) return;
    const categories = categoriesForType(state.menuAdminType);
    renderCategoryJumpLinks();

    els.menuAdminTypeToggle?.querySelectorAll("[data-admin-menu-type]").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.adminMenuType) === state.menuAdminType);
    });

    if (!state.menu_items.length) {
        els.menuItemsList.innerHTML = `<div class="empty-card">Меню ещё не загружено.</div>`;
        if (!activeMenuItem()) {
            renderMenuEditor();
        }
        return;
    }

    const visibleItems = filteredMenuItemsForAdmin();
    els.menuItemsList.innerHTML = visibleItems.length
        ? visibleItems
              .map(
                  (item) => {
                      const label = state.labels.find((l) => l.id === item.label_id);
                      return `
                          <article
                              class="admin-product-card ${state.activeMenuItemId === item.id ? "is-active" : ""}"
                              data-menu-item-card="${item.id}"
                          >
                              <div class="admin-product-media">
                                  <img src="${escapeHtml(item.image_url || "/static/images/image6.png")}" alt="${escapeHtml(item.name)}">
                              </div>
                              <div class="admin-product-meta">
                                  <div class="admin-product-price-row">
                                      <strong class="admin-product-price">${formatPrice(item.price)}</strong>
                                      <span class="admin-product-kicker">#${item.sort_order}</span>
                                  </div>
                                  <div class="admin-product-title">${escapeHtml(item.name)}</div>
                                  ${label ? `<div class="admin-product-note" style="color: ${escapeHtml(label.color || "#d6a95f")}">${escapeHtml(label.badge_text || label.name)}</div>` : ""}
                              </div>
                          </article>
                      `;
                  },
              )
              .join("")
        : `<div class="empty-card">В этой категории ещё нет товаров.</div>`;

    els.menuItemsList.querySelectorAll("[data-menu-item-card]").forEach((card) => {
        card.addEventListener("click", () => openMenuEditor(Number(card.dataset.menuItemCard)));
    });

    if (state.activeMenuItemId && !activeMenuItem()) {
        closeMenuEditor();
    }
}

async function createMenuItem() {
    try {
        const categories = categoriesForType(state.menuAdminType);
        const defaultCategory = state.menuAdminCategory || categories[0] || (state.menuAdminType === 0 ? DRINK_CATEGORY_ORDER[0] : FOOD_CATEGORY_ORDER[0]);
        const result = await requestJSON("/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: defaultCategory, is_food: state.menuAdminType === 1, visible: true }),
        });
        upsertById(state.menu_items, result.item);
        state.menuAdminType = menuItemType(result.item);
        state.menuAdminCategory = result.item.category;
        renderMenuItems();
        syncSidebar();
        openMenuEditor(result.item.id);
        showToast("Новая позиция меню создана.");
    } catch (error) {
        showToast(error.message);
        setGlobalStatus(error.message, "error");
    }
}

async function deleteMenuItem(id) {
    await requestJSON(`/admin/menu-items/${id}`, { method: "DELETE" });
    state.menu_items = state.menu_items.filter((item) => item.id !== id);
    if (state.activeMenuItemId === id) {
        closeMenuEditor();
    }
    renderMenuItems();
    syncSidebar();
    showToast("Позиция меню удалена.");
}

function renderOrders() {
    if (!els.ordersList) return;
    if (!state.orders.length) {
        els.ordersList.innerHTML = `<div class="empty-card">Активных заказов пока нет.</div>`;
        return;
    }

    els.ordersList.innerHTML = state.orders
        .slice()
        .sort((a, b) => b.id - a.id)
        .map(
            (order) => `
                <article
                    class="order-card"
                    data-order-id="${order.id}"
                >
                    <div class="order-head">
                        <div class="card-title">Заказ #${order.id}</div>
                        <span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
                    </div>
                    <div class="order-meta">
                        <div class="order-kicker">${escapeHtml(order.customer_name)}</div>
                        <div class="order-note">${escapeHtml(order.customer_phone)}</div>
                        <div class="order-note">${escapeHtml(order.customer_address)}</div>
                    </div>
                    <ul class="order-items">
                        ${(order.order_details || [])
                            .slice(0, 3)
                            .map((item) => `<li>${escapeHtml(item.name)} × ${item.quantity}</li>`)
                            .join("")}
                        ${(order.order_details || []).length > 3 ? `<li>и ещё ${(order.order_details || []).length - 3}...</li>` : ""}
                    </ul>
                    <div class="order-head">
                        <strong class="order-total">${Number(order.total_price || 0).toFixed(0)} MDL</strong>
                    </div>
                    <div class="order-actions">
                        <select name="status">
                            ${["Новый", "Одобрен", "Отменен", "Доставлен"]
                                .map(
                                    (status) =>
                                        `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`,
                                )
                                .join("")}
                        </select>
                        <button class="primary-button" type="button" data-save-order="${order.id}">Обновить</button>
                        <button class="danger-button" type="button" data-delete-order="${order.id}">Удалить</button>
                    </div>
                </article>
            `,
        )
        .join("");

    els.ordersList.querySelectorAll("[data-save-order]").forEach((button) => {
        button.addEventListener("click", async (e) => {
            e.stopPropagation();
            const card = button.closest("[data-order-id]");
            const status = card.querySelector('[name="status"]').value;
            const result = await requestJSON(`/admin/orders/${button.dataset.saveOrder}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            upsertById(state.orders, result.order);
            renderOrders();
            syncSidebar();
            showToast("Статус заказа обновлён.");
        });
    });

    els.ordersList.querySelectorAll("[data-delete-order]").forEach((button) => {
        button.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!confirm("Удалить этот заказ?")) return;
            await requestJSON(`/admin/orders/${button.dataset.deleteOrder}`, { method: "DELETE" });
            state.orders = state.orders.filter((order) => order.id !== Number(button.dataset.deleteOrder));
            renderOrders();
            syncSidebar();
            showToast("Заказ удалён.");
        });
    });
}

function renderAll() {
    renderLabels();
    renderAds();
    if (state.bot_admins) renderBotAdmins();
    renderMenuItems();
    renderOrders();
    syncSidebar();
}

function renderBotAdmins() {
    if (!els.botAdminsList) return;
    if (!state.bot_admins?.length) {
        els.botAdminsList.innerHTML = `<div class="empty-card">Администраторы бота не добавлены.</div>`;
        return;
    }

    els.botAdminsList.innerHTML = state.bot_admins
        .map(
            (admin) => `
                <article class="admin-product-card ${!admin.is_active ? "is-disabled" : ""}" data-bot-admin-card="${admin.id}">
                    <div class="admin-product-media" style="background: #2a2a2a; display: flex; align-items: center; justify-content: center; aspect-ratio: 16/9;">
                        <i class="fa-brands fa-telegram" style="font-size: 3rem; color: #0088cc;"></i>
                    </div>
                    <div class="admin-product-meta">
                        <div class="admin-product-price-row">
                            <strong class="admin-product-price">${escapeHtml(admin.chat_id)}</strong>
                            <span class="status-badge ${admin.is_active ? "status-Одобрен" : "status-Отменен"}">${admin.is_active ? "Активен" : "Отключен"}</span>
                        </div>
                        <div class="admin-product-title">${escapeHtml(admin.name || "Без имени")}</div>
                    </div>
                </article>
            `,
        )
        .join("");

    els.botAdminsList.querySelectorAll("[data-bot-admin-card]").forEach((card) => {
        card.addEventListener("click", () => openBotAdminEditor(Number(card.dataset.botAdminCard)));
    });
}

function openBotAdminEditor(adminId) {
    state.activeBotAdminId = adminId;
    renderBotAdmins();
    renderBotAdminEditor();
    els.menuEditorDrawer?.classList.add("is-open");
    els.menuEditorBackdrop?.classList.add("is-visible");
}

function renderBotAdminEditor() {
    if (!els.menuEditorBody || !els.menuEditorTitle) return;
    const admin = state.bot_admins?.find((a) => a.id === state.activeBotAdminId);
    if (!admin) {
        els.menuEditorTitle.textContent = "Бот-админ";
        setMenuEditorStatus("Выберите администратора для редактирования.");
        els.menuEditorBody.innerHTML = `<div class="empty-card">Выберите администратора в сетке.</div>`;
        return;
    }

    els.menuEditorTitle.textContent = admin.name || admin.chat_id;
    setMenuEditorStatus("Ожидание сохранения");
    els.menuEditorBody.innerHTML = `
        <form id="bot-admin-editor-form" class="menu-editor-form" data-admin-id="${admin.id}">
            <div class="inline-fields">
                <label class="field span-6">
                    <span>Имя / Описание</span>
                    <input type="text" name="name" value="${escapeHtml(admin.name || "")}">
                </label>
                <label class="field span-6">
                    <span>Telegram Chat ID</span>
                    <input type="text" name="chat_id" value="${escapeHtml(admin.chat_id)}">
                </label>
                <label class="field span-12">
                    <label class="checkbox-field">
                        <input type="checkbox" name="is_active" ${admin.is_active ? "checked" : ""}>
                        <span>Активен (получает заказы)</span>
                    </label>
                </label>
            </div>
            <div class="upload-row">
                <button class="primary-button" type="submit">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Сохранить изменения</span>
                </button>
                <button class="danger-button" type="button" data-delete-bot-admin="${admin.id}">
                    <i class="fa-solid fa-trash"></i>
                    <span>Удалить</span>
                </button>
            </div>
        </form>
    `;

    const form = $("bot-admin-editor-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMenuEditorStatus("Сохраняю...", "saving");
        await saveBotAdminForm(form);
    });

    form.querySelector("[data-delete-bot-admin]")?.addEventListener("click", () => deleteBotAdmin(admin.id));
}

async function saveBotAdminForm(form) {
    const id = Number(form.dataset.adminId);
    const payload = {
        name: form.querySelector('[name="name"]').value,
        chat_id: form.querySelector('[name="chat_id"]').value,
        is_active: form.querySelector('[name="is_active"]').checked,
    };
    const result = await requestJSON(`/admin/bot-admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    upsertById(state.bot_admins, result.bot_admin);
    renderBotAdmins();
    renderBotAdminEditor();
    showToast("Данные администратора сохранены.");
}

async function createBotAdmin() {
    setGlobalStatus("Добавляю администратора...", "saving");
    try {
        const result = await requestJSON("/admin/bot-admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: "000000000", name: "Новый админ" }),
        });
        if (!state.bot_admins) state.bot_admins = [];
        state.bot_admins.unshift(result.bot_admin);
        renderBotAdmins();
        openBotAdminEditor(result.bot_admin.id);
        setGlobalStatus("Администратор добавлен");
    } catch (error) {
        showToast(error.message);
        setGlobalStatus(error.message, "error");
    }
}

async function deleteBotAdmin(id) {
    if (!confirm("Удалить этого администратора?")) return;
    await requestJSON(`/admin/bot-admins/${id}`, { method: "DELETE" });
    state.bot_admins = state.bot_admins.filter((a) => a.id !== id);
    if (state.activeBotAdminId === id) {
        state.activeBotAdminId = null;
        renderBotAdminEditor();
    }
    renderBotAdmins();
    showToast("Администратор удален.");
}

function bindToolbar() {
    els.addMenuItem.addEventListener("click", async () => {
        setGlobalStatus("Создаю позицию...", "saving");
        try {
            await createMenuItem();
            setGlobalStatus("Все изменения сохранены");
        } catch (error) {
            setGlobalStatus(error.message, "error");
            showToast(error.message);
        }
    });

    els.addLabel.addEventListener("click", async () => {
        setGlobalStatus("Создаю бейдж...", "saving");
        try {
            await createLabel();
            setGlobalStatus("Все изменения сохранены");
        } catch (error) {
            setGlobalStatus(error.message, "error");
            showToast(error.message);
        }
    });

    els.addAd.addEventListener("click", async () => {
        setGlobalStatus("Создаю баннер...", "saving");
        try {
            await createAd();
            setGlobalStatus("Все изменения сохранены");
        } catch (error) {
            setGlobalStatus(error.message, "error");
            showToast(error.message);
        }
    });

    els.addBotAdmin?.addEventListener("click", createBotAdmin);

    els.logoutAdmin.addEventListener("click", async () => {
        await requestJSON("/api/logout", { method: "POST" });
        window.location.href = "/";
    });
}

function bindSidebar() {
    els.adminSearch?.addEventListener("input", () => {
        applySearchFilter();
        renderMenuItems();
    });

    els.menuAdminTypeToggle?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-admin-menu-type]");
        if (!button) return;
        state.menuAdminType = Number(button.dataset.adminMenuType || 1);
        state.menuAdminCategory = "";
        renderMenuItems();
        renderNavigator();
        renderCategoryJumpLinks();
    });

    document.querySelectorAll("[data-admin-section-link]").forEach((button) => {
        button.addEventListener("click", () => {
            const node = $(button.dataset.adminSectionLink);
            if (!node) return;
            const offset = 140; // Toolbar + Header height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = node.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            
            // Highlight active link
            document.querySelectorAll("[data-admin-section-link]").forEach(b => b.classList.remove("is-active"));
            button.classList.add("is-active");
        });
    });

    els.menuEditorBackdrop?.addEventListener("click", closeMenuEditor);
    els.closeMenuEditor?.addEventListener("click", closeMenuEditor);
}

function cacheElements() {
    Object.assign(els, {
        saveIndicator: $("save-indicator"),
        addMenuItem: $("add-menu-item"),
        addLabel: $("add-label"),
        addAd: $("add-ad"),
        logoutAdmin: $("logout-admin"),
        pageContentForm: $("page-content-form"),
        labelsList: $("labels-list"),
        menuItemsList: $("menu-items-list"),
        adsList: $("ads-list"),
        ordersList: $("orders-list"),
        adminSearch: $("admin-search"),
        adminSummary: $("admin-summary"),
        menuNavigator: $("menu-navigator"),
        adminJumpCategories: $("admin-jump-categories"),
        menuCategoryChips: $("menu-category-chips"),
        botAdminsList: $("bot-admins-list"),
        addBotAdmin: $("add-bot-admin"),
        menuAdminTypeToggle: $("menu-admin-type-toggle"),
        menuEditorBackdrop: $("menu-editor-backdrop"),
        menuEditorDrawer: $("menu-editor-drawer"),
        closeMenuEditor: $("close-menu-editor"),
        menuEditorTitle: $("menu-editor-title"),
        menuEditorStatus: $("menu-editor-status"),
        menuEditorBody: $("menu-editor-body"),
        toast: $("admin-toast"),
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    bindToolbar();
    bindSidebar();
    renderAll();
});
