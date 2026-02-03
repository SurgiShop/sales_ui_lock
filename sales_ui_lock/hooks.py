app_name = "sales_ui_lock"
app_title = "Sales UI Lock"
app_publisher = "SurgiShop"
app_description = "Force roles to their specific module and eliminate access to desktop"
app_email = "gary.starr@surgishop.com"
app_license = "MIT"
required_apps = ["frappe/erpnext"]
required_frappe_version = ">=16.0.0"
app_logo_url = "/assets/sales_ui_lock/sales_ui_lock/sales-ui-lock-icon.svg"

app_include_js = [
    "/assets/sales_ui_lock/js/desk_ui_lock.js",
    "/assets/sales_ui_lock/js/disable_navbar_items.js"
]

# Run when the app is first installed
after_install = "sales_ui_lock.path.to.workspace_sidebar.ensure_sales_sidebar"

# Run every time 'bench migrate' is executed (recommended for UI locks)
after_migrate = "sales_ui_lock.path.to.workspace_sidebar.ensure_sales_sidebar"
