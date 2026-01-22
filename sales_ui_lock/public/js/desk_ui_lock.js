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
    // FORCE SELLING WORKSPACE
    // ==========================
    function enforceLanding(rule) {
        if (!rule?.landing || !frappe?.set_route) return;

        const target = `/app/${rule.landing}`;
        if (!window.location.pathname.startsWith(target)) {
            frappe.set_route(rule.landing);
        }
    }

    // ==========================
    // DISABLE USER DROPDOWN ITEMS
    // ==========================
    function disableMenuItems(rule) {
        if (!rule?.dropdown_block) return;

        const block = rule.dropdown_block.map(v => v.toLowerCase());

        document.querySelectorAll('.dropdown-menu-item').forEach(item => {
            const text = item
                .querySelector('.menu-item-title')
                ?.innerText?.trim().toLowerCase();

            if (!text || !block.includes(text)) return;
            if (item.dataset.locked) return;

            item.dataset.locked = "1";
            item.style.opacity = "0.4";
            item.style.pointerEvents = "none";
        });
    }

    // ==========================
    // LOCK DESK SIDEBAR CONTENT
    // (v16 SAFE — keeps logout)
    // ==========================
    function lockDeskSidebar() {
        const sidebar = document.querySelector('.desk-sidebar, .sidebar-column');
        if (!sidebar) return;

        // Disable all interactions by default
        sidebar.style.pointerEvents = 'none';

        // Walk every element inside
        sidebar.querySelectorAll('*').forEach(el => {
            const text = el.innerText?.toLowerCase() || '';

            // Allow logout + avatar
            if (
                el.closest('.user-menu') ||
                el.closest('.avatar') ||
                text.includes('log out') ||
                text.includes('logout')
            ) {
                el.style.pointerEvents = 'auto';
                el.style.display = '';
                return;
            }

            // Hide everything else
            el.style.display = 'none';
        });

        // Visually collapse sidebar (but do not remove)
        sidebar.style.width = '48px';
        sidebar.style.minWidth = '48px';
        sidebar.style.maxWidth = '48px';
    }

    // ==========================
    // MAIN ENFORCEMENT LOOP
    // ==========================
    function enforce() {
        if (!frappe?.user_roles || isAdmin()) return;

        const rule = getActiveRule();
        if (!rule) return;

        enforceLanding(rule);
        disableMenuItems(rule);
        lockDeskSidebar();
    }

    // ==========================
    // INIT (v16 requires persistence)
    // ==========================
    function init() {
        if (!frappe?.user_roles) {
            setTimeout(init, 200);
            return;
        }

        if (isAdmin()) return;

        // Continuous enforcement (Vue re-mounts)
        setInterval(enforce, 250);

        // DOM mutations (workspace / desk rebuilds)
        const observer = new MutationObserver(enforce);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Route changes
        if (frappe.router) {
            frappe.router.on("change", enforce);
        }

        enforce();
    }

    init();
})();

function removeWorkspaceMenu() {
    if (!frappe?.ui?.toolbar?.user_menu) return;

    try {
        frappe.ui.toolbar.user_menu.remove_item("Workspaces");
    } catch (e) {
        // already removed
    }
}

