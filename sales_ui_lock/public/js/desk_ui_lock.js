(function () {
    // ==========================
    // CONFIGURATION
    // ==========================
    const ROLE_RULES = {
        "Sales User": {
            landing: "selling",
            dropdown_allow: [
                "Reload",
                "Toggle Full Width",
                "Toggle Theme"
            ]
        }
        // Future roles go here:
        // "Procurement User": { ... }
    };
    const ADMIN_ROLES = ["System Manager"];

    // ==========================
    // HELPERS
    // ==========================
    function hasRole(role) {
        return frappe.user_roles.includes(role);
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
        if (!rule?.landing) return;
        setTimeout(() => {
            const path = window.location.pathname;
            const target = `/app/${rule.landing}`;
            if (!path.startsWith(target)) {
                frappe.set_route(rule.landing);
            }
        }, 300);
    }

    // ==========================
    // FILTER SIDEBAR DROPDOWN
    // ==========================
    function filterDropdown(rule) {
        if (!rule?.dropdown_allow) return;
        const allow = rule.dropdown_allow.map(i => i.toLowerCase());
        
        document
            .querySelectorAll('[role="menuitem"], .menu-item')
            .forEach(item => {
                const text = item.innerText?.trim().toLowerCase();
                if (!text) return;
                
                if (!allow.includes(text)) {
                    // Mark as processed to avoid re-processing same element
                    if (item.dataset.locked) return;
                    item.dataset.locked = "true";
                    
                    // Remove the element entirely from the DOM
                    item.remove();
                }
            });
    }

    // ==========================
    // ENFORCE UI LOCK
    // ==========================
    function enforce() {
        if (isAdmin()) return;
        const rule = getActiveRule();
        if (!rule) return;

        enforceLanding(rule);
        filterDropdown(rule);
    }

    // ==========================
    // INITIALIZE
    // ==========================
    frappe.after_ajax(enforce);
    frappe.router.on("change", enforce);
    new MutationObserver(enforce).observe(document.body, {
        childList: true,
        subtree: true
    });
})();
