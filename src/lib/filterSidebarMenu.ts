// src/lib/filterSidebarMenu.ts
import type { SidebarMenuGroup, SidebarMenuItem } from '@/config/sidebarMenu'
import type { BaseRole, DynamicPermission } from '@/stores/authStore'

interface FilterParams {
    baseRole: BaseRole
    dynamicPermissions: DynamicPermission[]
}

/**
 * Filter sidebar menu depending on the user's base_role and dynamic_permissions.
 * 'admin' can access all menus.
 */
export function filterSidebarMenu(
    menuConfig: SidebarMenuGroup[],
    { baseRole, dynamicPermissions }: FilterParams
): SidebarMenuGroup[] {
    const isAdmin = baseRole === 'admin'

    return menuConfig
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                canAccessMenuItem(item, baseRole, dynamicPermissions, isAdmin)
            ),
        }))
        .filter((group) => group.items.length > 0) // Remove empty groups
}

function canAccessMenuItem(
    item: SidebarMenuItem,
    baseRole: BaseRole,
    dynamicPermissions: DynamicPermission[],
    isAdmin: boolean
): boolean {
    if (isAdmin) return true
    if (item.adminOnly) return false
    if (!item.roles && !item.permissions) return true

    // Evaluated independently — OR logic
    const hasRole = item.roles ? item.roles.includes(baseRole) : false
    const hasPerm = item.permissions ? item.permissions.some((p) => dynamicPermissions.includes(p)) : false

    // If both configs present, either one satisfied gives access (though usually one is mutually exclusive conceptually)
    if (item.roles && item.permissions) return hasRole || hasPerm
    if (item.roles) return hasRole
    if (item.permissions) return hasPerm

    return false
}
