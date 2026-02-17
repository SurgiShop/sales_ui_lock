/**
 * Frappe v16 — Force-hide "User Settings" from the sidebar.
 *
 * v16 CHANGED: User Settings is no longer in a navbar dropdown.
 * It is now rendered inside the LEFT SIDEBAR bottom panel, typically as:
 *
 *   <a data-label="User Settings" href="/app/user-settings">...</a>
 *   or as a sidebar-item with text "User Settings"
 *
 * This file handles that with:
 *  1. An injected CSS block (the nuclear option — survives re-renders)
 *  2. A jQuery sweep on load and on sidebar-related events
 *  3. A MutationObserver watchdog for dynamic re-renders
 */

(function () {
  const TARGET_LABEL = "User Settings";
  const TARGET_SLUG  = "user-settings";  // matches href="/app/user-settings"

  // -----------------------------------------------------------------------
  // 1. CSS BLOCK — injected once, persists across all re-renders
  // -----------------------------------------------------------------------
  $("<style>")
    .prop("type", "text/css")
    .html(`
      [data-label="${TARGET_LABEL}"],
      [data-label="${TARGET_LABEL.toLowerCase()}"],
      a[href*="${TARGET_SLUG}"],
      li:has(a[href*="${TARGET_SLUG}"]) {
        display: none !important;
      }
    `)
    .appendTo("head");

  // -----------------------------------------------------------------------
  // 2. DOM sweep — hides any surviving elements by text content or attr
  // -----------------------------------------------------------------------
  const hideItem = () => {
    // data-label attribute (v16 primary selector)
    $(`[data-label="${TARGET_LABEL}"], [data-label="${TARGET_LABEL.toLowerCase()}"]`).each(function () {
      $(this).css("display", "none");
      $(this).closest("li").css("display", "none");
    });

    // href-based (covers anchor tags with /app/user-settings)
    $(`a[href*="${TARGET_SLUG}"]`).each(function () {
      $(this).css("display", "none");
      $(this).closest("li").css("display", "none");
    });

    // Text-content sweep (fallback for elements without data-label)
    $(".dropdown-item, .sidebar-item, .standard-sidebar-item, .sidebar-menu-item, li > a").each(function () {
      if ($(this).text().trim() === TARGET_LABEL) {
        $(this).css("display", "none");
        $(this).closest("li").css("display", "none");
      }
    });
  };

  // -----------------------------------------------------------------------
  // 3. Run on document ready
  // -----------------------------------------------------------------------
  $(document).ready(hideItem);

  // -----------------------------------------------------------------------
  // 4. Re-run on Frappe page events (v16 uses page-change heavily)
  // -----------------------------------------------------------------------
  $(document).on("page-change", function () {
    setTimeout(hideItem, 50);
    setTimeout(hideItem, 300);
  });

  // Also catch sidebar toggle and user avatar clicks (v16 bottom panel)
  $(document).on("click", ".navbar-user, .sidebar-toggle, .user-avatar, .user-image", function () {
    setTimeout(hideItem, 1);
    setTimeout(hideItem, 100);
  });

  // -----------------------------------------------------------------------
  // 5. MutationObserver watchdog — catches Frappe's dynamic re-renders
  // -----------------------------------------------------------------------
  const observer = new MutationObserver(hideItem);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
