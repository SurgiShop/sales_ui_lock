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
    // DISABLE MENU ITEMS
    // ==========================
    function disableMenuItems(rule) {
        if (!rule?.dropdown_block) return;
        
        const block = rule.dropdown_block.map(i => i.toLowerCase());
        
        // Find all dropdown menu items
        document.querySelectorAll('.dropdown-menu-item').forEach(item => {
            const titleSpan = item.querySelector('.menu-item-title');
            const text = titleSpan?.innerText?.trim().toLowerCase();
            
            if (!text || !block.includes(text)) return;
            
            // Skip if already disabled
            if (item.dataset.disabled) return;
            item.dataset.disabled = "true";
            
            // Style it as disabled
            item.style.opacity = "0.5";
            item.style.cursor = "not-allowed";
            item.style.pointerEvents = "none";
            
            // Block all click events (belt and suspenders)
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }, true);
            
            // Also block on the link itself if it exists
            const link = item.querySelector('a');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }, true);
                link.style.pointerEvents = "none";
            }
        });
    }

    // ==========================
    // MAIN ENFORCEMENT
    // ==========================
    function enforce() {
        // Don't run if Frappe isn't ready or user is admin
        if (!frappe?.user_roles || isAdmin()) return;
        
        const rule = getActiveRule();
        if (!rule) return;

        enforceLanding(rule);
        disableMenuItems(rule);
    }

    // ==========================
    // INITIALIZE WHEN READY
    // ==========================
    function init() {
        // Wait for Frappe to be ready
        if (!frappe?.user_roles) {
            setTimeout(init, 200);
            return;
        }

        // Don't run for admins
        if (isAdmin()) return;

        // Run enforcement continuously
        setInterval(enforce, 200);

        // Also run on DOM changes
        const observer = new MutationObserver(enforce);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Run on route changes
        if (frappe.router) {
            frappe.router.on("change", () => {
                const rule = getActiveRule();
                if (rule) enforceLanding(rule);
            });
        }
    }

    // Start initialization
    init();
})();
