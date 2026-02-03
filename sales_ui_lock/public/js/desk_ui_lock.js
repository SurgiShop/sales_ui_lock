(function () {
  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      // Allowed paths ensure navigation to Items, Sales docs, and Reports works
      allowed_paths: ["selling", "sales", "customer", "quotation", "report", "query-report", "print", "item", "support"],
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
  // GLOBAL UI ACTIONS (Everyone)
  // ==========================
  function applyGlobalStyles() {
    // This injects a CSS rule that hides User Settings for EVERYONE
    // regardless of role or session state.
    if (document.getElementById('global-ui-hide')) return;

    const style = document.createElement('style');
    style.id = 'global-ui-hide';
    style.innerHTML = `
      /* Target the button by its specific action attribute */
      button[onclick*="frappe.ui.toolbar.route_to_user()"] {
        display: none !important;
      }
      /* Target the parent list item (li) for a clean menu */
      li:has(button[onclick*="frappe.ui.toolbar.route_to_user()"]) {
        display: none !important;
      }
      /* Hide the divider if it follows the hidden button */
      button[onclick*="frappe.ui.toolbar.route_to_user()"] + .dropdown-divider {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================
  // ROLE-BASED ACTIONS (Sales Users)
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.get_route_str) return;

    const currentRoute = frappe.get_route_str().toLowerCase();
    const isAllowed = rule.allowed_paths.some(path => currentRoute.includes(path.toLowerCase()));

    if (!currentRoute || !isAllowed) {
      frappe.set_route(rule.landing);
    }
  }

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
      item.style.setProperty('display', 'none', 'important');
    });
  }

  // ==========================
  // MAIN ENFORCER
  // ==========================
  function enforce() {
    // 1. Always apply Global Styles first
    applyGlobalStyles();

    // 2. Apply Role-Specific logic
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

    // Apply global style immediately for all users
    applyGlobalStyles();

    // Setup listeners for navigation changes
    $(document).on("page-change", function() {
        setTimeout(enforce, 200);
    });

    // Frequent check to ensure dynamic Vue menus stay clean
    setInterval(enforce, 1000);

    enforce();
  }

  $(document).ready(() => init());

})();
