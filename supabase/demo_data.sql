-- ============================================
-- KASETA - Demo Data
-- Run after creating your first user via the app
-- ============================================

-- ============================================
-- 1. ORGANIZATION
-- ============================================
INSERT INTO organizations (id, name, slug, address, city, state, settings) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Residencial Los Pinos',
  'los-pinos',
  'Av. Principal #123',
  'Monterrey',
  'Nuevo León',
  '{"max_guests_per_invitation": 5, "require_vehicle_info": false}'
);

-- ============================================
-- 2. UNITS (20 apartments in 2 buildings)
-- ============================================
INSERT INTO units (id, organization_id, unit_number, building, floor, type, status) VALUES
-- Torre A
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '101', 'Torre A', 1, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '102', 'Torre A', 1, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '201', 'Torre A', 2, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '202', 'Torre A', 2, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '301', 'Torre A', 3, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '302', 'Torre A', 3, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '401', 'Torre A', 4, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '402', 'Torre A', 4, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '501', 'Torre A', 5, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', '502', 'Torre A', 5, 'apartment', 'vacant'),
-- Torre B
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '101', 'Torre B', 1, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', '102', 'Torre B', 1, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', '201', 'Torre B', 2, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', '202', 'Torre B', 2, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', '301', 'Torre B', 3, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', '302', 'Torre B', 3, 'apartment', 'vacant'),
('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', '401', 'Torre B', 4, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', '402', 'Torre B', 4, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', '501', 'Torre B', 5, 'apartment', 'active'),
('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', '502', 'Torre B', 5, 'apartment', 'active');

-- ============================================
-- 3. AMENITIES
-- ============================================
INSERT INTO amenities (id, organization_id, name, description, icon, capacity, requires_reservation, available, rules, operating_hours, advance_booking_days, max_duration_hours) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Salón de Eventos',
  'Salón con capacidad para 50 personas, ideal para fiestas y reuniones',
  'party-popper',
  50,
  true,
  true,
  'Respetar horario de cierre. Dejar el espacio limpio. No se permiten mascotas.',
  '{"mon": {"open": "09:00", "close": "22:00"}, "tue": {"open": "09:00", "close": "22:00"}, "wed": {"open": "09:00", "close": "22:00"}, "thu": {"open": "09:00", "close": "22:00"}, "fri": {"open": "09:00", "close": "23:00"}, "sat": {"open": "09:00", "close": "23:00"}, "sun": {"open": "09:00", "close": "21:00"}}',
  14,
  8
),
(
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Gimnasio',
  'Gimnasio equipado con máquinas cardiovasculares y de peso',
  'dumbbell',
  15,
  false,
  true,
  'Usar toalla personal. Limpiar equipo después de usar. Ropa deportiva obligatoria.',
  '{"mon": {"open": "05:00", "close": "23:00"}, "tue": {"open": "05:00", "close": "23:00"}, "wed": {"open": "05:00", "close": "23:00"}, "thu": {"open": "05:00", "close": "23:00"}, "fri": {"open": "05:00", "close": "23:00"}, "sat": {"open": "06:00", "close": "22:00"}, "sun": {"open": "07:00", "close": "20:00"}}',
  0,
  2
),
(
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Alberca',
  'Alberca climatizada con carril para natación',
  'waves',
  20,
  false,
  true,
  'Ducharse antes de entrar. No correr. Niños menores de 12 años acompañados de adulto.',
  '{"mon": {"open": "07:00", "close": "21:00"}, "tue": {"open": "07:00", "close": "21:00"}, "wed": {"open": "07:00", "close": "21:00"}, "thu": {"open": "07:00", "close": "21:00"}, "fri": {"open": "07:00", "close": "21:00"}, "sat": {"open": "08:00", "close": "20:00"}, "sun": {"open": "08:00", "close": "20:00"}}',
  0,
  3
),
(
  'c0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Asador / BBQ',
  'Área de asadores con mesas y bancas',
  'flame',
  12,
  true,
  true,
  'Apagar completamente el carbón al terminar. No dejar basura.',
  '{"mon": {"open": "10:00", "close": "22:00"}, "tue": {"open": "10:00", "close": "22:00"}, "wed": {"open": "10:00", "close": "22:00"}, "thu": {"open": "10:00", "close": "22:00"}, "fri": {"open": "10:00", "close": "23:00"}, "sat": {"open": "10:00", "close": "23:00"}, "sun": {"open": "10:00", "close": "21:00"}}',
  7,
  6
),
(
  'c0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Sala de Juntas',
  'Sala con proyector y capacidad para 10 personas',
  'users',
  10,
  true,
  true,
  'Dejar ordenado. Apagar equipo electrónico al salir.',
  '{"mon": {"open": "08:00", "close": "20:00"}, "tue": {"open": "08:00", "close": "20:00"}, "wed": {"open": "08:00", "close": "20:00"}, "thu": {"open": "08:00", "close": "20:00"}, "fri": {"open": "08:00", "close": "20:00"}, "sat": {"open": "09:00", "close": "14:00"}, "sun": null}',
  3,
  4
),
(
  'c0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'Área de Juegos Infantiles',
  'Juegos para niños de 3 a 12 años',
  'baby',
  15,
  false,
  true,
  'Niños siempre acompañados de adulto. No apto para mayores de 12 años.',
  '{"mon": {"open": "08:00", "close": "20:00"}, "tue": {"open": "08:00", "close": "20:00"}, "wed": {"open": "08:00", "close": "20:00"}, "thu": {"open": "08:00", "close": "20:00"}, "fri": {"open": "08:00", "close": "20:00"}, "sat": {"open": "08:00", "close": "20:00"}, "sun": {"open": "08:00", "close": "20:00"}}',
  0,
  0
);

-- ============================================
-- 4. COMMUNITY CONTACTS (Emergency & Admin)
-- ============================================
INSERT INTO community_contacts (organization_id, name, phone, role, is_emergency, is_active, display_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Caseta Principal', '8112345678', 'security', false, true, 1),
('a0000000-0000-0000-0000-000000000001', 'Administración', '8112345679', 'admin', false, true, 2),
('a0000000-0000-0000-0000-000000000001', 'Mantenimiento', '8112345680', 'maintenance', false, true, 3),
('a0000000-0000-0000-0000-000000000001', 'Emergencias Médicas', '8112345681', 'emergency', true, true, 4),
('a0000000-0000-0000-0000-000000000001', 'Jefe de Seguridad', '8112345682', 'security', true, true, 5);

-- ============================================
-- 5. SAMPLE POLLS (will need created_by updated)
-- ============================================
-- Note: These will fail if no user exists. Run AFTER creating admin user.
-- Replace 'YOUR_USER_ID' with actual admin user UUID

/*
INSERT INTO polls (id, organization_id, created_by, title, description, status, ends_at) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID',
  '¿Qué color prefieres para el nuevo lobby?',
  'Estamos renovando el lobby de la Torre A. Tu opinión nos importa.',
  'active',
  NOW() + INTERVAL '7 days'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID',
  '¿Ampliar horario del gimnasio?',
  'Propuesta para extender el horario del gimnasio hasta las 24:00 hrs.',
  'active',
  NOW() + INTERVAL '14 days'
);

INSERT INTO poll_options (poll_id, option_text) VALUES
('d0000000-0000-0000-0000-000000000001', 'Beige claro'),
('d0000000-0000-0000-0000-000000000001', 'Gris moderno'),
('d0000000-0000-0000-0000-000000000001', 'Blanco clásico'),
('d0000000-0000-0000-0000-000000000001', 'Azul marino'),
('d0000000-0000-0000-0000-000000000002', 'Sí, excelente idea'),
('d0000000-0000-0000-0000-000000000002', 'No, el horario actual está bien'),
('d0000000-0000-0000-0000-000000000002', 'Indiferente');
*/

-- ============================================
-- 6. SAMPLE DOCUMENTS (will need uploaded_by updated)
-- ============================================
-- Note: Run AFTER creating admin user. Replace 'YOUR_USER_ID'.

/*
INSERT INTO documents (organization_id, uploaded_by, title, description, category, file_url, file_type) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID',
  'Reglamento Interno 2024',
  'Reglamento actualizado de la comunidad',
  'regulations',
  'https://example.com/docs/reglamento.pdf',
  'pdf'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID',
  'Formato de Mudanza',
  'Llenar y entregar 48 horas antes de la mudanza',
  'forms',
  'https://example.com/docs/mudanza.pdf',
  'pdf'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID',
  'Contrato de Arrendamiento Modelo',
  'Formato estándar para arrendatarios',
  'contracts',
  'https://example.com/docs/contrato.pdf',
  'pdf'
);
*/

-- ============================================
-- HELPER: After user registration, run this to make them admin
-- Replace the UUIDs with actual values
-- ============================================

/*
-- 1. Get your user ID from auth.users:
SELECT id, email FROM auth.users;

-- 2. Insert into users table (if not auto-created):
INSERT INTO users (id, email, full_name, phone)
VALUES ('YOUR_AUTH_USER_ID', 'your@email.com', 'Tu Nombre', '8181234567');

-- 3. Make yourself owner of the organization:
INSERT INTO organization_members (organization_id, user_id, unit_id, role, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_AUTH_USER_ID',
  'b0000000-0000-0000-0000-000000000001', -- Unit 101 Torre A
  'owner',
  'active'
);

-- 4. Now you can uncomment and run the polls/documents inserts above
--    using your user ID
*/

-- ============================================
-- DONE! Base demo data inserted.
-- ============================================
