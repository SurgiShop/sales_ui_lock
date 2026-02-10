import frappe

def enforce_allowed_modules(bootinfo):
    roles = frappe.get_roles()

    if "Sales User" in roles:
        allowed_modules = {
            "Selling",
        }

        bootinfo.allowed_modules = [
            m for m in bootinfo.allowed_modules
            if m in allowed_modules
        ]
