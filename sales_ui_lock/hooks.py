app_name = "sales_ui_lock"
app_title = "Sales UI Lock"
app_publisher = "SurgiShop"
app_description = "Force roles to their specific module and eliminate access to desktop"
app_email = "gary.starr@surgishop.com"
app_license = "MIT"
required_apps = ["frappe/erpnext"]
required_frappe_version = ">=16.0.0"
app_logo_url = "/assets/sales_ui_lock/sales_ui_lock/sales-ui-lock-icon.svg"

boot_session = "sales_ui_lock.boot.enforce_allowed_modules"

app_include_js = [
    "/assets/sales_ui_lock/js/desk_ui_lock.js",
    "/assets/sales_ui_lock/js/disable_navbar_items.js"
]

after_migrate = [
    "sales_ui_lock.workspace_sidebar.setup_sales_workspace_sidebar"

