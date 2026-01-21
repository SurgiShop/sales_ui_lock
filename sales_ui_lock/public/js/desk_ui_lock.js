(function () {
    // ==========================
    // CONFIGURATION
    // ==========================
    const ROLE_RULES = {
        "Sales User": {
            landing: "selling",
            dropdown_block: [
                "Desktop",
                "Edit Sidebar",
                "Website",
                "Help",
                "Session Defaults"
            ]
        }
    };

    const ADMIN_ROLES = ["System Manager"];

    // ==========================
    // HELPERS
    // ==========================
    function hasRole(role) {
        return frappe?.user_roles?.includes(role) || false;
    }

    function isAdmin() {
        return ADMIN_ROLES.some(hasRole);
    }

    function getActiveRule() {
        for (const role in ROLE_RULES) {
            if (hasRole(role)) return ROLE_RULES[role];
        }
        return null;
    }

    // ==========================
    // FORCE LANDING MODULE
    // ==========================
    function enforceLanding(rule) {
        if (!rule?.landing || !frappe?.set_route) return;

        const path = window.location.pathname;
        const target = `/app/${rule.landing}`;

        if (!path.startsWith(target)) {
            frappe.set_route(rule.landing);
        }
    }

    // ==========================
    // DISABLE USER DROPDOWN ITEMS
    // ==========================
    function disableMenuItems(rule) {
        if (!rule?.dropdown_block) return;

        const block = rule.dropdown_block.map(i => i.toLowerCase());

        document.querySelectorAll('.dropdown-menu-item').forEach(item => {
            const titleSpan = item.querySelector('.menu-item-title');
            const text = titleSpan?.innerText?.trim().toLowerCase();

            if (!text || !block.includes(text)) return;

            if (item.dataset.disabled) return;
            item.dataset.disabled = "true";

            item.style.opacity = "0.5";
            item.style.cursor = "not-allowed";
            item.style.pointerEvents = "none";

            item.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }, true);

            const link = item.querySelector('a');
            if (link) {
                link.style.pointerEvents = "none";
                link.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }, true);
            }
        });
    }

    // ==========================
    // HIDE LEFT WORKSPACE SIDEBAR
    // ==========================
    function hideLeftSidebar() {
        // Entire left column
        const sideSection = document.querySelector('.layout-side-section');
        if (sideSection) {
            sideSection.style.display = 'none';
        }

        // Defensive: nested sidebar elements
        document.querySelectorAll(
            '.desk-sidebar, .sidebar-items, .workspace-sidebar'
        ).forEach(el => {
            el.style.display = 'none';
        });

        // Expand main content
        const mainSection = document.querySelector('.layout-main-section');
        if (mainSection) {
            mainSection.style.marginLeft = '0';
            mainSection.style.width = '100%';
        }
    }

    // ==========================
    // MAIN ENFORCEMENT
    // ==========================
    function enforce() {
        if (!frappe?.user_roles || isAdmin()) return;

        const rule = getActiveRule();
        if (!rule) return;

        enforceLanding(rule);
        disableMenuItems(rule);
        hideLeftSidebar();
    }

    // ==========================
    // INITIALIZE
    // ==========================
    function init() {
        if (!frappe?.user_roles) {
            setTimeout(init, 200);
            return;
        }

        if (isAdmin()) return;

        // Continuous enforcement (v16 re-renders often)
        setInterval(enforce, 200);

        // React to DOM mutations
        const observer = new MutationObserver(enforce);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // React to route changes
        if (frappe.router) {
            frappe.router.on("change", () => {
                const rule = getActiveRule();
                if (rule) enforceLanding(rule);
            });
        }

        enforce();
    }

    init();
})();
