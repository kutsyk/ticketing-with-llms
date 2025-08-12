import os

# ----- Directories -----
dirs = [
    "web/src/app/core/interceptors",
    "web/src/app/core/guards",
    "web/src/app/core/services",
    "web/src/app/core/models",
    "web/src/app/core/tokens",
    "web/src/app/core/config",
    "web/src/app/core/utils",
    "web/src/app/shared/material",
    "web/src/app/shared/components/header",
    "web/src/app/shared/components/footer",
    "web/src/app/shared/components/sidebar",
    "web/src/app/shared/components/data-table",
    "web/src/app/shared/components/confirm-dialog",
    "web/src/app/shared/components/loading-overlay",
    "web/src/app/shared/components/qr-view",
    "web/src/app/shared/components/qr-scanner",
    "web/src/app/shared/directives",
    "web/src/app/shared/pipes",
    "web/src/app/layout/main-layout",
    "web/src/app/layout/admin-layout",

    # Features - auth
    "web/src/app/features/auth/pages/login",
    "web/src/app/features/auth/pages/register",
    "web/src/app/features/auth/pages/verify-email",
    "web/src/app/features/auth/pages/forgot-password",
    "web/src/app/features/auth/pages/reset-password",
    "web/src/app/features/auth/services",

    # Features - events
    "web/src/app/features/events/pages/list",
    "web/src/app/features/events/pages/detail",
    "web/src/app/features/events/components/ticket-type-card",
    "web/src/app/features/events/resolvers",

    # Features - checkout
    "web/src/app/features/checkout/pages/checkout",
    "web/src/app/features/checkout/pages/success",

    # Features - profile
    "web/src/app/features/profile/pages/profile",
    "web/src/app/features/profile/pages/tickets/tickets-list",
    "web/src/app/features/profile/pages/tickets/ticket-detail",

    # Features - seller
    "web/src/app/features/seller/pages/issue",
    "web/src/app/features/seller/pages/sales",

    # Features - checker
    "web/src/app/features/checker/pages/scan",
    "web/src/app/features/checker/pages/validate",

    # Features - admin (lists + edit/detail)
    "web/src/app/features/admin/pages/dashboard",
    "web/src/app/features/admin/pages/users/users-list",
    "web/src/app/features/admin/pages/users/user-edit",
    "web/src/app/features/admin/pages/events/events-list",
    "web/src/app/features/admin/pages/events/event-edit",
    "web/src/app/features/admin/pages/ticket-types/ticket-types-list",
    "web/src/app/features/admin/pages/ticket-types/ticket-type-edit",
    "web/src/app/features/admin/pages/tickets/tickets-list",
    "web/src/app/features/admin/pages/tickets/ticket-edit",
    "web/src/app/features/admin/pages/payments/payments-list",
    "web/src/app/features/admin/pages/payments/payment-detail",
    "web/src/app/features/admin/pages/scans/scans-list",
    "web/src/app/features/admin/pages/audit-logs/audit-logs-list",
    "web/src/app/features/admin/pages/settings",
    "web/src/app/features/admin/components/user-form",
    "web/src/app/features/admin/components/event-form",
    "web/src/app/features/admin/components/ticket-type-form",
    "web/src/app/features/admin/components/ticket-form",

    # Assets, environments
    "web/src/assets/images",
    "web/src/assets/icons",
    "web/src/assets/i18n",
    "web/src/environments",
]

# ----- Files -----
files = [
    # Root project files
    "web/angular.json",
    "web/package.json",
    "web/tsconfig.json",
    "web/tsconfig.app.json",
    "web/tsconfig.spec.json",
    "web/.eslintrc.json",
    "web/.prettierrc",
    "web/.editorconfig",
    "web/.nvmrc",
    "web/.gitignore",
    "web/.browserslistrc",
    "web/README.md",
    "web/.env.example",
    "web/Dockerfile",
    "web/.dockerignore",
    "web/nginx.conf",

    # App entry and global styles
    "web/src/index.html",
    "web/src/main.ts",
    "web/src/styles.scss",
    "web/src/theme.scss",

    # Assets
    "web/src/assets/images/logo.svg",
    "web/src/assets/i18n/en.json",

    # Environments
    "web/src/environments/environment.ts",
    "web/src/environments/environment.prod.ts",

    # App root
    "web/src/app/app.component.html",
    "web/src/app/app.component.scss",
    "web/src/app/app.component.ts",
    "web/src/app/app.module.ts",
    "web/src/app/app-routing.module.ts",

    # Core module & utils
    "web/src/app/core/core.module.ts",
    "web/src/app/core/interceptors/auth-token.interceptor.ts",
    "web/src/app/core/interceptors/error.interceptor.ts",
    "web/src/app/core/interceptors/loading.interceptor.ts",
    "web/src/app/core/guards/auth.guard.ts",
    "web/src/app/core/guards/role.guard.ts",
    "web/src/app/core/services/api.service.ts",
    "web/src/app/core/services/auth.service.ts",
    "web/src/app/core/services/users.service.ts",
    "web/src/app/core/services/events.service.ts",
    "web/src/app/core/services/ticket-types.service.ts",
    "web/src/app/core/services/tickets.service.ts",
    "web/src/app/core/services/payments.service.ts",
    "web/src/app/core/services/scans.service.ts",
    "web/src/app/core/services/audit-logs.service.ts",
    "web/src/app/core/services/exports.service.ts",
    "web/src/app/core/services/stripe.service.ts",
    "web/src/app/core/models/user.model.ts",
    "web/src/app/core/models/event.model.ts",
    "web/src/app/core/models/ticket-type.model.ts",
    "web/src/app/core/models/ticket.model.ts",
    "web/src/app/core/models/payment.model.ts",
    "web/src/app/core/models/scan.model.ts",
    "web/src/app/core/models/audit-log.model.ts",
    "web/src/app/core/tokens/app-config.token.ts",
    "web/src/app/core/config/app-config.ts",
    "web/src/app/core/utils/jwt.ts",
    "web/src/app/core/utils/date.ts",
    "web/src/app/core/utils/csv.ts",

    # Shared module & components
    "web/src/app/shared/material/material.module.ts",
    "web/src/app/shared/components/header/header.component.html",
    "web/src/app/shared/components/header/header.component.scss",
    "web/src/app/shared/components/header/header.component.ts",
    "web/src/app/shared/components/footer/footer.component.html",
    "web/src/app/shared/components/footer/footer.component.scss",
    "web/src/app/shared/components/footer/footer.component.ts",
    "web/src/app/shared/components/sidebar/sidebar.component.html",
    "web/src/app/shared/components/sidebar/sidebar.component.scss",
    "web/src/app/shared/components/sidebar/sidebar.component.ts",
    "web/src/app/shared/components/data-table/data-table.component.html",
    "web/src/app/shared/components/data-table/data-table.component.scss",
    "web/src/app/shared/components/data-table/data-table.component.ts",
    "web/src/app/shared/components/confirm-dialog/confirm-dialog.component.html",
    "web/src/app/shared/components/confirm-dialog/confirm-dialog.component.scss",
    "web/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts",
    "web/src/app/shared/components/loading-overlay/loading-overlay.component.html",
    "web/src/app/shared/components/loading-overlay/loading-overlay.component.scss",
    "web/src/app/shared/components/loading-overlay/loading-overlay.component.ts",
    "web/src/app/shared/components/qr-view/qr-view.component.html",
    "web/src/app/shared/components/qr-view/qr-view.component.scss",
    "web/src/app/shared/components/qr-view/qr-view.component.ts",
    "web/src/app/shared/components/qr-scanner/qr-scanner.component.html",
    "web/src/app/shared/components/qr-scanner/qr-scanner.component.scss",
    "web/src/app/shared/components/qr-scanner/qr-scanner.component.ts",
    "web/src/app/shared/directives/autofocus.directive.ts",
    "web/src/app/shared/pipes/date-format.pipe.ts",
    "web/src/app/shared/pipes/currency.pipe.ts",

    # Layouts
    "web/src/app/layout/main-layout/main-layout.component.html",
    "web/src/app/layout/main-layout/main-layout.component.scss",
    "web/src/app/layout/main-layout/main-layout.component.ts",
    "web/src/app/layout/admin-layout/admin-layout.component.html",
    "web/src/app/layout/admin-layout/admin-layout.component.scss",
    "web/src/app/layout/admin-layout/admin-layout.component.ts",

    # Auth feature
    "web/src/app/features/auth/auth-routing.module.ts",
    "web/src/app/features/auth/auth.module.ts",
    "web/src/app/features/auth/pages/login/login.component.html",
    "web/src/app/features/auth/pages/login/login.component.scss",
    "web/src/app/features/auth/pages/login/login.component.ts",
    "web/src/app/features/auth/pages/register/register.component.html",
    "web/src/app/features/auth/pages/register/register.component.scss",
    "web/src/app/features/auth/pages/register/register.component.ts",
    "web/src/app/features/auth/pages/verify-email/verify-email.component.html",
    "web/src/app/features/auth/pages/verify-email/verify-email.component.scss",
    "web/src/app/features/auth/pages/verify-email/verify-email.component.ts",
    "web/src/app/features/auth/pages/forgot-password/forgot-password.component.html",
    "web/src/app/features/auth/pages/forgot-password/forgot-password.component.scss",
    "web/src/app/features/auth/pages/forgot-password/forgot-password.component.ts",
    "web/src/app/features/auth/pages/reset-password/reset-password.component.html",
    "web/src/app/features/auth/pages/reset-password/reset-password.component.scss",
    "web/src/app/features/auth/pages/reset-password/reset-password.component.ts",
    "web/src/app/features/auth/services/oauth.service.ts",

    # Events feature
    "web/src/app/features/events/events-routing.module.ts",
    "web/src/app/features/events/events.module.ts",
    "web/src/app/features/events/pages/list/events-list.component.html",
    "web/src/app/features/events/pages/list/events-list.component.scss",
    "web/src/app/features/events/pages/list/events-list.component.ts",
    "web/src/app/features/events/pages/detail/event-detail.component.html",
    "web/src/app/features/events/pages/detail/event-detail.component.scss",
    "web/src/app/features/events/pages/detail/event-detail.component.ts",
    "web/src/app/features/events/components/ticket-type-card/ticket-type-card.component.html",
    "web/src/app/features/events/components/ticket-type-card/ticket-type-card.component.scss",
    "web/src/app/features/events/components/ticket-type-card/ticket-type-card.component.ts",
    "web/src/app/features/events/resolvers/event.resolver.ts",

    # Checkout feature
    "web/src/app/features/checkout/checkout-routing.module.ts",
    "web/src/app/features/checkout/checkout.module.ts",
    "web/src/app/features/checkout/pages/checkout/checkout.component.html",
    "web/src/app/features/checkout/pages/checkout/checkout.component.scss",
    "web/src/app/features/checkout/pages/checkout/checkout.component.ts",
    "web/src/app/features/checkout/pages/success/checkout-success.component.html",
    "web/src/app/features/checkout/pages/success/checkout-success.component.scss",
    "web/src/app/features/checkout/pages/success/checkout-success.component.ts",

    # Profile feature
    "web/src/app/features/profile/profile-routing.module.ts",
    "web/src/app/features/profile/profile.module.ts",
    "web/src/app/features/profile/pages/profile/profile.component.html",
    "web/src/app/features/profile/pages/profile/profile.component.scss",
    "web/src/app/features/profile/pages/profile/profile.component.ts",
    "web/src/app/features/profile/pages/tickets/tickets-list/tickets-list.component.html",
    "web/src/app/features/profile/pages/tickets/tickets-list/tickets-list.component.scss",
    "web/src/app/features/profile/pages/tickets/tickets-list/tickets-list.component.ts",
    "web/src/app/features/profile/pages/tickets/ticket-detail/ticket-detail.component.html",
    "web/src/app/features/profile/pages/tickets/ticket-detail/ticket-detail.component.scss",
    "web/src/app/features/profile/pages/tickets/ticket-detail/ticket-detail.component.ts",

    # Seller feature
    "web/src/app/features/seller/seller-routing.module.ts",
    "web/src/app/features/seller/seller.module.ts",
    "web/src/app/features/seller/pages/issue/seller-issue.component.html",
    "web/src/app/features/seller/pages/issue/seller-issue.component.scss",
    "web/src/app/features/seller/pages/issue/seller-issue.component.ts",
    "web/src/app/features/seller/pages/sales/seller-sales.component.html",
    "web/src/app/features/seller/pages/sales/seller-sales.component.scss",
    "web/src/app/features/seller/pages/sales/seller-sales.component.ts",

    # Checker feature
    "web/src/app/features/checker/checker-routing.module.ts",
    "web/src/app/features/checker/checker.module.ts",
    "web/src/app/features/checker/pages/scan/checker-scan.component.html",
    "web/src/app/features/checker/pages/scan/checker-scan.component.scss",
    "web/src/app/features/checker/pages/scan/checker-scan.component.ts",
    "web/src/app/features/checker/pages/validate/checker-validate.component.html",
    "web/src/app/features/checker/pages/validate/checker-validate.component.scss",
    "web/src/app/features/checker/pages/validate/checker-validate.component.ts",

    # Admin feature
    "web/src/app/features/admin/admin-routing.module.ts",
    "web/src/app/features/admin/admin.module.ts",
    "web/src/app/features/admin/pages/dashboard/admin-dashboard.component.html",
    "web/src/app/features/admin/pages/dashboard/admin-dashboard.component.scss",
    "web/src/app/features/admin/pages/dashboard/admin-dashboard.component.ts",

    "web/src/app/features/admin/pages/users/users-list/users-list.component.html",
    "web/src/app/features/admin/pages/users/users-list/users-list.component.scss",
    "web/src/app/features/admin/pages/users/users-list/users-list.component.ts",
    "web/src/app/features/admin/pages/users/user-edit/user-edit.component.html",
    "web/src/app/features/admin/pages/users/user-edit/user-edit.component.scss",
    "web/src/app/features/admin/pages/users/user-edit/user-edit.component.ts",

    "web/src/app/features/admin/pages/events/events-list/events-list.component.html",
    "web/src/app/features/admin/pages/events/events-list/events-list.component.scss",
    "web/src/app/features/admin/pages/events/events-list/events-list.component.ts",
    "web/src/app/features/admin/pages/events/event-edit/event-edit.component.html",
    "web/src/app/features/admin/pages/events/event-edit/event-edit.component.scss",
    "web/src/app/features/admin/pages/events/event-edit/event-edit.component.ts",

    "web/src/app/features/admin/pages/ticket-types/ticket-types-list/ticket-types-list.component.html",
    "web/src/app/features/admin/pages/ticket-types/ticket-types-list/ticket-types-list.component.scss",
    "web/src/app/features/admin/pages/ticket-types/ticket-types-list/ticket-types-list.component.ts",
    "web/src/app/features/admin/pages/ticket-types/ticket-type-edit/ticket-type-edit.component.html",
    "web/src/app/features/admin/pages/ticket-types/ticket-type-edit/ticket-type-edit.component.scss",
    "web/src/app/features/admin/pages/ticket-types/ticket-type-edit/ticket-type-edit.component.ts",

    "web/src/app/features/admin/pages/tickets/tickets-list/tickets-list.component.html",
    "web/src/app/features/admin/pages/tickets/tickets-list/tickets-list.component.scss",
    "web/src/app/features/admin/pages/tickets/tickets-list/tickets-list.component.ts",
    "web/src/app/features/admin/pages/tickets/ticket-edit/ticket-edit.component.html",
    "web/src/app/features/admin/pages/tickets/ticket-edit/ticket-edit.component.scss",
    "web/src/app/features/admin/pages/tickets/ticket-edit/ticket-edit.component.ts",

    "web/src/app/features/admin/pages/payments/payments-list/payments-list.component.html",
    "web/src/app/features/admin/pages/payments/payments-list/payments-list.component.scss",
    "web/src/app/features/admin/pages/payments/payments-list/payments-list.component.ts",
    "web/src/app/features/admin/pages/payments/payment-detail/payment-detail.component.html",
    "web/src/app/features/admin/pages/payments/payment-detail/payment-detail.component.scss",
    "web/src/app/features/admin/pages/payments/payment-detail/payment-detail.component.ts",

    "web/src/app/features/admin/pages/scans/scans-list/scans-list.component.html",
    "web/src/app/features/admin/pages/scans/scans-list/scans-list.component.scss",
    "web/src/app/features/admin/pages/scans/scans-list/scans-list.component.ts",

    "web/src/app/features/admin/pages/audit-logs/audit-logs-list/audit-logs-list.component.html",
    "web/src/app/features/admin/pages/audit-logs/audit-logs-list/audit-logs-list.component.scss",
    "web/src/app/features/admin/pages/audit-logs/audit-logs-list/audit-logs-list.component.ts",

    "web/src/app/features/admin/pages/settings/settings.component.html",
    "web/src/app/features/admin/pages/settings/settings.component.scss",
    "web/src/app/features/admin/pages/settings/settings.component.ts",

    "web/src/app/features/admin/components/user-form/user-form.component.html",
    "web/src/app/features/admin/components/user-form/user-form.component.scss",
    "web/src/app/features/admin/components/user-form/user-form.component.ts",
    "web/src/app/features/admin/components/event-form/event-form.component.html",
    "web/src/app/features/admin/components/event-form/event-form.component.scss",
    "web/src/app/features/admin/components/event-form/event-form.component.ts",
    "web/src/app/features/admin/components/ticket-type-form/ticket-type-form.component.html",
    "web/src/app/features/admin/components/ticket-type-form/ticket-type-form.component.scss",
    "web/src/app/features/admin/components/ticket-type-form/ticket-type-form.component.ts",
    "web/src/app/features/admin/components/ticket-form/ticket-form.component.html",
    "web/src/app/features/admin/components/ticket-form/ticket-form.component.scss",
    "web/src/app/features/admin/components/ticket-form/ticket-form.component.ts",
]

def touch(path: str, content: str = ""):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# Create directories
for d in dirs:
    os.makedirs(d, exist_ok=True)

# Create empty files
for fpath in files:
    # Place a tiny placeholder in a couple of obvious files
    if fpath.endswith("logo.svg"):
        touch(fpath, '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#1976d2"/></svg>\n')
    elif fpath.endswith("en.json"):
        touch(fpath, '{ "app": { "title": "Ticketing App" } }\n')
    else:
        touch(fpath, "")

print("✅ Angular + Material web skeleton created under ./web")
