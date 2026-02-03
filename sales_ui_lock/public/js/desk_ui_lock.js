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
  // UI CLEANUP (SURGICAL)
  // ==========================
  function removeWorkspacesMenu() {
    if (frappe?.ui?.toolbar?.user_menu?.remove_item) {
        try {
            frappe.ui.toolbar.user_menu.remove_item("Workspaces");
        } catch (e) {}
    }
  }

  function hideUserSettings() {
    // Target the specific button element found in your HTML inspection
    const targetButton = document.querySelector('button[onclick*="frappe.ui.toolbar.route_to_user()"]');
    
    if (targetButton) {
      // Hide the button itself
      targetButton.style.setProperty('display', 'none', 'important');
      
      // Hide the parent list item (li) to remove menu gaps
      const parentLi = targetButton.closest('li');
      if (parentLi) {
        parentLi.style.setProperty('display', 'none', 'important');
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

    if (isAdmin()) return;

    // --- HEAVY DUTY CSS INJECTION ---
    // This hides the button via CSS immediately upon page load
    const style = document.createElement('style');
    style.innerHTML = `
      button[onclick*="frappe.ui.toolbar.route_to_user()"] {
        display: none !important;
      }
      /* Optional: Hide the divider line that usually sits above Logout */
      button[onclick*="frappe.ui.toolbar.route_to_user()"] + .dropdown-divider {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Re-apply on Frappe page changes
    $(document).on("page-change", function() {
        setTimeout(enforce, 200);
    });

    // Loop to catch dynamic Vue renders (like opening the profile menu)
    setInterval(enforce, 1000);

    enforce();
  }

  $(document).ready(() => init());

})();
