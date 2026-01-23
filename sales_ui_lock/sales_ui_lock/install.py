# Copyright (c) 2025, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe


def after_install():
	"""
	Run after the app is installed.
	Ensures workspace and sidebar are set up.
	"""
	cleanup_old_workspaces()


def cleanup_old_workspaces():
	"""
	Remove old/renamed workspaces to prevent duplicates.
	Called after install and can be called after migrate.
	"""
	# Add any old workspace names here if you rename workspaces in the future
	old_workspaces = []

	for ws_name in old_workspaces:
		if frappe.db.exists("Workspace", ws_name):
			try:
				frappe.delete_doc("Workspace", ws_name, force=True, ignore_permissions=True)
				frappe.db.commit()
				print(f"Deleted old workspace: {ws_name}")
			except Exception as e:
				print(f"Could not delete workspace {ws_name}: {e}")


def fix_settings_defaults():
	"""
	Fix default values for settings fields if needed.
	Currently a placeholder for future settings.
	"""
	pass
