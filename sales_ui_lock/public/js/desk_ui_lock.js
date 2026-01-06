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
        if (!frappe || !frappe.user_roles) return false;
        return frappe.user_roles.includes(role);
    }

    function isAdmin() {
        if (!frappe || !frappe.user_roles) return false;
        return ADMIN_ROLES.some(hasRole);
    }

    function getActiveRule() {
        if (!frappe || !frappe.user_roles) return null;
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
    // AGGRESSIVE DROPDOWN FILTER
    // ==========================
    function filterDropdown(rule) {
        if (!rule?.dropdown_allow) return;
        const allow = rule.dropdown_allow.map(i => i.toLowerCase());
        
        // Target all possible dropdown menu containers
        const menuContainers = document.querySelectorAll('.dropdown-menu, .frappe-menu, .context-menu');
        
        menuContainers.forEach(container => {
            // Find all dropdown items within this container
            const items = container.querySelectorAll('.dropdown-menu-item, [role="menuitem"], .menu-item');
            
            items.forEach(item => {
                // Get text from various possible locations
                const titleSpan = item.querySelector('.menu-item-title');
                const text = (titleSpan?.innerText || item.innerText || item.textContent || '').trim().toLowerCase();
                
                if (!text) return;
                
                // Skip if already processed
                if (item.dataset.uiLocked) return;
                
                console.log('Found menu item:', text); // Debug logging
                
                if (!allow.includes(text)) {
                    console.log('Removing:', text); // Debug logging
                    item.dataset.uiLocked = "true";
                    
                    // Try multiple removal methods
                    item.style.display = 'none';
                    item.remove();
                    
                    // Also try to disable click events
                    item.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
            });
        });
    }

    // ==========================
    // CONTINUOUS MONITORING
    // ==========================
    function startContinuousMonitoring() {
        const rule = getActiveRule();
        if (!rule) return;
        
        // Run filter continuously
        setInterval(() => {
            filterDropdown(rule);
        }, 100); // Check every 100ms
    }

    // ==========================
    // ENFORCE UI LOCK
    // ==========================
    function enforce() {
        if (!frappe || !frappe.user_roles) return; // Safety check
        if (isAdmin()) return;
        const rule = getActiveRule();
        if (!rule) return;

        enforceLanding(rule);
        filterDropdown(rule);
    }

    // ==========================
    // INITIALIZE
    // ==========================
    
    // Wait for Frappe to be fully loaded
    function initialize() {
        if (!frappe || !frappe.user_roles) {
            // Frappe not ready yet, try again in 100ms
            setTimeout(initialize, 100);
            return;
        }
        
        if (isAdmin()) {
            console.log('UI Lock: Admin user detected, not applying restrictions');
            return;
        }
        
        console.log('UI Lock: Initialized for restricted user');
        console.log('User roles:', frappe.user_roles);
        
        // Start continuous monitoring
        startContinuousMonitoring();
        
        // Also hook into various Frappe events
        frappe.after_ajax(enforce);
        
        if (frappe.router) {
            frappe.router.on("change", enforce);
        }
        
        // Watch for DOM changes with MutationObserver
        new MutationObserver(() => {
            const rule = getActiveRule();
            if (rule) filterDropdown(rule);
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
