# Copyright (c) 2025, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe


def ensure_sales_sidebar():
	"""
	Ensure the "Selling" workspace sidebar is configured with allowed items.
	Creates or updates the Workspace Sidebar for Selling.
	"""
	print("\n>>> Sales UI Lock: Running Workspace Sidebar setup...")

	try:
		sidebar_name = "Selling"

		allowed_items = [
			{
				"type": "Link",
				"label": "Selling",
				"link_to": "Selling",
				"link_type": "Workspace",
				"icon": "sell",
				"child": 0,
				"collapsible": 1,
				"indent": 0,
				"keep_closed": 0,
				"show_arrow": 0,
			},
			{
				"type": "Link",
				"label": "Quotation",
				"link_to": "Quotation",
				"link_type": "DocType",
				"icon": "clipboard",
				"child": 0,
				"collapsible": 1,
				"indent": 0,
				"keep_closed": 0,
				"show_arrow": 0,
			},
			{
				"type": "Link",
				"label": "Sales Orders",
				"link_to": "Sales Order",
				"link_type": "DocType",
				"icon": "clipboard",
				"child": 0,
				"collapsible": 1,
				"indent": 0,
				"keep_closed": 0,
				"show_arrow": 0,
			},
			{
				"type": "Link",
				"label": "Customers",
				"link_to": "Customer",
				"link_type": "DocType",
				"icon": "users",
				"child": 0,
				"collapsible": 1,
				"indent": 0,
				"keep_closed": 0,
				"show_arrow": 0,
			},
		]

		if frappe.db.exists("Workspace Sidebar", sidebar_name):
			print(f">>> Sales UI Lock: Workspace Sidebar '{sidebar_name}' exists, updating...")
			sidebar = frappe.get_doc("Workspace Sidebar", sidebar_name)
			sidebar.items = []
		else:
			print(f">>> Sales UI Lock: Creating new Workspace Sidebar '{sidebar_name}'...")
			sidebar = frappe.get_doc({
				"doctype": "Workspace Sidebar",
				"name": sidebar_name,
				"title": "Selling",
				"module": "Selling",
				"header_icon": "sell",
			})

		for item in allowed_items:
			sidebar.append("items", item)

		sidebar.flags.ignore_permissions = True
		sidebar.save()
		frappe.db.commit()
		frappe.clear_cache(doctype="Workspace Sidebar")
		frappe.clear_cache()
		print(">>> Sales UI Lock: === SUCCESS ===\n")

	except Exception as e:
		print(f">>> Sales UI Lock: ERROR - {str(e)}")
		frappe.log_error(
			title="Sales UI Lock Workspace Sidebar - ERROR",
			message=frappe.get_traceback(),
		)
