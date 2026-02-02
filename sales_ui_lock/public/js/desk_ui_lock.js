(function () {
  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      // Whitelist allows access to Selling, Items, and Reports
      allowed_paths: ["selling", "sales", "customer", "quotation", "report", "query-report", "print", "item"],
      dropdown_block: [
        "Workspaces",
        "Assets",
        "Desktop",
        "Website",
        "Help",
        "Session Defaults",
        "User Settings"
      ]
    }
  };

  const ADMIN_ROLES = ["System Manager"];

  // ==========================
  // HELPERS
  // ==========================
  function hasRole(role) {
    return frappe?.user_roles?.includes(role);
  }

  function isAdmin() {
    return ADMIN_ROLES.some(role => hasRole(role));
  }

  function getActiveRule() {
    const userRole = Object.keys(ROLE_RULES).find(role => hasRole(role));
    return userRole ? ROLE_RULES[userRole] : null;
  }

  // ==========================
  // FORCE LANDING WORKSPACE
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.get_route_str) return;

    const currentRoute = frappe.get_route_str().toLowerCase();
    const isAllowed = rule.allowed_paths.some(path => currentRoute.includes(path.toLowerCase()));

    if (!currentRoute || !isAllowed) {
      frappe.set_route(rule.landing);
    }
  }

  // ==========================
  // UI CLEANUP (AGGRESSIVE)
  // ==========================
  function removeWorkspacesMenu() {
    if (frappe?.ui?.toolbar?.user_menu?.remove_item) {
        try {
            frappe.ui.toolbar.user_menu.remove_item("Workspaces");
        } catch (e) {}
    }
  }

  function hideUserSettings() {
    // Targets the exact element from your screenshot using multiple selector strategies
    const selectors = [
      '.dropdown-item[data-label="User Settings"]', // Standard Label
      'a[onclick*="route_to_user"]',                // Target by the Action function
      'a[href*="user-settings"]'                    // Target by potential URL
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Use !important to override Vue.js inline styles
        el.style.setProperty('display', 'none', 'important');
        
        // Hide the parent <li> if it exists to prevent empty gaps in the menu
        const parentLi = el.closest('li');
        if (parentLi) {
          parentLi.style.setProperty('display', 'none', 'important');
        }
      });
    });
  }

  function disableDropdownItems(rule) {
    if (!rule?.dropdown_block) return;

    const blocked = rule.dropdown_block.map(t => t.toLowerCase());

    document.querySelectorAll(".dropdown-menu-item").forEach(item => {
      const text = item.querySelector(".menu-item-title")?.innerText?.trim().toLowerCase();

      if (!text || !blocked.includes(text)) return;
      if (item.dataset.locked) return;

      item.dataset.locked = "1";
      item.style.setProperty('display', 'none', 'important');
    });
  }

  // ==========================
  // MAIN ENFORCER
  // ==========================
  function enforce() {
    if (!frappe?.user_roles || isAdmin()) return;

    const rule = getActiveRule();
    if (!rule) return;

    enforceLanding(rule);
    removeWorkspacesMenu();
    disableDropdownItems(rule);
    hideUserSettings();
  }

  // ==========================
  // INIT
  // ==========================
  function init() {
    if (!frappe?.user_roles) {
      setTimeout(init, 200);
      return;
    }

    // Admins are exempt to prevent locking yourself out of settings
    if (isAdmin()) return;

    // Trigger on Frappe page change events
    $(document).on("page-change", function() {
        setTimeout(enforce, 200);
    });

    // Frequent check to catch the User Menu when it is clicked/rendered
    setInterval(enforce, 800);

    enforce();
  }

  $(document).ready(() => init());

})();
