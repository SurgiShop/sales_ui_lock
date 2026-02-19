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
        "warranty claim",
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
    if (hasRole("Acquisitions") && !isAdmin()) return ROLE_RULES["Acquisitions"];
    if (hasRole("Sales User") && !isAdmin()) return ROLE_RULES["Sales User"];
    return null;
  }

  // ==========================
  // GLOBAL UI ACTIONS
  // ==========================
  function applyGlobalStyles() {
    if (document.getElementById("global-ui-hide")) return;
    const style = document.createElement("style");
    style.id = "global-ui-hide";
    style.innerHTML = `
      button[onclick*="frappe.ui.toolbar.route_to_user()"] { display: none !important; }
      li:has(button[onclick*="frappe.ui.toolbar.route_to_user()"]) { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  // ==========================
  // MENU ITEM BLOCKING
  //
  // Confirmed v16 DOM structure for ALL sidebar menu items:
  //
  //   <a>                                        ← no class, no href, no data-label
  //     <div class="menu-item-icon">...</div>
  //     <span class="menu-item-title">Help</span>
  //     <div class="menu-item-icon">...</div>    ← optional chevron, not always present
  //   </a>
  //
  // Only reliable selector: span.menu-item-title inner text.
  // We hide the parent <a> and parent <li> if one exists.
  // ==========================

  function blockMenuItems(blocked) {
    document.querySelectorAll("span.menu-item-title").forEach(span => {
      const text = span.textContent?.trim().toLowerCase();
      if (!text || !blocked.includes(text)) return;

      const anchor = span.closest("a");
      if (anchor) anchor.style.setProperty("display", "none", "important");

      const li = span.closest("li");
      if (li) li.style.setProperty("display", "none", "important");
    });
  }

  // ==========================
  // LANDING ENFORCEMENT
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.get_route_str) return;

    const currentRoute = frappe.get_route_str().toLowerCase();
    const routeParts = currentRoute.split("/");

    if (routeParts[0] === "form" && routeParts.length >= 2) {
      const doctype = routeParts[1].toLowerCase().replace(/-/g, " ");
      if (rule.allowed_doctypes?.some(dt => dt.toLowerCase() === doctype)) return;
    }

    const isAllowed = rule.allowed_paths.some(p => currentRoute.includes(p.toLowerCase()));
    if (!currentRoute || !isAllowed) frappe.set_route(rule.landing);
  }

  // ==========================
  // MAIN ENFORCER
  // ==========================
  function enforce(blocked) {
    applyGlobalStyles();
    if (!frappe?.user_roles || isAdmin()) return;

    const rule = getActiveRule();
    if (!rule) return;

    enforceLanding(rule);
    blockMenuItems(blocked);
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

    const rule = getActiveRule();
    if (!rule || isAdmin()) {
      $(document).on("page-change", () => setTimeout(applyGlobalStyles, 100));
      return;
    }

    const blocked = rule.dropdown_block.map(t => t.toLowerCase());

    // Run immediately on load
    blockMenuItems(blocked);

    // Staggered passes on load — catches items that render slightly late
    setTimeout(() => blockMenuItems(blocked), 100);
    setTimeout(() => blockMenuItems(blocked), 500);
    setTimeout(() => blockMenuItems(blocked), 1500);

    // Re-run on every Frappe page navigation
    $(document).on("page-change", () => {
      setTimeout(() => enforce(blocked), 50);
      setTimeout(() => enforce(blocked), 300);
    });

    // MutationObserver — fires whenever Frappe re-renders any part of the DOM.
    // Debounced so rapid mutations don't hammer the DOM sweep.
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => blockMenuItems(blocked), 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    enforce(blocked);
  }

  $(document).ready(() => init());

})();
