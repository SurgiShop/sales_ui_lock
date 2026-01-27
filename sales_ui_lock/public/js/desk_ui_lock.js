(function () {

  // ==========================
  // CONFIG
  // ==========================
  const ROLE_RULES = {
    "Sales User": {
      landing: "selling",
      dropdown_block: [
        "Workspaces",
        "Assets",
        "Desktop",
        "Website",
        "Help",
        "Session Defaults"
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
    return ADMIN_ROLES.some(hasRole);
  }

  function getActiveRule() {
    return Object.keys(ROLE_RULES).find(hasRole)
      ? ROLE_RULES[Object.keys(ROLE_RULES).find(hasRole)]
      : null;
  }

  // ==========================
  // FORCE LANDING WORKSPACE
  // ==========================
  function enforceLanding(rule) {
    if (!rule?.landing || !frappe?.set_route) return;

    const target = `/app/${rule.landing}`;
    if (!window.location.pathname.startsWith(target)) {
      frappe.set_route(rule.landing);
    }
  }

  // ==========================
  // REMOVE WORKSPACES (v16 CORRECT)
  // ==========================
  function removeWorkspacesMenu() {
    if (!frappe?.ui?.toolbar?.user_menu) return;

    try {
      frappe.ui.toolbar.user_menu.remove_item("Workspaces");
    } catch (e) {}
  }

  // ==========================
  // DISABLE DROPDOWN ITEMS
  // ==========================
  function disableDropdownItems(rule) {
    if (!rule?.dropdown_block) return;

    const blocked = rule.dropdown_block.map(t => t.toLowerCase());

    document.querySelectorAll(".dropdown-menu-item").forEach(item => {
      const text = item
        .querySelector(".menu-item-title")
        ?.innerText?.trim().toLowerCase();

      if (!text || !blocked.includes(text)) return;
      if (item.dataset.locked) return;

      item.dataset.locked = "1";
      item.style.pointerEvents = "none";
      item.style.opacity = "0.4";
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

    // Wait for toolbar (Vue mount)
    const wait = setInterval(() => {
      if (frappe?.ui?.toolbar?.user_menu) {
        clearInterval(wait);
        removeWorkspacesMenu();
      }
    }, 100);

    // Re-apply after route changes (Vue re-render)
    if (frappe.router) {
      frappe.router.on("change", () => {
        setTimeout(enforce, 100);
      });
    }

    // Light persistence (not aggressive)
    setInterval(enforce, 500);

    enforce();
  }

  init();

})();
