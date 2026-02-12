(function () {
  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      allowed_paths: [
        "selling", 
        "sales", 
        "customer", 
        "quotation", 
        "report", 
        "query-report", 
        "print", 
        "item", 
        "support",
        "form"
      ],
      allowed_doctypes: [
        "customer",
        "quotation",
        "sales order",
        "sales invoice",
        "delivery note",
        "item",
        "contact",
        "address"
      ],
      dropdown_block: [
        "Workspaces",
        "Assets",
        "Desktop",
        "Website",
        "Help",
        "Session Defaults",
        "User Settings"
      ]
    },
    "Acquisitions": {
      landing: "selling",
      allowed_paths: [
        "selling", 
        "sales", 
        "customer", 
        "quotation", 
        "report", 
        "query-report", 
        "print", 
        "item", 
        "support", 
        "purchase", 
        "purchase-order", 
        "supplier",
        "form"
      ],
      allowed_doctypes: [
        "customer",
        "quotation",
        "sales order",
        "sales invoice",
        "delivery note",
        "item",
        "contact",
        "address",
        "purchase order",
        "supplier",
        "purchase receipt",
        "purchase invoice"
      ],
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
    // Acquisitions gets priority (includes purchase access)
    if (hasRole("Acquisitions") && !isAdmin()) {
      return ROLE_RULES["Acquisitions"];
    }
    
    // Sales User gets restrictions (no purchase access)
    if (hasRole("Sales User") && !isAdmin()) {
      return ROLE_RULES["Sales User"];
    }
    
    return null;
  }

  // ==========================
  // GLOBAL UI ACTIONS (Everyone)
  // ==========================
  function applyGlobalStyles() {
    if (document.getElementById('global-ui-hide')) return;

    const style = document.createElement('style');
    style.id = 'global-ui-hide';
    style.innerHTML = `
      button[onclick*="frappe.ui.toolbar.route_to_user()"] {
        display: none !important;
      }
      li:has(button[onclick*="frappe.ui.toolbar.route_to_user()"]) {
        display: none !important;
      }
      button[onclick*="frappe.ui.toolbar.route_to_user()"] + .dropdown-divider {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================
  // ROLE-BASED ACTIONS
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.get_route_str) return;

    const currentRoute = frappe.get_route_str().toLowerCase();
    const routeParts = currentRoute.split('/');
    
    // If viewing a form, check if the doctype is allowed
    if (routeParts[0] === 'form' && routeParts.length >= 2) {
      const doctype = routeParts[1].toLowerCase().replace(/-/g, ' ');
      
      // Check if this doctype is in allowed_doctypes
      if (rule.allowed_doctypes && rule.allowed_doctypes.some(dt => dt.toLowerCase() === doctype)) {
        return; // Allow this form view
      }
    }
    
    // Check if current path is allowed
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
    applyGlobalStyles();

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

    applyGlobalStyles();

    $(document).on("page-change", function() {
      setTimeout(enforce, 200);
    });

    # setInterval(enforce, 1000);

    enforce();
  }

  $(document).ready(() => init());

})();
