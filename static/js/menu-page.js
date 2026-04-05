const bootstrap = window.__FELIZ_MENU_BOOTSTRAP__ || {};
const productNameCopy = window.__FELIZ_PRODUCT_NAME_COPY__ || { ru: {}, en: {}, ro: {} };
const countryAliases = {
    CZ: "CZ",
    CZE: "CZ",
    CZECHIA: "CZ",
    "CZECH REPUBLIC": "CZ",
    "ЧЕХИЯ": "CZ",
    "ЧЕШСКАЯ РЕСПУБЛИКА": "CZ",
    MD: "MD",
    MDA: "MD",
    MOLDOVA: "MD",
    "REPUBLIC OF MOLDOVA": "MD",
    "МОЛДОВА": "MD",
    "РЕСПУБЛИКА МОЛДОВА": "MD",
};
const optimizedImageMap = {
    "/static/images/feliz.jpg": "/static/images/feliz.webp",
    "/static/images/felmob.png": "/static/images/felmob.webp",
    "/static/images/felpk.png": "/static/images/felpk.webp",
    "/static/images/image1.jpg": "/static/images/image1.webp",
    "/static/images/image2.png": "/static/images/image2.webp",
    "/static/images/image3.png": "/static/images/image3.webp",
    "/static/images/image6.png": "/static/images/image6.webp",
    "/static/images/image7.png": "/static/images/image7.webp",
};

const uiCopy = {
    ru: {
        home: "Главная",
        menu_nav: "Меню",
        ads_nav: "Предложения",
        profile: "Профиль",
        admin: "Админ",
        logout: "Выйти",
        login: "Войти",
        register: "Регистрация",
        view_menu: "Открыть меню",
        open_cart: "Корзина",
        landing_title: "Изысканный вкус",
        landing_subtitle: "Лучшие вина и авторская кухня.",
        our_menu: "Наше меню",
        menu_intro_subtitle: "Премиальная подача, чистая структура и быстрый заказ с любого устройства.",
        ads_kicker: "Спецпредложения и события",
        ads_heading: "Рекламный блок",
        ads_previous: "Предыдущий баннер",
        ads_next: "Следующий баннер",
        ads_description_default: "Подборка промо-карточек с быстрыми переходами к актуальным предложениям.",
        ad_placeholder_title: "Новый баннер",
        ad_placeholder_description: "Добавьте заголовок, описание, изображение и CTA через админ-панель.",
        food: "Еда",
        drinks: "Напитки",
        cart: "Корзина",
        cart_heading: "Ваш заказ",
        total: "Итого",
        checkout: "Оформить заказ",
        add_to_cart: "Добавить в корзину",
        email: "Email",
        password: "Пароль",
        name: "Имя",
        phone: "Телефон",
        address: "Адрес",
        checkout_heading: "Оформление заказа",
        confirm_order: "Подтвердить заказ",
        loading: "Загрузка меню...",
        empty_menu: "В этой категории пока нет позиций.",
        empty_ads: "Рекламные карточки пока не добавлены.",
        empty_cart: "Корзина пока пуста.",
        order_success: "Заказ сохранён. Спасибо.",
        auth_success: "Авторизация выполнена.",
        register_success: "Профиль создан.",
        error_common: "Не удалось выполнить запрос.",
    },
    en: {
        home: "Home",
        menu_nav: "Menu",
        ads_nav: "Offers",
        profile: "Profile",
        admin: "Admin",
        logout: "Logout",
        login: "Login",
        register: "Register",
        view_menu: "View menu",
        open_cart: "Cart",
        landing_title: "Exquisite Taste",
        landing_subtitle: "The best wines and signature cuisine.",
        our_menu: "Our Menu",
        menu_intro_subtitle: "Premium presentation, clean structure, and fast ordering from any device.",
        ads_kicker: "Special Offers and Events",
        ads_heading: "Advertising rail",
        ads_previous: "Previous banner",
        ads_next: "Next banner",
        ads_description_default: "A curated set of promo cards with quick access to current offers.",
        ad_placeholder_title: "New banner",
        ad_placeholder_description: "Add a title, description, image, and CTA in the admin panel.",
        food: "Food",
        drinks: "Drinks",
        cart: "Cart",
        cart_heading: "Your order",
        total: "Total",
        checkout: "Checkout",
        add_to_cart: "Add to cart",
        email: "Email",
        password: "Password",
        name: "Name",
        phone: "Phone",
        address: "Address",
        checkout_heading: "Checkout",
        confirm_order: "Confirm order",
        loading: "Loading menu...",
        empty_menu: "No items available in this category.",
        empty_ads: "No advertising cards yet.",
        empty_cart: "Your cart is empty.",
        order_success: "Order placed successfully.",
        auth_success: "Signed in.",
        register_success: "Account created.",
        error_common: "Request failed.",
    },
    ro: {
        home: "Acasă",
        menu_nav: "Meniu",
        ads_nav: "Oferte",
        profile: "Profil",
        admin: "Admin",
        logout: "Ieșire",
        login: "Autentificare",
        register: "Înregistrare",
        view_menu: "Deschide meniul",
        open_cart: "Coș",
        landing_title: "Gust Rafinat",
        landing_subtitle: "Cele mai bune vinuri și bucătărie de autor.",
        our_menu: "Meniul Nostru",
        menu_intro_subtitle: "Prezentare premium, structură clară și comandă rapidă de pe orice dispozitiv.",
        ads_kicker: "Promoții și evenimente",
        ads_heading: "Bandă promoțională",
        ads_previous: "Bannerul anterior",
        ads_next: "Bannerul următor",
        ads_description_default: "Selecție de carduri promoționale cu acces rapid la ofertele curente.",
        ad_placeholder_title: "Banner nou",
        ad_placeholder_description: "Adăugați titlu, descriere, imagine și CTA din panoul de administrare.",
        food: "Mâncare",
        drinks: "Băuturi",
        cart: "Coș",
        cart_heading: "Comanda ta",
        total: "Total",
        checkout: "Finalizează comanda",
        add_to_cart: "Adaugă în coș",
        email: "Email",
        password: "Parolă",
        name: "Nume",
        phone: "Telefon",
        address: "Adresă",
        checkout_heading: "Finalizare comandă",
        confirm_order: "Confirmă comanda",
        loading: "Se încarcă meniul...",
        empty_menu: "Nu există produse în această categorie.",
        empty_ads: "Nu există carduri promoționale.",
        empty_cart: "Coșul este gol.",
        order_success: "Comanda a fost trimisă.",
        auth_success: "Autentificare reușită.",
        register_success: "Contul a fost creat.",
        error_common: "Cererea a eșuat.",
    },
};

const pageCopyKeys = {
    hero_title: "landing_title",
    hero_subtitle: "landing_subtitle",
    menu_title: "our_menu",
    menu_subtitle: "menu_intro_subtitle",
    ads_title: "ads_kicker",
    ads_subtitle: "ads_description_default",
};

const categoryCopy = {
    "Завтрак / Breakfast": { ru: "Завтрак", en: "Breakfast", ro: "Mic dejun" },
    "Супы / Soups": { ru: "Супы", en: "Soups", ro: "Ciorbe" },
    "Закуски / Appetizers": { ru: "Закуски", en: "Appetizers", ro: "Aperitive" },
    "Салаты / Salads": { ru: "Салаты", en: "Salads", ro: "Salate" },
    "Морепродукты и Рыба / Seafood and Fish": { ru: "Морепродукты и Рыба", en: "Seafood and Fish", ro: "Fructe de mare și pește" },
    "Паста / Pasta": { ru: "Паста", en: "Pasta", ro: "Paste" },
    "Мясные блюда / Meat Dishes": { ru: "Мясные блюда", en: "Meat Dishes", ro: "Preparate din carne" },
    "Бургеры и другое / Burgers & More": { ru: "Бургеры и другое", en: "Burgers & More", ro: "Burgeri și altele" },
    "Десерты / Desserts": { ru: "Десерты", en: "Desserts", ro: "Deserturi" },
    "Кофе / Coffee": { ru: "Кофе", en: "Coffee", ro: "Cafea" },
    "Чай / Tea": { ru: "Чай", en: "Tea", ro: "Ceai" },
    "Соки и Вода / Juices & Water": { ru: "Соки и Вода", en: "Juices & Water", ro: "Sucuri și Apă" },
    "Пиво и закуски / Beer & Snacks": { ru: "Пиво и закуски", en: "Beer & Snacks", ro: "Bere și gustări" },
    "Безалкогольные коктейли / Non-alcoholic cocktails": { ru: "Безалкогольные коктейли", en: "Non-alcoholic cocktails", ro: "Cocktail-uri fără alcool" },
    "Алкогольные коктейли / Alcoholic cocktails": { ru: "Алкогольные коктейли", en: "Alcoholic cocktails", ro: "Cocktail-uri alcoolice" },
    "Виски / Whisky": { ru: "Виски", en: "Whisky", ro: "Whisky" },
    "Коньяк / Divin": { ru: "Коньяк", en: "Divin", ro: "Divin" },
    "Игристые / Sparkling": { ru: "Игристые", en: "Sparkling", ro: "Spumante" },
    "Белые вина / White Wines": { ru: "Белые вина", en: "White Wines", ro: "Vinuri albe" },
    "Розовые вина / Rosé Wines": { ru: "Розовые вина", en: "Rosé Wines", ro: "Vinuri rose" },
    "Красные вина / Red Wines": { ru: "Красные вина", en: "Red Wines", ro: "Vinuri roșii" },
};

const fallbackAdPresets = [
    {
        id: "fallback-dinner",
        sort_order: 10,
        image_url: "/static/images/image1.webp",
        payload: {
            eyebrow: "Feliz Wine Bar",
            title_ru: "Авторские ужины",
            title_ro: "Cine de autor",
            title_en: "Signature Dinners",
            description_ru: "Новые вечерние сеты с акцентом на морепродукты и бокальные вина.",
            description_ro: "Seturi de seară noi cu accent pe fructe de mare și vinuri la pahar.",
            description_en: "New evening sets focused on seafood and wines by the glass.",
            cta_text_ru: "Открыть меню",
            cta_text_ro: "Deschide meniul",
            cta_text_en: "Open menu",
        },
        cta_url: "/menu",
    },
    {
        id: "fallback-breakfast",
        sort_order: 20,
        image_url: "/static/images/image2.webp",
        payload: {
            eyebrow: "Feliz Wine Bar",
            title_ru: "Лёгкие завтраки",
            title_ro: "Mic dejun lejer",
            title_en: "Light Breakfasts",
            description_ru: "Утренняя подача, кофе и быстрый сервис для гостей на вынос и в зале.",
            description_ro: "Servire matinală, cafea și ritm rapid pentru oaspeții din sală sau la pachet.",
            description_en: "Morning service, coffee, and a fast rhythm for dine-in and takeaway guests.",
            cta_text_ru: "Посмотреть завтрак",
            cta_text_ro: "Vezi micul dejun",
            cta_text_en: "View breakfast",
        },
        cta_url: "/menu",
    },
    {
        id: "fallback-wine",
        sort_order: 30,
        image_url: "/static/images/image3.webp",
        payload: {
            eyebrow: "Feliz Wine Bar",
            title_ru: "Винная карта",
            title_ro: "Carta de vinuri",
            title_en: "Wine List",
            description_ru: "Белые, красные и игристые позиции можно выделять отдельным промо-блоком.",
            description_ro: "Pozițiile albe, rose, roșii și spumante pot fi promovate separat.",
            description_en: "White, rose, red, and sparkling bottles can be promoted with a dedicated card.",
            cta_text_ru: "Смотреть вина",
            cta_text_ro: "Vezi vinurile",
            cta_text_en: "View wines",
        },
        cta_url: "/menu",
    },
    {
        id: "fallback-geo",
        sort_order: 40,
        image_url: "/static/images/image6.webp",
        payload: {
            eyebrow: "Geo Block",
            title_ru: "Локальное предложение CZ & MD",
            title_ro: "Ofertă locală CZ & MD",
            title_en: "Local Offer CZ & MD",
            description_ru: "Этот баннер показывается только гостям из Чехии и Молдовы.",
            description_ro: "Acest banner este vizibil doar pentru oaspeții din Cehia și Moldova.",
            description_en: "This banner is visible only to guests from Czechia and Moldova.",
            cta_text_ru: "Открыть меню",
            cta_text_ro: "Deschide meniul",
            cta_text_en: "Open menu",
            allowed_countries: ["CZ", "MD"],
        },
        cta_url: "/menu",
    },
];

const state = {
    language: localStorage.getItem("feliz-language") || "ro",
    filter: 1,
    user: bootstrap.user || null,
    pageContent: bootstrap.pageContent || {},
    geoCountry: null,
    cart: [],
    menuSections: [],
    menuIndex: new Map(),
    ads: [],
    currentProduct: null,
    quantity: 1,
    observer: null,
    currentAdIndex: 0,
    adsAutoTimer: null,
    adsPauseUntil: 0,
};

const els = {};

function copy(key) {
    return (uiCopy[state.language] && uiCopy[state.language][key]) || uiCopy.ru[key] || key;
}

function pageCopy(key) {
    const payload = state.pageContent?.payload || {};
    const languageSpecificValue = payload[`${key}_${state.language}`];
    if (typeof languageSpecificValue === "string" && languageSpecificValue.trim()) {
        return languageSpecificValue.trim();
    }
    const uiKey = pageCopyKeys[key];
    if (uiKey) {
        return copy(uiKey);
    }
    const genericValue = payload[key];
    if (typeof genericValue === "string" && genericValue.trim()) {
        return genericValue.trim();
    }
    return "";
}

function normalizeCountryCode(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const rawValue = String(value).trim().toUpperCase();
    if (!rawValue || rawValue === "XX" || rawValue === "ZZ" || rawValue === "UNKNOWN") {
        return null;
    }
    if (countryAliases[rawValue]) {
        return countryAliases[rawValue];
    }
    return rawValue.length === 2 && /^[A-Z]+$/.test(rawValue) ? rawValue : null;
}

function parseAllowedCountries(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeCountryCode(entry)).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((entry) => normalizeCountryCode(entry))
            .filter(Boolean);
    }
    return [];
}

function adAllowedCountries(item) {
    return parseAllowedCountries(item?.allowed_countries || item?.payload?.allowed_countries);
}

function adField(item, field, fallback = "") {
    const payload = item?.payload || {};
    const localizedValue = payload[`${field}_${state.language}`];
    if (typeof localizedValue === "string" && localizedValue.trim()) {
        return localizedValue.trim();
    }
    const genericPayloadValue = payload[field];
    if (typeof genericPayloadValue === "string" && genericPayloadValue.trim()) {
        return genericPayloadValue.trim();
    }
    const topLevelValue = item?.[field];
    if (typeof topLevelValue === "string" && topLevelValue.trim()) {
        return topLevelValue.trim();
    }
    return fallback;
}

function translateCategory(category) {
    return categoryCopy[category]?.[state.language] || category.split("/")[0].trim();
}

function translateProductName(name) {
    return (productNameCopy[state.language] && productNameCopy[state.language][name]) || name;
}

function formatPrice(value) {
    return `${Number(value || 0).toFixed(0)} MDL`;
}

function resolveImageUrl(value, fallback) {
    const candidate = String(value || "").trim();
    if (!candidate) return fallback;
    if (optimizedImageMap[candidate]) {
        return optimizedImageMap[candidate];
    }
    if (
        candidate.startsWith("http://")
        || candidate.startsWith("https://")
        || candidate.startsWith("/static/")
        || candidate.startsWith("/uploads/")
    ) {
        return candidate;
    }
    return fallback;
}

function buildFallbackAds() {
    return fallbackAdPresets.map((ad) => ({
        ...ad,
        allowed_countries: adAllowedCountries(ad),
        payload: { ...(ad.payload || {}) },
        visible: true,
    }));
}

function shouldRenderAdForCountry(item) {
    const allowedCountries = adAllowedCountries(item);
    if (!allowedCountries.length) {
        return true;
    }
    return Boolean(state.geoCountry && allowedCountries.includes(state.geoCountry));
}

function buildDisplayAds(items = []) {
    const configuredAds = items
        .filter((item) => item && item.visible !== false)
        .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
        .map((item) => ({
            ...item,
            allowed_countries: adAllowedCountries(item),
            payload: { ...(item.payload || {}) },
        }));

    if (!configuredAds.length) {
        return [];
    }

    return configuredAds.filter((item) => shouldRenderAdForCountry(item));
}

function buildAdsRequestUrl() {
    const url = new URL("/api/ads", window.location.origin);
    if (state.geoCountry) {
        url.searchParams.set("country", state.geoCountry);
    }
    if (state.user?.is_admin) {
        url.searchParams.set("preview", "1");
    }
    return `${url.pathname}${url.search}`;
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function requestJSON(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;
    if (!response.ok) {
        throw new Error(payload?.message || copy("error_common"));
    }
    return payload;
}

function showToast(message) {
    if (!els.toast) {
        return;
    }
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

function updateStaticCopy() {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-copy]").forEach((node) => {
        node.textContent = copy(node.dataset.copy);
    });
    document.querySelectorAll("[data-page-copy]").forEach((node) => {
        const value = pageCopy(node.dataset.pageCopy);
        if (value) {
            node.textContent = value;
        }
    });
    document.querySelectorAll(".lang-switcher").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.lang === state.language);
    });
    if (els.adsPrevButton) {
        const prevLabel = copy("ads_previous");
        els.adsPrevButton.setAttribute("aria-label", prevLabel);
        els.adsPrevButton.setAttribute("title", prevLabel);
    }
    if (els.adsNextButton) {
        const nextLabel = copy("ads_next");
        els.adsNextButton.setAttribute("aria-label", nextLabel);
        els.adsNextButton.setAttribute("title", nextLabel);
    }
    renderCart();
    renderMenu();
    renderAds();
}

function setLanguage(language) {
    state.language = language;
    localStorage.setItem("feliz-language", language);
    updateStaticCopy();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-visible");
    syncBodyLock();
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("is-visible");
    syncBodyLock();
}

function syncBodyLock() {
    const modalOpen = document.querySelector(".modal.is-visible");
    const cartOpen = els.cartDrawer?.classList.contains("is-open");
    if (els.drawerBackdrop) {
        els.drawerBackdrop.classList.toggle("is-visible", Boolean(modalOpen || cartOpen));
    }
    document.body.style.overflow = modalOpen || cartOpen ? "hidden" : "";
}

function openCart() {
    els.cartDrawer?.classList.add("is-open");
    syncBodyLock();
}

function closeCart() {
    els.cartDrawer?.classList.remove("is-open");
    syncBodyLock();
}

function updateCartBadges() {
    const quantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    [els.cartBadgeDesktop, els.cartBadgeMobile, els.cartBadgeFloating].forEach((badge) => {
        if (badge) badge.textContent = quantity;
    });
}

function renderCart() {
    if (!els.cartItems) return;

    updateCartBadges();
    const total = state.cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    if (els.cartTotal) {
        els.cartTotal.textContent = formatPrice(total);
    }

    if (state.cart.length === 0) {
        els.cartItems.innerHTML = `<div class="empty-state">${copy("empty_cart")}</div>`;
        return;
    }

    els.cartItems.innerHTML = state.cart
        .map(
            (item) => `
                <article class="cart-item">
                    <div class="cart-item-head">
                            <div>
                            <div class="cart-item-title">${escapeHtml(translateProductName(item.name))}</div>
                            <div class="cart-item-subtitle">${escapeHtml(item.category || "")}</div>
                        </div>
                        <strong>${formatPrice(item.price * item.quantity)}</strong>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-subtitle">${formatPrice(item.price)} × ${item.quantity}</span>
                        <div class="quantity-picker">
                            <button class="quantity-button" type="button" data-cart-action="decrease" data-item-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-button" type="button" data-cart-action="increase" data-item-id="${item.id}">+</button>
                            <button class="quantity-button" type="button" data-cart-action="remove" data-item-id="${item.id}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </article>
            `,
        )
        .join("");
}

function addToCart(item, quantity = 1) {
    const existing = state.cart.find((entry) => entry.id === item.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        state.cart.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: translateCategory(item.category),
            quantity,
        });
    }
    renderCart();
    showToast(`${translateProductName(item.name)} • ${copy("add_to_cart")}`);
}

function updateCartItem(itemId, action) {
    const item = state.cart.find((entry) => entry.id === itemId);
    if (!item) return;
    if (action === "increase") item.quantity += 1;
    if (action === "decrease") item.quantity -= 1;
    if (action === "remove" || item.quantity <= 0) {
        state.cart = state.cart.filter((entry) => entry.id !== itemId);
    }
    renderCart();
}

function openProduct(itemId) {
    const item = state.menuIndex.get(itemId);
    if (!item) return;

    state.currentProduct = item;
    state.quantity = 1;
    els.quantityValue.textContent = String(state.quantity);
    els.productTitle.textContent = translateProductName(item.name);
    els.productDescription.textContent = item.description || "";
    els.productPrice.textContent = formatPrice(item.price);
    els.productCategory.textContent = translateCategory(item.category);
    els.productImage.src = resolveImageUrl(item.image_url, "/static/images/image7.webp");
    els.productImage.alt = item.name;
    if (item.label?.badge_text) {
        els.productBadge.classList.remove("hidden");
        els.productBadge.textContent = item.label.badge_text;
        els.productBadge.style.background = item.label.color || "#d6a95f";
    } else {
        els.productBadge.classList.add("hidden");
    }
    openModal("product-modal");
}

function renderMenu() {
    if (!els.menuGrid || !els.categoriesRail) return;

    if (!state.menuSections.length) {
        els.menuGrid.innerHTML = `<div class="loading-state">${copy("loading")}</div>`;
        els.categoriesRail.innerHTML = "";
        return;
    }

    state.menuIndex.clear();
    els.categoriesRail.scrollLeft = 0;
    els.categoriesRail.innerHTML = state.menuSections
        .map(
            (section, index) => `
                <button class="category-chip ${index === 0 ? "is-active" : ""}" type="button" data-section-target="section-${index}">
                    ${escapeHtml(translateCategory(section.category))}
                </button>
            `,
        )
        .join("");

    els.menuGrid.innerHTML = state.menuSections
        .map((section, index) => {
            const itemsMarkup = section.items.length
                ? section.items
                      .map((item) => {
                          state.menuIndex.set(item.id, item);
                          return `
                              <article class="menu-card" data-open-item="${item.id}">
                                  ${item.label?.badge_text ? `<span class="product-badge" style="background:${escapeHtml(item.label.color || "#d6a95f")}">${escapeHtml(item.label.badge_text)}</span>` : ""}
                                  <div class="menu-card-media">
                                      <img class="menu-card-image" src="${escapeHtml(resolveImageUrl(item.image_url, "/static/images/image6.webp"))}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
                                  </div>
                                  <div class="menu-card-meta">
                                      <div class="menu-card-price-row">
                                          <strong class="menu-card-price">${formatPrice(item.price)}</strong>
                                          <button class="menu-card-button" type="button" data-add-item="${item.id}" aria-label="${copy("add_to_cart")}">
                                              <i class="fa-solid fa-plus"></i>
                                          </button>
                                      </div>
                                      <div class="menu-card-titlebar">${escapeHtml(translateProductName(item.name))}</div>
                                      ${item.description ? `<p class="menu-card-note">${escapeHtml(item.description)}</p>` : ""}
                                  </div>
                              </article>
                          `;
                      })
                      .join("")
                : `<div class="empty-state">${copy("empty_menu")}</div>`;

            return `
                <section class="menu-category" id="section-${index}">
                    <div class="menu-category-title-wrap">
                        <span class="menu-category-line"></span>
                        <h3 class="menu-category-title">${escapeHtml(translateCategory(section.category))}</h3>
                        <span class="menu-category-line"></span>
                    </div>
                    <div class="menu-category-items">${itemsMarkup}</div>
                </section>
            `;
        })
        .join("");

    bindCategoryObserver();
}

function bindCategoryObserver() {
    if (state.observer) {
        state.observer.disconnect();
    }
    const chips = Array.from(document.querySelectorAll("[data-section-target]"));
    const sections = Array.from(document.querySelectorAll(".menu-category"));
    if (!chips.length || !sections.length) return;

    state.observer = new IntersectionObserver(
        (entries) => {
            if (state.isUserScrolling) return;

            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                
                // Use requestAnimationFrame to avoid blocking the main thread during scroll
                requestAnimationFrame(() => {
                    chips.forEach((chip) => {
                        const isActive = chip.dataset.sectionTarget === entry.target.id;
                        if (chip.classList.contains("is-active") === isActive) return;
                        
                        chip.classList.toggle("is-active", isActive);
                        if (isActive) {
                            chip.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
                        }
                    });
                });
            });
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => state.observer.observe(section));
}

function getAdCards() {
    return Array.from(els.adsTrack?.querySelectorAll(".ad-card") || []);
}

function getAdsGap() {
    if (!els.adsTrack) return 14;
    const gap = Number.parseFloat(window.getComputedStyle(els.adsTrack).gap);
    return Number.isFinite(gap) ? gap : 14;
}

function getAdsMaxScrollLeft() {
    if (!els.adsScroller) return 0;
    return Math.max(0, els.adsScroller.scrollWidth - els.adsScroller.clientWidth);
}

function updateAdsLayout() {
    const cards = getAdCards();
    if (!els.adsTrack || !els.adsScroller || !cards.length) return;

    const viewportWidth = els.adsScroller.clientWidth;
    if (!viewportWidth) return;

    const isDesktop = window.matchMedia("(min-width: 900px)").matches;
    const isSingle = cards.length === 1;
    const gap = getAdsGap();
    let cardWidth = viewportWidth;

    if (isSingle) {
        cardWidth = isDesktop ? Math.min(viewportWidth, 340) : viewportWidth;
    } else {
        const visibleCards = isDesktop ? Math.min(3, cards.length) : 1;
        cardWidth = (viewportWidth - gap * (visibleCards - 1)) / visibleCards;
    }

    els.adsTrack.classList.toggle("is-single", isSingle);
    els.adsTrack.style.setProperty("--ad-card-width", `${Math.max(220, Math.floor(cardWidth))}px`);
}

function getCurrentAdIndex() {
    const cards = getAdCards();
    if (!cards.length || !els.adsScroller) return 0;

    const scrollLeft = els.adsScroller.scrollLeft;
    let currentIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - scrollLeft);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            currentIndex = index;
        }
    });

    return currentIndex;
}

function setActiveAdDot(index) {
    if (!els.adsDots) return;
    els.adsDots.querySelectorAll("[data-ad-dot]").forEach((dot) => {
        dot.classList.toggle("is-active", Number(dot.dataset.adDot) === index);
    });
}

function scrollToAd(index, behavior = "auto") {
    const cards = getAdCards();
    if (!cards.length || !els.adsScroller) return;

    const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
    const maxScrollLeft = getAdsMaxScrollLeft();
    const targetLeft = cards.length === 1 ? 0 : Math.min(cards[safeIndex].offsetLeft, maxScrollLeft);

    state.currentAdIndex = safeIndex;
    els.adsScroller.scrollTo({ left: targetLeft, behavior });
    window.requestAnimationFrame(syncAdsPagination);
}

function syncAdsPagination() {
    const cards = getAdCards();
    const currentIndex = getCurrentAdIndex();
    const maxScrollLeft = getAdsMaxScrollLeft();
    const hasOverflow = cards.length > 1 && maxScrollLeft > 4;

    state.currentAdIndex = currentIndex;
    setActiveAdDot(currentIndex);

    if (els.adsPrevButton) {
        els.adsPrevButton.disabled = !hasOverflow || els.adsScroller.scrollLeft <= 4;
    }
    if (els.adsNextButton) {
        els.adsNextButton.disabled = !hasOverflow || els.adsScroller.scrollLeft >= maxScrollLeft - 4;
    }
}

function stopAdsAutoplay() {
    window.clearInterval(state.adsAutoTimer);
    state.adsAutoTimer = null;
}

function startAdsAutoplay() {
    stopAdsAutoplay();
}

function renderAds() {
    if (!els.adsTrack) return;
    const previousIndex = state.currentAdIndex;

    if (!state.ads.length) {
        els.adsTrack.innerHTML = `
            <article class="ad-card ad-card-placeholder">
                <div class="ad-card-content">
                    <p class="section-label ad-card-eyebrow">Feliz Wine Bar</p>
                    <h3 class="ad-card-title">${escapeHtml(copy("ads_heading"))}</h3>
                    <p class="ad-card-description">${escapeHtml(copy("empty_ads"))}</p>
                </div>
            </article>
        `;
        if (els.adsDots) {
            els.adsDots.innerHTML = "";
        }
        state.currentAdIndex = 0;
        initialiseAdsCarousel();
        return;
    }

    const cards = state.ads
        .map(
            (item, index) => {
                const title = adField(item, "title", copy("ad_placeholder_title"));
                const description = adField(item, "description", copy("ad_placeholder_description"));
                const eyebrow = adField(item, "eyebrow");
                const ctaText = adField(item, "cta_text");
                const ctaUrl = adField(item, "cta_url");
                const allowedCountries = adAllowedCountries(item);

                return `
                <article class="ad-card" data-ad-index="${index}" style="--ad-image:url('${escapeHtml(resolveImageUrl(item.image_url, "/static/images/image1.webp"))}')">
                    <div class="ad-card-content">
                        ${eyebrow ? `<p class="section-label ad-card-eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
                        <h3 class="ad-card-title">${escapeHtml(title)}</h3>
                        <p class="ad-card-description">${escapeHtml(description)}</p>
                        <div class="ad-card-footer">
                            ${ctaText && ctaUrl ? `<a class="ad-card-link" href="${escapeHtml(ctaUrl)}">${escapeHtml(ctaText)}</a>` : ""}
                            ${allowedCountries.length ? `<span class="ad-card-geo">${escapeHtml(allowedCountries.join(" · "))}</span>` : ""}
                        </div>
                    </div>
                </article>
            `;
            },
        )
        .join("");

    els.adsTrack.innerHTML = cards;
    if (els.adsDots) {
        els.adsDots.innerHTML = "";
    }
    state.currentAdIndex = Math.min(previousIndex, state.ads.length - 1);
    initialiseAdsCarousel();
}

function initialiseAdsCarousel() {
    stopAdsAutoplay();
    updateAdsLayout();
    scrollToAd(state.currentAdIndex, "auto");
    syncAdsPagination();
}

function pauseAdsAutoScroll(delay = 2200) {
    state.adsPauseUntil = Date.now() + delay;
}

function attachAdsDrag() {
    return;
}

async function fetchMenu() {
    els.menuGrid.innerHTML = `<div class="loading-state">${copy("loading")}</div>`;
    try {
        state.menuSections = await requestJSON(`/api/get_menu?is_food=${state.filter}`);
        renderMenu();
    } catch (error) {
        els.menuGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    }
}

async function fetchAds() {
    let remoteAds = [];
    try {
        remoteAds = await requestJSON(buildAdsRequestUrl());
    } catch (error) {
        console.error("Failed to load ads, using fallback cards instead.", error);
    }
    state.ads = buildDisplayAds(remoteAds);
    renderAds();
}

async function handleCheckout(event) {
    event.preventDefault();
    if (!state.cart.length) {
        showToast(copy("empty_cart"));
        return;
    }

    const body = {
        name: els.checkoutName.value.trim(),
        phone: els.checkoutPhone.value.trim(),
        address: els.checkoutAddress.value.trim(),
        cart: state.cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    };

    try {
        await requestJSON("/api/place_order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        state.cart = [];
        renderCart();
        closeModal("checkout-modal");
        closeCart();
        event.target.reset();
        showToast(copy("order_success"));
    } catch (error) {
        showToast(error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    try {
        const result = await requestJSON("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: els.loginEmail.value.trim(),
                password: els.loginPassword.value,
            }),
        });
        showToast(copy("auth_success"));
        const redirectUrl = result?.redirect_url || (result?.user?.is_admin ? "/admin/dashboard" : "/profile");
        window.setTimeout(() => {
            window.location.href = redirectUrl;
        }, 300);
    } catch (error) {
        showToast(error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    try {
        const result = await requestJSON("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: els.registerName.value.trim(),
                email: els.registerEmail.value.trim(),
                phone: els.registerPhone.value.trim(),
                password: els.registerPassword.value,
            }),
        });
        showToast(copy("register_success"));
        const redirectUrl = result?.redirect_url || "/profile";
        window.setTimeout(() => {
            window.location.href = redirectUrl;
        }, 300);
    } catch (error) {
        showToast(error.message);
    }
}

async function handleLogout() {
    try {
        await requestJSON("/api/logout", { method: "POST" });
    } finally {
        window.location.reload();
    }
}

function toggleAuthTab(mode) {
    const isLogin = mode === "login";
    els.loginTab.classList.toggle("is-active", isLogin);
    els.registerTab.classList.toggle("is-active", !isLogin);
    els.loginForm.classList.toggle("hidden", !isLogin);
    els.registerForm.classList.toggle("hidden", isLogin);
}

function bindEvents() {
    document.querySelectorAll(".lang-switcher").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    els.adsPrevButton?.addEventListener("click", () => {
        scrollToAd(getCurrentAdIndex() - 1, "smooth");
    });

    els.adsNextButton?.addEventListener("click", () => {
        scrollToAd(getCurrentAdIndex() + 1, "smooth");
    });

    els.foodToggle.addEventListener("click", () => {
        if (state.filter === 1) return;
        state.filter = 1;
        els.foodToggle.classList.add("is-active");
        els.drinksToggle.classList.remove("is-active");
        fetchMenu();
    });

    els.drinksToggle.addEventListener("click", () => {
        if (state.filter === 0) return;
        state.filter = 0;
        els.drinksToggle.classList.add("is-active");
        els.foodToggle.classList.remove("is-active");
        fetchMenu();
    });

    els.menuGrid.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-add-item]");
        if (addButton) {
            event.stopPropagation();
            const item = state.menuIndex.get(Number(addButton.dataset.addItem));
            if (item) addToCart(item, 1);
            return;
        }

        const card = event.target.closest("[data-open-item]");
        if (card) {
            openProduct(Number(card.dataset.openItem));
        }
    });

    els.categoriesRail.addEventListener("click", (event) => {
        const button = event.target.closest("[data-section-target]");
        if (!button) return;
        const target = document.getElementById(button.dataset.sectionTarget);
        if (target) {
            // Disable observer during instant scroll
            state.isUserScrolling = true;
            
            // Highlight the clicked chip immediately
            document.querySelectorAll(".category-chip").forEach(c => c.classList.remove("is-active"));
            button.classList.add("is-active");
            button.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });

            const headerHeight = 72;
            const categoriesHeight = document.querySelector('.categories-section')?.offsetHeight || 0;
            const offset = headerHeight + categoriesHeight - 10;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: "auto" // Changed from instant to auto to ensure it works across browsers but still fast
            });

            // Re-enable observer after a very short delay
            setTimeout(() => {
                state.isUserScrolling = false;
            }, 50);
        }
    });

    els.scrollToMenuButton?.addEventListener("click", () => {
        els.menuGrid?.scrollIntoView({ behavior: "auto", block: "start" });
    });

    [els.desktopCartButton, els.mobileCartButton, els.floatingCart, els.heroOpenCart].forEach((button) => {
        button?.addEventListener("click", openCart);
    });
    els.closeCartDrawer?.addEventListener("click", closeCart);
    els.drawerBackdrop?.addEventListener("click", () => {
        closeCart();
        document.querySelectorAll(".modal.is-visible").forEach((modal) => modal.classList.remove("is-visible"));
        syncBodyLock();
    });

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.dataset.closeModal));
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    els.quantityMinus.addEventListener("click", () => {
        state.quantity = Math.max(1, state.quantity - 1);
        els.quantityValue.textContent = String(state.quantity);
    });

    els.quantityPlus.addEventListener("click", () => {
        state.quantity += 1;
        els.quantityValue.textContent = String(state.quantity);
    });

    els.addToCartButton.addEventListener("click", () => {
        if (!state.currentProduct) return;
        addToCart(state.currentProduct, state.quantity);
        closeModal("product-modal");
    });

    els.cartItems.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-cart-action]");
        if (!actionButton) return;
        updateCartItem(Number(actionButton.dataset.itemId), actionButton.dataset.cartAction);
    });

    els.checkoutButton.addEventListener("click", () => {
        if (!state.cart.length) {
            showToast(copy("empty_cart"));
            return;
        }
        openModal("checkout-modal");
    });

    els.checkoutForm.addEventListener("submit", handleCheckout);

    els.openAuthButton?.addEventListener("click", () => {
        toggleAuthTab("login");
        openModal("auth-modal");
    });

    els.mobileAuthButton?.addEventListener("click", () => {
        if (state.user) {
            window.location.href = state.user.is_admin ? "/admin/dashboard" : "/profile";
            return;
        }
        toggleAuthTab("login");
        openModal("auth-modal");
    });

    els.loginTab.addEventListener("click", () => toggleAuthTab("login"));
    els.registerTab.addEventListener("click", () => toggleAuthTab("register"));
    els.loginForm.addEventListener("submit", handleLogin);
    els.registerForm.addEventListener("submit", handleRegister);
    els.logoutButton?.addEventListener("click", handleLogout);

    els.adsScroller?.addEventListener("scroll", () => {
        pauseAdsAutoScroll(2200);
        window.clearTimeout(bindEvents.adsScrollTimer);
        bindEvents.adsScrollTimer = window.setTimeout(syncAdsPagination, 80);
    });

    window.addEventListener("resize", () => {
        window.clearTimeout(bindEvents.adsResizeTimer);
        bindEvents.adsResizeTimer = window.setTimeout(() => {
            updateAdsLayout();
            scrollToAd(Math.min(state.currentAdIndex, Math.max(0, getAdCards().length - 1)), "auto");
        }, 120);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCart();
            document.querySelectorAll(".modal.is-visible").forEach((modal) => modal.classList.remove("is-visible"));
            syncBodyLock();
        }
    });
}

function cacheElements() {
    Object.assign(els, {
        adsDots: document.getElementById("ads-dots"),
        adsPrevButton: document.getElementById("ads-prev-button"),
        adsNextButton: document.getElementById("ads-next-button"),
        adsScroller: document.getElementById("ads-scroller"),
        adsTrack: document.getElementById("ads-track"),
        menuGrid: document.getElementById("menu-grid"),
        categoriesRail: document.getElementById("categories-rail"),
        foodToggle: document.getElementById("food-toggle"),
        drinksToggle: document.getElementById("drinks-toggle"),
        scrollToMenuButton: document.getElementById("scroll-to-menu-button"),
        desktopCartButton: document.getElementById("desktop-cart-button"),
        mobileCartButton: document.getElementById("mobile-cart-button"),
        floatingCart: document.getElementById("floating-cart"),
        heroOpenCart: document.getElementById("hero-open-cart"),
        cartDrawer: document.getElementById("cart-drawer"),
        closeCartDrawer: document.getElementById("close-cart-drawer"),
        drawerBackdrop: document.getElementById("drawer-backdrop"),
        cartItems: document.getElementById("cart-items"),
        cartTotal: document.getElementById("cart-total"),
        cartBadgeDesktop: document.getElementById("cart-badge-desktop"),
        cartBadgeMobile: document.getElementById("cart-badge-mobile"),
        cartBadgeFloating: document.getElementById("cart-badge-floating"),
        checkoutButton: document.getElementById("checkout-button"),
        checkoutForm: document.getElementById("checkout-form"),
        checkoutName: document.getElementById("checkout-name"),
        checkoutPhone: document.getElementById("checkout-phone"),
        checkoutAddress: document.getElementById("checkout-address"),
        openAuthButton: document.getElementById("open-auth-button"),
        mobileAuthButton: document.getElementById("mobile-auth-button"),
        loginTab: document.getElementById("login-tab"),
        registerTab: document.getElementById("register-tab"),
        loginForm: document.getElementById("login-form"),
        registerForm: document.getElementById("register-form"),
        loginEmail: document.getElementById("login-email"),
        loginPassword: document.getElementById("login-password"),
        registerName: document.getElementById("register-name"),
        registerEmail: document.getElementById("register-email"),
        registerPhone: document.getElementById("register-phone"),
        registerPassword: document.getElementById("register-password"),
        logoutButton: document.getElementById("logout-button"),
        productTitle: document.getElementById("product-modal-title"),
        productDescription: document.getElementById("product-modal-description"),
        productPrice: document.getElementById("product-modal-price"),
        productCategory: document.getElementById("product-modal-category"),
        productImage: document.getElementById("product-modal-image"),
        productBadge: document.getElementById("product-modal-badge"),
        quantityMinus: document.getElementById("quantity-minus"),
        quantityPlus: document.getElementById("quantity-plus"),
        quantityValue: document.getElementById("quantity-value"),
        addToCartButton: document.getElementById("add-to-cart-button"),
        toast: document.getElementById("toast"),
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    state.geoCountry = normalizeCountryCode(bootstrap.geo?.countryCode);
    state.ads = buildDisplayAds();
    bindEvents();
    attachAdsDrag();
    toggleAuthTab("login");
    updateStaticCopy();
    fetchAds();
    fetchMenu();
    renderCart();
});
