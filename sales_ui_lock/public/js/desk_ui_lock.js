(function () {
  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      // Whitelist keywords to prevent the "Route Loop"
      // Added "item" so they can access the Item DocType
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
    
    // Check if the current route contains any of our allowed keywords
    const isAllowed = rule.allowed_paths.some(path => currentRoute.includes(path.toLowerCase()));

    // Redirect to landing if the route is empty or not in the whitelist
    if (!currentRoute || !isAllowed) {
      frappe.set_route(rule.landing);
    }
  }

  // ==========================
  // UI CLEANUP
  // ==========================
  function removeWorkspacesMenu() {
    if (frappe?.ui?.toolbar?.user_menu?.remove_item) {
        try {
            frappe.ui.toolbar.user_menu.remove_item("Workspaces");
        } catch (e) {}
    }
  }

  function hideUserSettings() {
    // Specifically targets the "User Settings" link in the Avatar dropdown
    // This is migration-proof as it ignores the Navbar Settings database
    const userSettingsLink = document.querySelector('.dropdown-item[data-label="User Settings"]');
    if (userSettingsLink) {
      userSettingsLink.style.display = 'none';
      
      // Also hide the divider line immediately following it if it exists
      const divider = userSettingsLink.nextElementSibling;
      if (divider && divider.classList.contains('dropdown-divider')) {
          divider.style.display = 'none';
      }
    }
  }

  function disableDropdownItems(rule) {
    if (!rule?.dropdown_block) return;

    const blocked = rule.dropdown_block.map(t => t.toLowerCase());

    document.querySelectorAll(".dropdown-menu-item").forEach(item => {
      const text = item.querySelector(".menu-item-title")?.innerText?.trim().toLowerCase();

      if (!text || !blocked.includes(text)) return;
      if (item.dataset.locked) return;

      item.dataset.locked = "1";
      item.style.display = "none"; 
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

    if (isAdmin()) return;

    // Re-apply on every page change (Frappe/Vue navigation)
    $(document).on("page-change", function() {
        setTimeout(enforce, 200);
    });

    // Persistence to catch dynamic elements (like the Avatar dropdown)
    setInterval(enforce, 1000);

    enforce();
  }

  // Start the script once the document is ready
  $(document).ready(() => init());

})();
