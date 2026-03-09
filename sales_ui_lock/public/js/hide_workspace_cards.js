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
    const route = frappe.get_route();
    if (route && route[0] === "Workspace") {
      return route[1]?.toLowerCase();
    }
    return null;
  }

  // ==========================
  // CARD HIDING LOGIC
  // ==========================
  function hideRestrictedCards() {
    const currentWorkspace = getCurrentWorkspace();
    if (!currentWorkspace) return;

    // Check if current workspace has any card rules
    const workspaceKey = Object.keys(WORKSPACE_RULES).find(
      ws => ws.toLowerCase() === currentWorkspace
    );
    if (!workspaceKey) return;

    const cardsToCheck = WORKSPACE_RULES[workspaceKey];
    if (!cardsToCheck || cardsToCheck.length === 0) return;

    // Find all workspace cards
    // In v16, cards are typically in .workspace-card or similar containers
    const cardSelectors = [
      '.workspace-card',
      '.shortcut-widget',
      '.widget',
      '[data-widget-name]',
      '.standard-widget',
      '.grid-col'
    ];

    cardSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(card => {
        // Try to find the card label
        const labelElements = card.querySelectorAll('.widget-title, .widget-label, .shortcut-label, h6, .card-title');
        
        labelElements.forEach(labelEl => {
          const labelText = labelEl.textContent?.trim();
          if (!labelText) return;

          // Check if this card has role restrictions
          const cardKey = Object.keys(CARD_ROLE_RULES).find(
            key => key.toLowerCase() === labelText.toLowerCase()
          );

          if (cardKey) {
            const allowedRoles = CARD_ROLE_RULES[cardKey];
            
            // Hide if user doesn't have any of the allowed roles
            if (!hasAnyRole(allowedRoles)) {
              // Hide the entire card container
              const cardContainer = card.closest('.grid-col') || card.closest('.widget') || card;
              if (cardContainer) {
                cardContainer.style.setProperty("display", "none", "important");
                console.log(`[hide_workspace_cards] Hiding card: ${labelText} (user lacks required role)`);
              }
            }
          }
        });
      });
    });

    // Also check for cards in the shortcuts section
    document.querySelectorAll('.shortcuts-wrapper .shortcut-widget-box').forEach(shortcut => {
      const labelEl = shortcut.querySelector('.shortcut-label');
      const labelText = labelEl?.textContent?.trim();
      if (!labelText) return;

      const cardKey = Object.keys(CARD_ROLE_RULES).find(
        key => key.toLowerCase() === labelText.toLowerCase()
      );

      if (cardKey) {
        const allowedRoles = CARD_ROLE_RULES[cardKey];
        if (!hasAnyRole(allowedRoles)) {
          shortcut.style.setProperty("display", "none", "important");
          console.log(`[hide_workspace_cards] Hiding shortcut: ${labelText} (user lacks required role)`);
        }
      }
    });
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

    // Run immediately on load
    hideRestrictedCards();

    // Staggered passes — catches items that render slightly late
    setTimeout(hideRestrictedCards, 100);
    setTimeout(hideRestrictedCards, 500);
    setTimeout(hideRestrictedCards, 1500);

    // Re-run on every Frappe page navigation
    $(document).on("page-change", () => {
      setTimeout(hideRestrictedCards, 50);
      setTimeout(hideRestrictedCards, 300);
      setTimeout(hideRestrictedCards, 800);
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
