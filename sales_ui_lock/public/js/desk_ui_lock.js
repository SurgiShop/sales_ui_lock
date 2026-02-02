(function () {
  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      // Whitelist keywords that are ALLOWED in the URL
      allowed_paths: ["selling", "sales", "customer", "quotation", "report", "query-report", "print"],
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
  // FORCE LANDING WORKSPACE (FIXED)
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.get_route_str) return;

    const currentRoute = frappe.get_route_str().toLowerCase();
    
    // Check if the current route contains any of our allowed keywords
    const isAllowed = rule.allowed_paths.some(path => currentRoute.includes(path.toLowerCase()));

    // If route is empty (home) or not allowed, redirect to landing
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

  function disableDropdownItems(rule) {
    if (!rule?.dropdown_block) return;

    const blocked = rule.dropdown_block.map(t => t.toLowerCase());

    document.querySelectorAll(".dropdown-menu-item").forEach(item => {
      const text = item.querySelector(".menu-item-title")?.innerText?.trim().toLowerCase();

      if (!text || !blocked.includes(text)) return;
      if (item.dataset.locked) return;

      item.dataset.locked = "1";
      item.style.pointerEvents = "none";
      item.style.opacity = "0.4";
      item.style.display = "none"; // Better than just opacity for UX
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

    // Monitor route changes to re-apply logic
    $(document).on("page-change", function() {
        setTimeout(enforce, 200);
    });

    // Light persistence for dynamic UI elements
    setInterval(enforce, 1000);

    enforce();
  }

  $(document).ready(() => init());

})();
