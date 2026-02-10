import frappe

def enforce_allowed_modules(bootinfo):
    # Boot hooks run in many contexts — always guard
    if not bootinfo:
        return

    allowed_modules = getattr(bootinfo, "allowed_modules", None)
    if not allowed_modules:
        return

    roles = frappe.get_roles()

    # Only restrict Sales Users (never admins)
    if "Sales User" in roles and "System Manager" not in roles:
        bootinfo.allowed_modules = [
            m for m in allowed_modules
            if m == "Selling"
        ]
