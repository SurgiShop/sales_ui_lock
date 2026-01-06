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
    frappe.ready(() => {
        if (isAdmin()) return;
        
        console.log('UI Lock initialized for Sales User');
        
        // Start continuous monitoring
        startContinuousMonitoring();
        
        // Also hook into various Frappe events
        frappe.after_ajax(enforce);
        frappe.router.on("change", enforce);
        
        // Watch for DOM changes with MutationObserver
        new MutationObserver(() => {
            const rule = getActiveRule();
            if (rule) filterDropdown(rule);
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();
