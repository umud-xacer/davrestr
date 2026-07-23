import enum


class Role(str, enum.Enum):
    """Foydalanuvchi rollari (RBAC).

    citizen           - avtorizatsiyasiz/avtorizatsiyali oddiy foydalanuvchi (Ochiq Portal)
    cabinet_employee   - idora xodimi: yozuv yaratadi/tahrirlaydi, lekin imzolay olmaydi
    cabinet_approver    - idora mas'ul shaxsi: E-IMZO bilan tasdiqlaydi va e'lon qiladi
    org_admin          - o'z tashkiloti doirasida xodimlarni boshqaradi
    superadmin         - butun tizim: reestr strukturasi, foydalanuvchilar, audit
    """

    CITIZEN = "citizen"
    CABINET_EMPLOYEE = "cabinet_employee"
    CABINET_APPROVER = "cabinet_approver"
    ORG_ADMIN = "org_admin"
    SUPERADMIN = "superadmin"


# Cabinet va Admin panelga kira oladigan rollar (public/citizen bu yerga kirmaydi)
STAFF_ROLES = {Role.CABINET_EMPLOYEE, Role.CABINET_APPROVER, Role.ORG_ADMIN, Role.SUPERADMIN}
APPROVER_ROLES = {Role.CABINET_APPROVER, Role.ORG_ADMIN, Role.SUPERADMIN}
ADMIN_ROLES = {Role.ORG_ADMIN, Role.SUPERADMIN}
