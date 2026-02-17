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
    if (document.getElementById("global-ui-hide")) return;

    const style = document.createElement("style");
    style.id = "global-ui-hide";
    // v16: "Edit Profile" button is rendered with an onclick to route_to_user()
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
    const routeParts = currentRoute.split("/");

    // If viewing a form, check if the doctype is allowed
    if (routeParts[0] === "form" && routeParts.length >= 2) {
      const doctype = routeParts[1].toLowerCase().replace(/-/g, " ");
      if (rule.allowed_doctypes && rule.allowed_doctypes.some(dt => dt.toLowerCase() === doctype)) {
        return; // Allow this form view
      }
    }

    // Check if current path is allowed
    const isAllowed = rule.allowed_paths.some(path =>
      currentRoute.includes(path.toLowerCase())
    );

    if (!currentRoute || !isAllowed) {
      frappe.set_route(rule.landing);
    }
  }

  // ==========================
  // v16 SIDEBAR ITEM BLOCKING
  // ==========================
  // In Frappe v16 the old navbar dropdown is GONE. User-menu items
  // (Workspaces, Help, Session Defaults, User Settings, etc.) now live
  // in the LEFT sidebar — either as icon buttons at the top or as items
  // in the bottom user-profile panel.
  //
  // We use three layers:
  //   1. Injected CSS block (persistent, survives re-renders)
  //   2. DOM sweep targeting data-label, text content, and href
  //   3. MutationObserver to re-sweep whenever Frappe re-renders the sidebar
  // ==========================

  let _styleBlockInjected = false;

  function buildBlockCSS(blocked) {
    const rules = [];
    blocked.forEach(label => {
      const slug = label.toLowerCase().replace(/\s+/g, "-");
      const labelEsc = label.replace(/"/g, '\\"');

      // data-label attribute (v16 sidebar and dropdown items)
      rules.push(`[data-label="${labelEsc}"] { display: none !important; }`);
      // Case-insensitive fallback for all-lowercase data-label
      rules.push(`[data-label="${labelEsc.toLowerCase()}"] { display: none !important; }`);
      // Parent li when child has a matching href
      rules.push(`a[href*="${slug}"] { display: none !important; }`);
      rules.push(`li:has(a[href*="${slug}"]) { display: none !important; }`);
    });
    return rules.join("\n");
  }

  function injectBlockStyles(rule) {
    if (_styleBlockInjected) return;
    _styleBlockInjected = true;

    const blocked = (rule.dropdown_block || []).map(t => t.trim());
    if (!blocked.length) return;

    const style = document.createElement("style");
    style.id = "surgishop-dropdown-block";
    style.innerHTML = buildBlockCSS(blocked);
    document.head.appendChild(style);
  }

  function disableSidebarItems(rule) {
    if (!rule?.dropdown_block) return;

    const blocked = rule.dropdown_block.map(t => t.toLowerCase().trim());

    // Strategy 1: data-label attribute targeting (primary v16 method)
    blocked.forEach(label => {
      [label, label.charAt(0).toUpperCase() + label.slice(1)].forEach(variant => {
        document.querySelectorAll(`[data-label="${variant}"]`).forEach(el => {
          el.style.setProperty("display", "none", "important");
          const li = el.closest("li");
          if (li) li.style.setProperty("display", "none", "important");
        });
      });
    });

    // Strategy 2: inner text matching (covers missing or variant data-label)
    const candidates = document.querySelectorAll([
      ".dropdown-item",
      ".sidebar-item",
      ".dropdown-menu a",
      ".sidebar-bottom-items a",
      ".user-menu-item",
      ".sidebar-menu-item",
      ".standard-sidebar-item",
      "li > a"
    ].join(", "));

    candidates.forEach(item => {
      const text = (item.textContent || item.innerText || "").trim().toLowerCase();
      if (blocked.includes(text)) {
        item.style.setProperty("display", "none", "important");
        const li = item.closest("li");
        if (li) li.style.setProperty("display", "none", "important");
      }
    });

    // Strategy 3: href-based targeting for known routes
    const hrefMap = {
      "user settings":    "user-settings",
      "session defaults": "session-default",
      "workspaces":       "workspace",
      "assets":           "asset",
      "website":          "website-settings",
      "desktop":          "desktop",
      "help":             "support"
    };
    blocked.forEach(label => {
      const slug = hrefMap[label] || label.replace(/\s+/g, "-");
      document.querySelectorAll(`a[href*="${slug}"]`).forEach(el => {
        el.style.setProperty("display", "none", "important");
        const li = el.closest("li");
        if (li) li.style.setProperty("display", "none", "important");
      });
    });
  }

  // ==========================
  // MUTATION OBSERVER
  // Re-applies sidebar block whenever Frappe re-renders the DOM
  // (e.g. after page-change, sidebar toggle, or dropdown open)
  // ==========================
  let _observerActive = false;

  function startObserver(rule) {
    if (_observerActive) return;
    _observerActive = true;

    const observer = new MutationObserver(() => {
      disableSidebarItems(rule);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
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
    injectBlockStyles(rule);
    disableSidebarItems(rule);
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

    if (!isAdmin()) {
      const rule = getActiveRule();
      if (rule) {
        injectBlockStyles(rule);
        startObserver(rule);
      }
    }

    $(document).on("page-change", function () {
      setTimeout(enforce, 200);
    });

    enforce();
  }

  $(document).ready(() => init());

})();
