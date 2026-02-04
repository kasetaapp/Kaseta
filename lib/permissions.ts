/**
 * KASETA - Permissions Library
 * Utilities for the enterprise permission system
 */

import type { PermissionKey } from '@/types/permissions';

/**
 * Maps legacy role checks to new permission keys
 * This helps during migration from the old role-based system
 */
export const LEGACY_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  // Old: isAdmin || isSuperAdmin -> canManageUsers
  canManageUsers: [
    'members.view',
    'members.invite',
    'members.remove',
    'members.roles',
  ],

  // Old: isGuard || isAdmin || isSuperAdmin -> canScanAccess
  canScanAccess: [
    'access.scan',
    'access.manual',
    'access.logs.view',
  ],

  // Old: isResident || isAdmin || isSuperAdmin -> canCreateInvitations
  canCreateInvitations: [
    'invitations.create',
    'invitations.view.own',
    'invitations.cancel',
  ],

  // Admin panel access
  canAccessAdminPanel: [
    'members.view',
    'units.view',
    'reports.view',
  ],

  // Can create announcements
  canCreateAnnouncements: [
    'announcements.create',
  ],

  // Can create polls
  canCreatePolls: [
    'polls.create',
  ],

  // Can manage amenities
  canManageAmenities: [
    'amenities.manage',
    'amenities.approve',
  ],

  // Can manage packages
  canManagePackages: [
    'packages.register',
    'packages.deliver',
  ],
};

/**
 * Permission categories with their display info
 */
export const PERMISSION_CATEGORIES = {
  organization: {
    name: 'Organización',
    icon: '🏢',
    description: 'Configuración y administración de la organización',
  },
  members: {
    name: 'Miembros',
    icon: '👥',
    description: 'Gestión de usuarios y roles',
  },
  units: {
    name: 'Unidades',
    icon: '🏠',
    description: 'Casas, departamentos o espacios',
  },
  invitations: {
    name: 'Invitaciones',
    icon: '✉️',
    description: 'Invitaciones de visitantes',
  },
  access: {
    name: 'Acceso',
    icon: '🔐',
    description: 'Control de acceso y seguridad',
  },
  announcements: {
    name: 'Anuncios',
    icon: '📢',
    description: 'Comunicados de la comunidad',
  },
  amenities: {
    name: 'Amenidades',
    icon: '🏊',
    description: 'Áreas comunes y reservaciones',
  },
  packages: {
    name: 'Paquetes',
    icon: '📦',
    description: 'Recepción de paquetería',
  },
  maintenance: {
    name: 'Mantenimiento',
    icon: '🔧',
    description: 'Reportes y tickets de mantenimiento',
  },
  polls: {
    name: 'Encuestas',
    icon: '📊',
    description: 'Votaciones y encuestas',
  },
  documents: {
    name: 'Documentos',
    icon: '📄',
    description: 'Documentos compartidos',
  },
  vehicles: {
    name: 'Vehículos',
    icon: '🚗',
    description: 'Registro de vehículos',
  },
  directory: {
    name: 'Directorio',
    icon: '📒',
    description: 'Directorio de residentes',
  },
  emergency: {
    name: 'Emergencias',
    icon: '🚨',
    description: 'Alertas y protocolos de emergencia',
  },
  reports: {
    name: 'Reportes',
    icon: '📈',
    description: 'Estadísticas y reportes',
  },
  roles: {
    name: 'Roles',
    icon: '🎭',
    description: 'Gestión de roles y permisos',
  },
};

/**
 * Default role configurations
 * Used when creating new organizations
 */
export const DEFAULT_ROLE_CONFIGS = {
  owner: {
    name: 'Propietario',
    slug: 'owner',
    color: '#EAB308', // Yellow
    description: 'Dueño de la organización con acceso total',
    hierarchy_level: 0,
    // Gets ALL permissions
  },
  admin: {
    name: 'Administrador',
    slug: 'admin',
    color: '#3B82F6', // Blue
    description: 'Administrador con acceso a gestión',
    hierarchy_level: 10,
    // Gets all except: org.delete, org.transfer, members.roles.owner
  },
  security: {
    name: 'Seguridad',
    slug: 'security',
    color: '#8B5CF6', // Purple
    description: 'Personal de seguridad y control de acceso',
    hierarchy_level: 50,
    // Gets: access.*, packages.*, directory.view, emergency.alert
  },
  member: {
    name: 'Residente',
    slug: 'member',
    color: '#6B7280', // Gray
    description: 'Miembro regular de la comunidad',
    hierarchy_level: 100,
    // Gets: basic view and own resource management
  },
};

/**
 * Get role color by slug
 */
export function getRoleColor(slug: string): string {
  const config = DEFAULT_ROLE_CONFIGS[slug as keyof typeof DEFAULT_ROLE_CONFIGS];
  return config?.color || '#6B7280';
}

/**
 * Get role display name by slug
 */
export function getRoleDisplayName(slug: string): string {
  const config = DEFAULT_ROLE_CONFIGS[slug as keyof typeof DEFAULT_ROLE_CONFIGS];
  return config?.name || slug;
}

/**
 * Check if a role can assign another role (based on hierarchy)
 */
export function canAssignRole(
  currentRoleLevel: number,
  targetRoleLevel: number
): boolean {
  // Can only assign roles of lower privilege (higher number)
  return currentRoleLevel < targetRoleLevel;
}

/**
 * Check if a role is a system role (cannot be deleted)
 */
export function isSystemRole(slug: string): boolean {
  return ['owner', 'admin', 'security', 'member'].includes(slug);
}

/**
 * Dangerous permissions that should show warnings
 */
export const DANGEROUS_PERMISSIONS: PermissionKey[] = [
  'org.delete',
  'org.transfer',
  'members.remove',
  'members.roles.owner',
  'units.delete',
  'emergency.manage',
];

/**
 * Check if a permission is dangerous
 */
export function isDangerousPermission(key: PermissionKey): boolean {
  return DANGEROUS_PERMISSIONS.includes(key);
}
