/**
 * KASETA - Permission Types
 * Enterprise RBAC permission system types
 */

// All available permission keys in the system
export type PermissionKey =
  // Organization
  | 'org.view'
  | 'org.settings'
  | 'org.billing'
  | 'org.delete'
  | 'org.transfer'
  // Members
  | 'members.view'
  | 'members.invite'
  | 'members.remove'
  | 'members.roles'
  | 'members.roles.admin'
  | 'members.roles.owner'
  // Units
  | 'units.view'
  | 'units.create'
  | 'units.edit'
  | 'units.delete'
  | 'units.assign'
  // Invitations
  | 'invitations.view.own'
  | 'invitations.view.unit'
  | 'invitations.view.all'
  | 'invitations.create'
  | 'invitations.cancel'
  | 'invitations.cancel.all'
  // Access
  | 'access.scan'
  | 'access.manual'
  | 'access.logs.view'
  | 'access.logs.export'
  // Announcements
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.edit'
  | 'announcements.delete'
  // Amenities
  | 'amenities.view'
  | 'amenities.reserve'
  | 'amenities.manage'
  | 'amenities.approve'
  // Packages
  | 'packages.view.own'
  | 'packages.view.all'
  | 'packages.register'
  | 'packages.deliver'
  // Maintenance
  | 'maintenance.view.own'
  | 'maintenance.view.all'
  | 'maintenance.create'
  | 'maintenance.manage'
  // Polls
  | 'polls.view'
  | 'polls.vote'
  | 'polls.create'
  | 'polls.manage'
  // Documents
  | 'documents.view'
  | 'documents.upload'
  | 'documents.manage'
  // Vehicles
  | 'vehicles.view.own'
  | 'vehicles.view.all'
  | 'vehicles.manage.own'
  | 'vehicles.manage.all'
  // Directory
  | 'directory.view'
  | 'directory.contact'
  // Emergency
  | 'emergency.alert'
  | 'emergency.manage'
  // Reports
  | 'reports.view'
  | 'reports.export'
  // Roles
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete';

// Permission category
export type PermissionCategory =
  | 'organization'
  | 'members'
  | 'units'
  | 'invitations'
  | 'access'
  | 'announcements'
  | 'amenities'
  | 'packages'
  | 'maintenance'
  | 'polls'
  | 'documents'
  | 'vehicles'
  | 'directory'
  | 'emergency'
  | 'reports'
  | 'roles';

// Permission definition
export interface Permission {
  id: string;
  key: PermissionKey;
  category: PermissionCategory;
  name: string;
  description: string | null;
}

// Role definition
export interface Role {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_system: boolean;
  is_default: boolean;
  hierarchy_level: number;
  created_at: string;
  updated_at: string;
}

// Role with its permissions
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// System role slugs
export type SystemRoleSlug = 'owner' | 'admin' | 'security' | 'member';

// Helper to check if a role slug is a system role
export const isSystemRole = (slug: string): slug is SystemRoleSlug => {
  return ['owner', 'admin', 'security', 'member'].includes(slug);
};

// Role hierarchy levels
export const ROLE_HIERARCHY = {
  owner: 0,
  admin: 10,
  security: 50,
  member: 100,
} as const;

// Permission groups for UI
export const PERMISSION_GROUPS: Record<PermissionCategory, {
  label: string;
  icon: string;
  permissions: PermissionKey[];
}> = {
  organization: {
    label: 'Organización',
    icon: '🏢',
    permissions: ['org.view', 'org.settings', 'org.billing', 'org.delete', 'org.transfer'],
  },
  members: {
    label: 'Miembros',
    icon: '👥',
    permissions: ['members.view', 'members.invite', 'members.remove', 'members.roles', 'members.roles.admin', 'members.roles.owner'],
  },
  units: {
    label: 'Unidades',
    icon: '🏠',
    permissions: ['units.view', 'units.create', 'units.edit', 'units.delete', 'units.assign'],
  },
  invitations: {
    label: 'Invitaciones',
    icon: '✉️',
    permissions: ['invitations.view.own', 'invitations.view.unit', 'invitations.view.all', 'invitations.create', 'invitations.cancel', 'invitations.cancel.all'],
  },
  access: {
    label: 'Acceso',
    icon: '🔐',
    permissions: ['access.scan', 'access.manual', 'access.logs.view', 'access.logs.export'],
  },
  announcements: {
    label: 'Anuncios',
    icon: '📢',
    permissions: ['announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'],
  },
  amenities: {
    label: 'Amenidades',
    icon: '🏊',
    permissions: ['amenities.view', 'amenities.reserve', 'amenities.manage', 'amenities.approve'],
  },
  packages: {
    label: 'Paquetes',
    icon: '📦',
    permissions: ['packages.view.own', 'packages.view.all', 'packages.register', 'packages.deliver'],
  },
  maintenance: {
    label: 'Mantenimiento',
    icon: '🔧',
    permissions: ['maintenance.view.own', 'maintenance.view.all', 'maintenance.create', 'maintenance.manage'],
  },
  polls: {
    label: 'Encuestas',
    icon: '📊',
    permissions: ['polls.view', 'polls.vote', 'polls.create', 'polls.manage'],
  },
  documents: {
    label: 'Documentos',
    icon: '📄',
    permissions: ['documents.view', 'documents.upload', 'documents.manage'],
  },
  vehicles: {
    label: 'Vehículos',
    icon: '🚗',
    permissions: ['vehicles.view.own', 'vehicles.view.all', 'vehicles.manage.own', 'vehicles.manage.all'],
  },
  directory: {
    label: 'Directorio',
    icon: '📒',
    permissions: ['directory.view', 'directory.contact'],
  },
  emergency: {
    label: 'Emergencias',
    icon: '🚨',
    permissions: ['emergency.alert', 'emergency.manage'],
  },
  reports: {
    label: 'Reportes',
    icon: '📈',
    permissions: ['reports.view', 'reports.export'],
  },
  roles: {
    label: 'Roles',
    icon: '🎭',
    permissions: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
  },
};

// Labels for permissions (Spanish)
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'org.view': 'Ver organización',
  'org.settings': 'Configurar organización',
  'org.billing': 'Gestionar facturación',
  'org.delete': 'Eliminar organización',
  'org.transfer': 'Transferir propiedad',
  'members.view': 'Ver miembros',
  'members.invite': 'Invitar miembros',
  'members.remove': 'Eliminar miembros',
  'members.roles': 'Gestionar roles',
  'members.roles.admin': 'Asignar rol admin',
  'members.roles.owner': 'Transferir ownership',
  'units.view': 'Ver unidades',
  'units.create': 'Crear unidades',
  'units.edit': 'Editar unidades',
  'units.delete': 'Eliminar unidades',
  'units.assign': 'Asignar residentes',
  'invitations.view.own': 'Ver propias invitaciones',
  'invitations.view.unit': 'Ver invitaciones de unidad',
  'invitations.view.all': 'Ver todas las invitaciones',
  'invitations.create': 'Crear invitaciones',
  'invitations.cancel': 'Cancelar invitaciones',
  'invitations.cancel.all': 'Cancelar cualquier invitación',
  'access.scan': 'Escanear QR',
  'access.manual': 'Registro manual',
  'access.logs.view': 'Ver logs de acceso',
  'access.logs.export': 'Exportar logs',
  'announcements.view': 'Ver anuncios',
  'announcements.create': 'Crear anuncios',
  'announcements.edit': 'Editar anuncios',
  'announcements.delete': 'Eliminar anuncios',
  'amenities.view': 'Ver amenidades',
  'amenities.reserve': 'Reservar amenidades',
  'amenities.manage': 'Gestionar amenidades',
  'amenities.approve': 'Aprobar reservaciones',
  'packages.view.own': 'Ver propios paquetes',
  'packages.view.all': 'Ver todos los paquetes',
  'packages.register': 'Registrar paquetes',
  'packages.deliver': 'Entregar paquetes',
  'maintenance.view.own': 'Ver propios tickets',
  'maintenance.view.all': 'Ver todos los tickets',
  'maintenance.create': 'Crear tickets',
  'maintenance.manage': 'Gestionar tickets',
  'polls.view': 'Ver encuestas',
  'polls.vote': 'Votar en encuestas',
  'polls.create': 'Crear encuestas',
  'polls.manage': 'Gestionar encuestas',
  'documents.view': 'Ver documentos',
  'documents.upload': 'Subir documentos',
  'documents.manage': 'Gestionar documentos',
  'vehicles.view.own': 'Ver propios vehículos',
  'vehicles.view.all': 'Ver todos los vehículos',
  'vehicles.manage.own': 'Gestionar propios vehículos',
  'vehicles.manage.all': 'Gestionar todos los vehículos',
  'directory.view': 'Ver directorio',
  'directory.contact': 'Contactar residentes',
  'emergency.alert': 'Enviar alertas',
  'emergency.manage': 'Gestionar emergencias',
  'reports.view': 'Ver reportes',
  'reports.export': 'Exportar reportes',
  'roles.view': 'Ver roles',
  'roles.create': 'Crear roles',
  'roles.edit': 'Editar roles',
  'roles.delete': 'Eliminar roles',
};
