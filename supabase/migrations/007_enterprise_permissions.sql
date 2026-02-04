-- KASETA Enterprise Permissions System
-- Migration: 007_enterprise_permissions.sql
-- Implements RBAC (Role-Based Access Control) with granular permissions

-- ============================================================================
-- STEP 1: Create Permissions Table (Global, defined by the app)
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,           -- 'org.delete', 'members.invite', etc.
  category TEXT NOT NULL,             -- 'organization', 'members', 'invitations', etc.
  name TEXT NOT NULL,                 -- Human readable name
  description TEXT,                   -- Detailed description
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all permissions
INSERT INTO permissions (key, category, name, description) VALUES
  -- Organization permissions
  ('org.view', 'organization', 'Ver organización', 'Ver información básica de la organización'),
  ('org.settings', 'organization', 'Configurar organización', 'Modificar configuración de la organización'),
  ('org.billing', 'organization', 'Gestionar facturación', 'Acceder a facturación y planes'),
  ('org.delete', 'organization', 'Eliminar organización', 'Eliminar permanentemente la organización'),
  ('org.transfer', 'organization', 'Transferir propiedad', 'Transferir ownership a otro usuario'),

  -- Member permissions
  ('members.view', 'members', 'Ver miembros', 'Ver lista de miembros de la organización'),
  ('members.invite', 'members', 'Invitar miembros', 'Enviar invitaciones a nuevos miembros'),
  ('members.remove', 'members', 'Eliminar miembros', 'Remover miembros de la organización'),
  ('members.roles', 'members', 'Gestionar roles', 'Cambiar roles de los miembros'),
  ('members.roles.admin', 'members', 'Asignar rol admin', 'Puede asignar el rol de administrador'),
  ('members.roles.owner', 'members', 'Transferir ownership', 'Puede transferir el rol de owner'),

  -- Unit permissions
  ('units.view', 'units', 'Ver unidades', 'Ver lista de unidades'),
  ('units.create', 'units', 'Crear unidades', 'Crear nuevas unidades'),
  ('units.edit', 'units', 'Editar unidades', 'Modificar información de unidades'),
  ('units.delete', 'units', 'Eliminar unidades', 'Eliminar unidades'),
  ('units.assign', 'units', 'Asignar residentes', 'Asignar usuarios a unidades'),

  -- Invitation permissions
  ('invitations.view.own', 'invitations', 'Ver propias invitaciones', 'Ver invitaciones creadas por uno mismo'),
  ('invitations.view.unit', 'invitations', 'Ver invitaciones de unidad', 'Ver invitaciones de su unidad'),
  ('invitations.view.all', 'invitations', 'Ver todas las invitaciones', 'Ver todas las invitaciones de la organización'),
  ('invitations.create', 'invitations', 'Crear invitaciones', 'Crear nuevas invitaciones de visitantes'),
  ('invitations.cancel', 'invitations', 'Cancelar invitaciones', 'Cancelar invitaciones activas'),
  ('invitations.cancel.all', 'invitations', 'Cancelar cualquier invitación', 'Cancelar invitaciones de cualquier usuario'),

  -- Access/Security permissions
  ('access.scan', 'access', 'Escanear QR', 'Escanear códigos QR de invitaciones'),
  ('access.manual', 'access', 'Registro manual', 'Registrar accesos manualmente'),
  ('access.logs.view', 'access', 'Ver logs de acceso', 'Ver historial de accesos'),
  ('access.logs.export', 'access', 'Exportar logs', 'Exportar logs de acceso'),

  -- Announcements permissions
  ('announcements.view', 'announcements', 'Ver anuncios', 'Ver anuncios de la comunidad'),
  ('announcements.create', 'announcements', 'Crear anuncios', 'Publicar nuevos anuncios'),
  ('announcements.edit', 'announcements', 'Editar anuncios', 'Modificar anuncios existentes'),
  ('announcements.delete', 'announcements', 'Eliminar anuncios', 'Eliminar anuncios'),

  -- Amenities permissions
  ('amenities.view', 'amenities', 'Ver amenidades', 'Ver lista de amenidades'),
  ('amenities.reserve', 'amenities', 'Reservar amenidades', 'Hacer reservaciones de amenidades'),
  ('amenities.manage', 'amenities', 'Gestionar amenidades', 'Crear, editar y eliminar amenidades'),
  ('amenities.approve', 'amenities', 'Aprobar reservaciones', 'Aprobar o rechazar reservaciones'),

  -- Packages permissions
  ('packages.view.own', 'packages', 'Ver propios paquetes', 'Ver paquetes de su unidad'),
  ('packages.view.all', 'packages', 'Ver todos los paquetes', 'Ver todos los paquetes de la organización'),
  ('packages.register', 'packages', 'Registrar paquetes', 'Registrar llegada de paquetes'),
  ('packages.deliver', 'packages', 'Entregar paquetes', 'Marcar paquetes como entregados'),

  -- Maintenance permissions
  ('maintenance.view.own', 'maintenance', 'Ver propios tickets', 'Ver tickets de mantenimiento propios'),
  ('maintenance.view.all', 'maintenance', 'Ver todos los tickets', 'Ver todos los tickets de la organización'),
  ('maintenance.create', 'maintenance', 'Crear tickets', 'Crear tickets de mantenimiento'),
  ('maintenance.manage', 'maintenance', 'Gestionar tickets', 'Asignar y resolver tickets'),

  -- Polls permissions
  ('polls.view', 'polls', 'Ver encuestas', 'Ver encuestas de la comunidad'),
  ('polls.vote', 'polls', 'Votar en encuestas', 'Participar en encuestas'),
  ('polls.create', 'polls', 'Crear encuestas', 'Crear nuevas encuestas'),
  ('polls.manage', 'polls', 'Gestionar encuestas', 'Editar y cerrar encuestas'),

  -- Documents permissions
  ('documents.view', 'documents', 'Ver documentos', 'Ver documentos compartidos'),
  ('documents.upload', 'documents', 'Subir documentos', 'Subir nuevos documentos'),
  ('documents.manage', 'documents', 'Gestionar documentos', 'Editar y eliminar documentos'),

  -- Vehicles permissions
  ('vehicles.view.own', 'vehicles', 'Ver propios vehículos', 'Ver vehículos de su unidad'),
  ('vehicles.view.all', 'vehicles', 'Ver todos los vehículos', 'Ver todos los vehículos registrados'),
  ('vehicles.manage.own', 'vehicles', 'Gestionar propios vehículos', 'Registrar y editar vehículos propios'),
  ('vehicles.manage.all', 'vehicles', 'Gestionar todos los vehículos', 'Gestionar cualquier vehículo'),

  -- Directory permissions
  ('directory.view', 'directory', 'Ver directorio', 'Ver directorio de residentes'),
  ('directory.contact', 'directory', 'Contactar residentes', 'Ver información de contacto'),

  -- Emergency permissions
  ('emergency.alert', 'emergency', 'Enviar alertas', 'Enviar alertas de emergencia'),
  ('emergency.manage', 'emergency', 'Gestionar emergencias', 'Gestionar protocolos de emergencia'),

  -- Reports permissions
  ('reports.view', 'reports', 'Ver reportes', 'Ver reportes y estadísticas'),
  ('reports.export', 'reports', 'Exportar reportes', 'Exportar reportes a CSV/PDF'),

  -- Roles permissions (meta)
  ('roles.view', 'roles', 'Ver roles', 'Ver roles de la organización'),
  ('roles.create', 'roles', 'Crear roles', 'Crear roles personalizados'),
  ('roles.edit', 'roles', 'Editar roles', 'Modificar permisos de roles'),
  ('roles.delete', 'roles', 'Eliminar roles', 'Eliminar roles personalizados')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Roles Table (Per organization, customizable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,                 -- 'owner', 'admin', 'member', 'security', 'custom-xxx'
  description TEXT,
  color TEXT DEFAULT '#6B7280',       -- For UI badge color
  is_system BOOLEAN DEFAULT false,    -- System roles can't be deleted
  is_default BOOLEAN DEFAULT false,   -- Default role for new members
  hierarchy_level INT DEFAULT 100,    -- Lower = more powerful (0=owner, 10=admin, 50=security, 100=member)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- ============================================================================
-- STEP 3: Create Role-Permissions Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================================
-- STEP 4: Add owner_id to organizations
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- ============================================================================
-- STEP 5: Add role_id to memberships (keeping 'role' for backward compatibility)
-- ============================================================================

ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- ============================================================================
-- STEP 6: Create function to initialize default roles for an organization
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_roles_for_org(org_id UUID)
RETURNS void AS $$
DECLARE
  owner_role_id UUID;
  admin_role_id UUID;
  member_role_id UUID;
  security_role_id UUID;
  perm RECORD;
BEGIN
  -- Create Owner role
  INSERT INTO roles (organization_id, name, slug, description, color, is_system, hierarchy_level)
  VALUES (org_id, 'Propietario', 'owner', 'Dueño de la organización con acceso total', '#EAB308', true, 0)
  RETURNING id INTO owner_role_id;

  -- Create Admin role
  INSERT INTO roles (organization_id, name, slug, description, color, is_system, hierarchy_level)
  VALUES (org_id, 'Administrador', 'admin', 'Administrador con acceso a gestión', '#3B82F6', true, 10)
  RETURNING id INTO admin_role_id;

  -- Create Security role
  INSERT INTO roles (organization_id, name, slug, description, color, is_system, hierarchy_level)
  VALUES (org_id, 'Seguridad', 'security', 'Personal de seguridad y control de acceso', '#8B5CF6', true, 50)
  RETURNING id INTO security_role_id;

  -- Create Member role (default)
  INSERT INTO roles (organization_id, name, slug, description, color, is_system, is_default, hierarchy_level)
  VALUES (org_id, 'Residente', 'member', 'Miembro regular de la comunidad', '#6B7280', true, true, 100)
  RETURNING id INTO member_role_id;

  -- Assign ALL permissions to Owner
  FOR perm IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm.id);
  END LOOP;

  -- Assign Admin permissions (everything except org.delete, org.transfer, members.roles.owner)
  FOR perm IN
    SELECT id FROM permissions
    WHERE key NOT IN ('org.delete', 'org.transfer', 'members.roles.owner')
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm.id);
  END LOOP;

  -- Assign Security permissions
  FOR perm IN
    SELECT id FROM permissions
    WHERE key IN (
      'org.view',
      'members.view',
      'units.view',
      'invitations.view.all',
      'access.scan',
      'access.manual',
      'access.logs.view',
      'packages.view.all',
      'packages.register',
      'packages.deliver',
      'vehicles.view.all',
      'directory.view',
      'emergency.alert'
    )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (security_role_id, perm.id);
  END LOOP;

  -- Assign Member permissions
  FOR perm IN
    SELECT id FROM permissions
    WHERE key IN (
      'org.view',
      'invitations.view.own',
      'invitations.view.unit',
      'invitations.create',
      'invitations.cancel',
      'announcements.view',
      'amenities.view',
      'amenities.reserve',
      'packages.view.own',
      'maintenance.view.own',
      'maintenance.create',
      'polls.view',
      'polls.vote',
      'documents.view',
      'vehicles.view.own',
      'vehicles.manage.own',
      'directory.view'
    )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (member_role_id, perm.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create function to check permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check if user has the permission through their role
  SELECT EXISTS(
    SELECT 1
    FROM memberships m
    JOIN role_permissions rp ON rp.role_id = m.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE m.user_id = p_user_id
      AND m.organization_id = p_org_id
      AND m.is_active = true
      AND p.key = p_permission_key
  ) INTO v_has_permission;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alias function for checking multiple permissions (ANY)
CREATE OR REPLACE FUNCTION has_any_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_permission_keys TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM memberships m
    JOIN role_permissions rp ON rp.role_id = m.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE m.user_id = p_user_id
      AND m.organization_id = p_org_id
      AND m.is_active = true
      AND p.key = ANY(p_permission_keys)
  ) INTO v_has_permission;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_user_role(
  p_user_id UUID,
  p_org_id UUID
) RETURNS TABLE (
  role_id UUID,
  role_slug TEXT,
  role_name TEXT,
  hierarchy_level INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.slug, r.name, r.hierarchy_level
  FROM memberships m
  JOIN roles r ON r.id = m.role_id
  WHERE m.user_id = p_user_id
    AND m.organization_id = p_org_id
    AND m.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user in an organization
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_org_id UUID
) RETURNS TABLE (
  permission_key TEXT,
  permission_name TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.key, p.name, p.category
  FROM memberships m
  JOIN role_permissions rp ON rp.role_id = m.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE m.user_id = p_user_id
    AND m.organization_id = p_org_id
    AND m.is_active = true
  ORDER BY p.category, p.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Trigger to create default roles when organization is created
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default roles for the new organization
  PERFORM create_default_roles_for_org(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_new_organization();

-- ============================================================================
-- STEP 9: Function to migrate existing memberships to new role system
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_membership_roles()
RETURNS void AS $$
DECLARE
  m RECORD;
  target_role_id UUID;
  role_slug TEXT;
BEGIN
  FOR m IN SELECT * FROM memberships WHERE role_id IS NULL LOOP
    -- Map old role to new role slug
    CASE m.role
      WHEN 'super_admin' THEN role_slug := 'owner';
      WHEN 'admin' THEN role_slug := 'admin';
      WHEN 'guard' THEN role_slug := 'security';
      ELSE role_slug := 'member';
    END CASE;

    -- Find the role_id
    SELECT id INTO target_role_id
    FROM roles
    WHERE organization_id = m.organization_id AND slug = role_slug;

    -- Update membership
    IF target_role_id IS NOT NULL THEN
      UPDATE memberships SET role_id = target_role_id WHERE id = m.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Enable RLS on new tables
-- ============================================================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions are readable by all authenticated users
CREATE POLICY "Permissions are viewable by authenticated users" ON permissions
  FOR SELECT TO authenticated USING (true);

-- Roles are viewable by organization members
CREATE POLICY "Roles are viewable by org members" ON roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Only users with roles.create permission can create roles
CREATE POLICY "Users with permission can create roles" ON roles
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), organization_id, 'roles.create')
  );

-- Only users with roles.edit permission can update roles
CREATE POLICY "Users with permission can update roles" ON roles
  FOR UPDATE USING (
    has_permission(auth.uid(), organization_id, 'roles.edit')
    AND is_system = false  -- System roles cannot be edited
  );

-- Only users with roles.delete permission can delete roles
CREATE POLICY "Users with permission can delete roles" ON roles
  FOR DELETE USING (
    has_permission(auth.uid(), organization_id, 'roles.delete')
    AND is_system = false  -- System roles cannot be deleted
  );

-- Role permissions are viewable by org members
CREATE POLICY "Role permissions viewable by org members" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM roles WHERE organization_id IN (
        SELECT organization_id FROM memberships
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Only users with roles.edit permission can modify role permissions
CREATE POLICY "Users with permission can manage role permissions" ON role_permissions
  FOR ALL USING (
    role_id IN (
      SELECT id FROM roles r WHERE
        has_permission(auth.uid(), r.organization_id, 'roles.edit')
        AND r.is_system = false
    )
  );

-- ============================================================================
-- STEP 11: Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_memberships_role_id ON memberships(role_id);

-- ============================================================================
-- STEP 12: Update triggers
-- ============================================================================

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE permissions IS 'Global permission definitions for the application';
COMMENT ON TABLE roles IS 'Organization-specific roles with customizable permissions';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to their permissions';
COMMENT ON FUNCTION has_permission IS 'Check if a user has a specific permission in an organization';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user in an organization';
COMMENT ON FUNCTION create_default_roles_for_org IS 'Creates the default system roles for a new organization';
