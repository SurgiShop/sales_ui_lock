(function () {
  // ==========================
  // CONFIG: Define which cards are visible to which roles
  // ==========================
  const CARD_ROLE_RULES = {
    // Key: Card label text (case insensitive match)
    // Value: Array of roles that CAN see this card
    "Inventory Control": ["Inventory Control", "System Manager"],
    // Add more cards here as needed:
    // "Stock Entry": ["Stock User", "Inventory Control", "System Manager"],
    // "Purchase Order": ["Purchase User", "System Manager"],
  };

  const WORKSPACE_RULES = {
    // Key: Workspace name (case insensitive)
    // Value: Cards to check on this workspace
    "Selling": ["Inventory Control"],
    // Add more workspaces if needed:
    // "Buying": ["Special Purchase Card"],
  };

  // ==========================
  // HELPERS
  // ==========================
  function hasRole(role) {
    return frappe?.user_roles?.includes(role);
  }

  function hasAnyRole(roles) {
    return roles.some(role => hasRole(role));
  }

  function getCurrentWorkspace() {
    try {
      const route = frappe.get_route();
      const routeStr = frappe.get_route_str ? frappe.get_route_str() : null;
      
      console.log("[hide_workspace_cards] DEBUG - route array:", route);
      console.log("[hide_workspace_cards] DEBUG - route string:", routeStr);
      console.log("[hide_workspace_cards] DEBUG - current URL:", window.location.href);
      console.log("[hide_workspace_cards] DEBUG - pathname:", window.location.pathname);
      
      // Try multiple route formats
      if (route && route.length > 0) {
        const firstPart = route[0]?.toLowerCase();
        console.log("[hide_workspace_cards] DEBUG - first route part:", firstPart);
        
        // Check various route formats:
        // ["Workspace", "Selling"] or ["workspace", "selling"] or just ["selling"]
        if (firstPart === "workspace" && route[1]) {
          console.log("[hide_workspace_cards] DEBUG - Found workspace (format 1):", route[1]);
          return route[1].toLowerCase();
        }
        
        // Sometimes the workspace name is directly in route[0]
        // Check if it matches a known workspace name
        if (firstPart === "selling" || firstPart === "stock" || firstPart === "buying") {
          console.log("[hide_workspace_cards] DEBUG - Found workspace (format 2):", firstPart);
          return firstPart;
        }
      }
      
      // Check if URL contains workspace info
      const pathname = window.location.pathname;
      if (pathname && pathname.includes('/app/')) {
        const pathParts = pathname.split('/');
        const appIndex = pathParts.indexOf('app');
        if (appIndex >= 0 && pathParts[appIndex + 1]) {
          const workspaceName = pathParts[appIndex + 1].toLowerCase();
          console.log("[hide_workspace_cards] DEBUG - Found workspace from URL:", workspaceName);
          if (workspaceName === 'selling' || workspaceName === 'stock' || workspaceName === 'buying') {
            return workspaceName;
          }
        }
      }
      
      console.log("[hide_workspace_cards] DEBUG - No workspace detected");
      return null;
    } catch (e) {
      console.error("[hide_workspace_cards] ERROR in getCurrentWorkspace:", e);
      return null;
    }
  }

  // ==========================
  // CARD HIDING LOGIC
  // ==========================
  function hideRestrictedCards() {
    console.log("[hide_workspace_cards] hideRestrictedCards() called");
    
    const currentWorkspace = getCurrentWorkspace();
    console.log("[hide_workspace_cards] currentWorkspace returned:", currentWorkspace);
    
    if (!currentWorkspace) {
      console.log("[hide_workspace_cards] Not on a workspace, skipping");
      return;
    }

    // Check if current workspace has any card rules
    const workspaceKey = Object.keys(WORKSPACE_RULES).find(
      ws => ws.toLowerCase() === currentWorkspace
    );
    if (!workspaceKey) {
      console.log(`[hide_workspace_cards] No rules for workspace: ${currentWorkspace}`);
      return;
    }

    const cardsToCheck = WORKSPACE_RULES[workspaceKey];
    if (!cardsToCheck || cardsToCheck.length === 0) return;

    console.log(`[hide_workspace_cards] Checking cards on workspace: ${currentWorkspace}`);

    let cardsProcessed = 0;
    let cardsHidden = 0;

    // Find all workspace cards - cast a wide net
    // Look for anything with widget-title inside
    document.querySelectorAll('.widget-title').forEach(titleEl => {
      const labelText = titleEl.textContent?.trim();
      if (!labelText) return;

      cardsProcessed++;

      // Check if this card has role restrictions
      const cardKey = Object.keys(CARD_ROLE_RULES).find(
        key => key.toLowerCase() === labelText.toLowerCase()
      );

      if (cardKey) {
        console.log(`[hide_workspace_cards] Found restricted card: "${labelText}"`);
        const allowedRoles = CARD_ROLE_RULES[cardKey];
        
        // Hide if user doesn't have any of the allowed roles
        if (!hasAnyRole(allowedRoles)) {
          // Walk up the DOM to find the card container
          let cardContainer = titleEl.closest('.grid-col') || 
                            titleEl.closest('.widget') || 
                            titleEl.closest('.col') ||
                            titleEl.closest('[class*="col-"]') ||
                            titleEl.parentElement?.parentElement;
          
          if (cardContainer) {
            cardContainer.style.setProperty("display", "none", "important");
            cardsHidden++;
            console.log(`[hide_workspace_cards] ✓ HIDDEN: "${labelText}" (user lacks role: ${allowedRoles.join(', ')})`);
          } else {
            console.log(`[hide_workspace_cards] ✗ FAILED to hide: "${labelText}" (no container found)`);
          }
        } else {
          console.log(`[hide_workspace_cards] Card "${labelText}" visible (user has required role)`);
        }
      }
    });

    // Also check for shortcut widgets (different structure)
    document.querySelectorAll('.shortcut-widget-box').forEach(shortcut => {
      const labelEl = shortcut.querySelector('.shortcut-label');
      const labelText = labelEl?.textContent?.trim();
      if (!labelText) return;

      cardsProcessed++;

      const cardKey = Object.keys(CARD_ROLE_RULES).find(
        key => key.toLowerCase() === labelText.toLowerCase()
      );

      if (cardKey) {
        console.log(`[hide_workspace_cards] Found restricted shortcut: "${labelText}"`);
        const allowedRoles = CARD_ROLE_RULES[cardKey];
        if (!hasAnyRole(allowedRoles)) {
          shortcut.style.setProperty("display", "none", "important");
          cardsHidden++;
          console.log(`[hide_workspace_cards] ✓ HIDDEN: "${labelText}" (user lacks role: ${allowedRoles.join(', ')})`);
        }
      }
    });

    console.log(`[hide_workspace_cards] Summary: Processed ${cardsProcessed} cards, hidden ${cardsHidden}`);
  }

  // ==========================
  // INIT
  // ==========================
  function init() {
    if (!frappe?.user_roles) {
      setTimeout(init, 200);
      return;
    }

    console.log("[hide_workspace_cards] Initializing...");
    console.log("[hide_workspace_cards] User roles:", frappe.user_roles);

    // Run immediately on load
    hideRestrictedCards();

    // AGGRESSIVE staggered passes — catches items that render late
    setTimeout(hideRestrictedCards, 50);
    setTimeout(hideRestrictedCards, 100);
    setTimeout(hideRestrictedCards, 300);
    setTimeout(hideRestrictedCards, 500);
    setTimeout(hideRestrictedCards, 800);
    setTimeout(hideRestrictedCards, 1500);
    setTimeout(hideRestrictedCards, 3000);

    // Re-run on every Frappe page navigation
    $(document).on("page-change", () => {
      console.log("[hide_workspace_cards] Page changed, re-checking cards");
      setTimeout(hideRestrictedCards, 50);
      setTimeout(hideRestrictedCards, 200);
      setTimeout(hideRestrictedCards, 500);
      setTimeout(hideRestrictedCards, 1000);
    });

    // MutationObserver — fires whenever workspace content is re-rendered
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(hideRestrictedCards, 100);
    });

    // Observe the main content area where workspaces render
    const workspaceContainer = document.querySelector('.layout-main-section') || document.body;
    observer.observe(workspaceContainer, { childList: true, subtree: true });
  }

  $(document).ready(() => init());

})();
