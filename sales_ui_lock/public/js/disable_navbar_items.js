/**
 * Frappe v16 — Hide "User Settings" from the sidebar menu.
 *
 * Confirmed v16 DOM structure:
 *   <a>
 *     <div class="menu-item-icon">...</div>
 *     <span class="menu-item-title">User Settings</span>
 *   </a>
 *
 * No class, href, or data-label on the <a>. Only hook is .menu-item-title text.
 * desk_ui_lock.js also blocks this via dropdown_block — this file is a
 * dedicated belt-and-suspenders pass that runs independently.
 */
(function () {
  const TARGET = "user settings";

  function hideUserSettings() {
    document.querySelectorAll("span.menu-item-title").forEach(span => {
      if (span.textContent?.trim().toLowerCase() !== TARGET) return;
      const anchor = span.closest("a");
      if (anchor) anchor.style.setProperty("display", "none", "important");
      const li = span.closest("li");
      if (li) li.style.setProperty("display", "none", "important");
    });
  }

  $(document).ready(() => {
    hideUserSettings();
    setTimeout(hideUserSettings, 100);
    setTimeout(hideUserSettings, 500);
    setTimeout(hideUserSettings, 1500);
  });

  $(document).on("page-change", () => {
    setTimeout(hideUserSettings, 50);
    setTimeout(hideUserSettings, 300);
  });

  const observer = new MutationObserver(hideUserSettings);
  observer.observe(document.body, { childList: true, subtree: true });

})();
