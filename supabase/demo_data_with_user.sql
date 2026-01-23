-- ============================================
-- KASETA - Demo Data (Auto-detect user)
-- ============================================

-- Get the existing user ID
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the first (only) user from auth.users
  SELECT id, email INTO v_user_id, v_user_email FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users';
  END IF;

  RAISE NOTICE 'Using user: % (%)', v_user_email, v_user_id;

  -- Insert into users table if not exists
  INSERT INTO users (id, email, full_name, phone, show_in_directory)
  VALUES (v_user_id, v_user_email, COALESCE(split_part(v_user_email, '@', 1), 'Admin'), NULL, true)
  ON CONFLICT (id) DO NOTHING;

  -- Organization
  INSERT INTO organizations (id, name, slug, address, city, state, settings) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Residencial Los Pinos', 'los-pinos', 'Av. Principal #123', 'Monterrey', 'Nuevo León', '{"max_guests_per_invitation": 5}')
  ON CONFLICT (id) DO NOTHING;

  -- Units - Torre A
  INSERT INTO units (id, organization_id, unit_number, building, floor, type, status) VALUES
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
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', '502', 'Torre B', 5, 'apartment', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Make user owner of org (Unit 101 Torre A)
  INSERT INTO organization_members (organization_id, user_id, unit_id, role, status)
  VALUES ('a0000000-0000-0000-0000-000000000001', v_user_id, 'b0000000-0000-0000-0000-000000000001', 'owner', 'active')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner', status = 'active';

  -- Amenities
  INSERT INTO amenities (id, organization_id, name, description, icon, capacity, requires_reservation, available, rules, operating_hours, advance_booking_days, max_duration_hours) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Salón de Eventos', 'Salón con capacidad para 50 personas', 'party-popper', 50, true, true, 'Respetar horario. Dejar limpio.', '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"23:00"},"sat":{"open":"09:00","close":"23:00"},"sun":{"open":"09:00","close":"21:00"}}', 14, 8),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Gimnasio', 'Equipado con cardio y pesas', 'dumbbell', 15, false, true, 'Usar toalla. Limpiar equipo.', '{"mon":{"open":"05:00","close":"23:00"},"tue":{"open":"05:00","close":"23:00"},"wed":{"open":"05:00","close":"23:00"},"thu":{"open":"05:00","close":"23:00"},"fri":{"open":"05:00","close":"23:00"},"sat":{"open":"06:00","close":"22:00"},"sun":{"open":"07:00","close":"20:00"}}', 0, 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Alberca', 'Alberca climatizada', 'waves', 20, false, true, 'Ducharse antes de entrar. No correr.', '{"mon":{"open":"07:00","close":"21:00"},"tue":{"open":"07:00","close":"21:00"},"wed":{"open":"07:00","close":"21:00"},"thu":{"open":"07:00","close":"21:00"},"fri":{"open":"07:00","close":"21:00"},"sat":{"open":"08:00","close":"20:00"},"sun":{"open":"08:00","close":"20:00"}}', 0, 3),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Asador / BBQ', 'Área de asadores con mesas', 'flame', 12, true, true, 'Apagar carbón al terminar.', '{"mon":{"open":"10:00","close":"22:00"},"tue":{"open":"10:00","close":"22:00"},"wed":{"open":"10:00","close":"22:00"},"thu":{"open":"10:00","close":"22:00"},"fri":{"open":"10:00","close":"23:00"},"sat":{"open":"10:00","close":"23:00"},"sun":{"open":"10:00","close":"21:00"}}', 7, 6),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Sala de Juntas', 'Con proyector, 10 personas', 'users', 10, true, true, 'Apagar equipo al salir.', '{"mon":{"open":"08:00","close":"20:00"},"tue":{"open":"08:00","close":"20:00"},"wed":{"open":"08:00","close":"20:00"},"thu":{"open":"08:00","close":"20:00"},"fri":{"open":"08:00","close":"20:00"},"sat":{"open":"09:00","close":"14:00"},"sun":null}', 3, 4),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Juegos Infantiles', 'Para niños de 3 a 12 años', 'baby', 15, false, true, 'Siempre con adulto.', '{"mon":{"open":"08:00","close":"20:00"},"tue":{"open":"08:00","close":"20:00"},"wed":{"open":"08:00","close":"20:00"},"thu":{"open":"08:00","close":"20:00"},"fri":{"open":"08:00","close":"20:00"},"sat":{"open":"08:00","close":"20:00"},"sun":{"open":"08:00","close":"20:00"}}', 0, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Community Contacts
  INSERT INTO community_contacts (organization_id, name, phone, role, is_emergency, display_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Caseta Principal', '8112345678', 'security', false, 1),
  ('a0000000-0000-0000-0000-000000000001', 'Administración', '8112345679', 'admin', false, 2),
  ('a0000000-0000-0000-0000-000000000001', 'Mantenimiento', '8112345680', 'maintenance', false, 3),
  ('a0000000-0000-0000-0000-000000000001', 'Emergencias Médicas', '8112345681', 'emergency', true, 4),
  ('a0000000-0000-0000-0000-000000000001', 'Jefe de Seguridad', '8112345682', 'security', true, 5);

  -- Announcements
  INSERT INTO announcements (organization_id, created_by, title, content, type, is_pinned) VALUES
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Bienvenidos a KASETA', 'Sistema de control de acceso activo. Descarga la app para gestionar tus visitas.', 'info', true),
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Mantenimiento de Alberca', 'La alberca estará cerrada del 25 al 27 de enero por mantenimiento preventivo.', 'warning', false),
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Nuevos Horarios de Gym', 'A partir de febrero, el gimnasio abrirá desde las 5:00 AM.', 'general', false);

  -- Polls
  INSERT INTO polls (id, organization_id, created_by, title, description, status, ends_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', v_user_id, '¿Qué color para el nuevo lobby?', 'Estamos renovando el lobby de Torre A.', 'active', NOW() + INTERVAL '7 days'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', v_user_id, '¿Ampliar horario del gimnasio?', 'Propuesta para extender hasta las 24:00 hrs.', 'active', NOW() + INTERVAL '14 days');

  INSERT INTO poll_options (poll_id, option_text) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Beige claro'),
  ('d0000000-0000-0000-0000-000000000001', 'Gris moderno'),
  ('d0000000-0000-0000-0000-000000000001', 'Blanco clásico'),
  ('d0000000-0000-0000-0000-000000000001', 'Azul marino'),
  ('d0000000-0000-0000-0000-000000000002', 'Sí, excelente idea'),
  ('d0000000-0000-0000-0000-000000000002', 'No, está bien así'),
  ('d0000000-0000-0000-0000-000000000002', 'Me es indiferente');

  -- Documents
  INSERT INTO documents (organization_id, uploaded_by, title, description, category, file_url, file_type) VALUES
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Reglamento Interno 2024', 'Reglamento actualizado', 'regulations', 'https://example.com/reglamento.pdf', 'pdf'),
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Formato de Mudanza', 'Entregar 48hrs antes', 'forms', 'https://example.com/mudanza.pdf', 'pdf'),
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'Contrato Modelo', 'Para arrendatarios', 'contracts', 'https://example.com/contrato.pdf', 'pdf');

  -- Sample Frequent Visitor
  INSERT INTO frequent_visitors (user_id, unit_id, organization_id, name, phone, relationship) VALUES
  (v_user_id, 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'María García', '8181234567', 'family'),
  (v_user_id, 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Juan López', '8187654321', 'friend');

  -- Sample Vehicle
  INSERT INTO vehicles (user_id, unit_id, organization_id, plate, make, model, color, year, type, is_primary) VALUES
  (v_user_id, 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ABC-123-A', 'Honda', 'Civic', 'Blanco', 2022, 'car', true);

  -- Sample Packages
  INSERT INTO packages (organization_id, unit_id, tracking_number, carrier, description, status, received_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'ML123456789MX', 'Mercado Libre', 'Caja mediana', 'received', v_user_id),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'AMZN987654321', 'Amazon', 'Sobre pequeño', 'received', v_user_id);

  -- Sample Lost & Found
  INSERT INTO lost_found_items (organization_id, reported_by, type, title, description, location, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'found', 'Llaves con llavero azul', 'Juego de 3 llaves con llavero de plástico azul', 'Lobby Torre A', 'open'),
  ('a0000000-0000-0000-0000-000000000001', v_user_id, 'lost', 'Audífonos inalámbricos', 'AirPods en estuche blanco', 'Gimnasio', 'open');

  RAISE NOTICE 'Demo data inserted successfully for user %', v_user_email;
END $$;

-- ============================================
-- DONE! Full demo data with your user as owner.
-- ============================================
