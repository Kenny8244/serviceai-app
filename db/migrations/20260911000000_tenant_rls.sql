-- SCRUM-29: Tenant-safe data access (RLS on CORE_TABLES).
-- Defense in depth: Worker keeps service_role filters; these policies apply to
-- authenticated/anon clients (service_role continues to bypass RLS).
--
-- Apply in Supabase SQL Editor after the MVP schema is present.
-- Idempotent: helpers REPLACE; policies DROP IF EXISTS then CREATE.

-- ── Helpers (SECURITY DEFINER to avoid RLS recursion) ─────────────────────────

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_workspace_roles uwr
    WHERE uwr.workspace_id = p_workspace_id
      AND uwr.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.user_workspace_roles uwr ON uwr.workspace_id = w.workspace_id
    WHERE w.tenant_id = p_tenant_id
      AND uwr.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.object_in_member_workspace(p_object_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.objects o
    WHERE o.object_id = p_object_id
      AND public.is_workspace_member(o.workspace_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.object_type_in_member_workspace(p_object_type_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.object_types ot
    JOIN public.schemas s ON s.schema_id = ot.schema_id
    WHERE ot.object_type_id = p_object_type_id
      AND public.is_workspace_member(s.workspace_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.object_in_member_workspace(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.object_type_in_member_workspace(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.object_in_member_workspace(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.object_type_in_member_workspace(uuid) TO authenticated, anon, service_role;

-- Status helper for db:check (SCRUM-29)
CREATE OR REPLACE FUNCTION public.check_core_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.tablename::text AS table_name,
    t.rowsecurity AS rls_enabled,
    COALESCE((
      SELECT COUNT(*)::integer
      FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = t.tablename
    ), 0) AS policy_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename = ANY (ARRAY[
      'tenants',
      'workspaces',
      'schemas',
      'object_types',
      'object_type_attributes',
      'objects',
      'profiles',
      'user_workspace_roles',
      'object_relations',
      'stock_transactions',
      'service_requests',
      'attachments',
      'audit_logs'
    ])
  ORDER BY t.tablename;
$$;

REVOKE ALL ON FUNCTION public.check_core_rls_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_core_rls_status() TO authenticated, anon, service_role;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_type_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ── user_workspace_roles ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS uwr_select_own ON public.user_workspace_roles;
DROP POLICY IF EXISTS uwr_insert_own ON public.user_workspace_roles;
DROP POLICY IF EXISTS uwr_update_own ON public.user_workspace_roles;
DROP POLICY IF EXISTS uwr_delete_own ON public.user_workspace_roles;

CREATE POLICY uwr_select_own ON public.user_workspace_roles
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY uwr_insert_own ON public.user_workspace_roles
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY uwr_update_own ON public.user_workspace_roles
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY uwr_delete_own ON public.user_workspace_roles
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- ── tenants ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenants_select_member ON public.tenants;
DROP POLICY IF EXISTS tenants_update_member ON public.tenants;

CREATE POLICY tenants_select_member ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY tenants_update_member ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- ── workspaces ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS workspaces_select_member ON public.workspaces;
DROP POLICY IF EXISTS workspaces_update_member ON public.workspaces;
DROP POLICY IF EXISTS workspaces_insert_member ON public.workspaces;

CREATE POLICY workspaces_select_member ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY workspaces_update_member ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Inserts for new workspaces under a tenant the user already belongs to
CREATE POLICY workspaces_insert_member ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

-- ── schemas ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS schemas_select_member ON public.schemas;
DROP POLICY IF EXISTS schemas_insert_member ON public.schemas;
DROP POLICY IF EXISTS schemas_update_member ON public.schemas;
DROP POLICY IF EXISTS schemas_delete_member ON public.schemas;

CREATE POLICY schemas_select_member ON public.schemas
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY schemas_insert_member ON public.schemas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY schemas_update_member ON public.schemas
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY schemas_delete_member ON public.schemas
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ── object_types ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS object_types_select_member ON public.object_types;
DROP POLICY IF EXISTS object_types_insert_member ON public.object_types;
DROP POLICY IF EXISTS object_types_update_member ON public.object_types;
DROP POLICY IF EXISTS object_types_delete_member ON public.object_types;

CREATE POLICY object_types_select_member ON public.object_types
  FOR SELECT TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id));

CREATE POLICY object_types_insert_member ON public.object_types
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schemas s
      WHERE s.schema_id = object_types.schema_id
        AND public.is_workspace_member(s.workspace_id)
    )
  );

CREATE POLICY object_types_update_member ON public.object_types
  FOR UPDATE TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id))
  WITH CHECK (public.object_type_in_member_workspace(object_type_id));

CREATE POLICY object_types_delete_member ON public.object_types
  FOR DELETE TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id));

-- ── object_type_attributes ────────────────────────────────────────────────────

DROP POLICY IF EXISTS ota_select_member ON public.object_type_attributes;
DROP POLICY IF EXISTS ota_insert_member ON public.object_type_attributes;
DROP POLICY IF EXISTS ota_update_member ON public.object_type_attributes;
DROP POLICY IF EXISTS ota_delete_member ON public.object_type_attributes;

CREATE POLICY ota_select_member ON public.object_type_attributes
  FOR SELECT TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id));

CREATE POLICY ota_insert_member ON public.object_type_attributes
  FOR INSERT TO authenticated
  WITH CHECK (public.object_type_in_member_workspace(object_type_id));

CREATE POLICY ota_update_member ON public.object_type_attributes
  FOR UPDATE TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id))
  WITH CHECK (public.object_type_in_member_workspace(object_type_id));

CREATE POLICY ota_delete_member ON public.object_type_attributes
  FOR DELETE TO authenticated
  USING (public.object_type_in_member_workspace(object_type_id));

-- ── objects ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS objects_select_member ON public.objects;
DROP POLICY IF EXISTS objects_insert_member ON public.objects;
DROP POLICY IF EXISTS objects_update_member ON public.objects;
DROP POLICY IF EXISTS objects_delete_member ON public.objects;

CREATE POLICY objects_select_member ON public.objects
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY objects_insert_member ON public.objects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY objects_update_member ON public.objects
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY objects_delete_member ON public.objects
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ── object_relations ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS object_relations_select_member ON public.object_relations;
DROP POLICY IF EXISTS object_relations_insert_member ON public.object_relations;
DROP POLICY IF EXISTS object_relations_update_member ON public.object_relations;
DROP POLICY IF EXISTS object_relations_delete_member ON public.object_relations;

CREATE POLICY object_relations_select_member ON public.object_relations
  FOR SELECT TO authenticated
  USING (
    public.object_in_member_workspace(from_object_id)
    AND public.object_in_member_workspace(to_object_id)
  );

CREATE POLICY object_relations_insert_member ON public.object_relations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.object_in_member_workspace(from_object_id)
    AND public.object_in_member_workspace(to_object_id)
  );

CREATE POLICY object_relations_update_member ON public.object_relations
  FOR UPDATE TO authenticated
  USING (
    public.object_in_member_workspace(from_object_id)
    AND public.object_in_member_workspace(to_object_id)
  )
  WITH CHECK (
    public.object_in_member_workspace(from_object_id)
    AND public.object_in_member_workspace(to_object_id)
  );

CREATE POLICY object_relations_delete_member ON public.object_relations
  FOR DELETE TO authenticated
  USING (
    public.object_in_member_workspace(from_object_id)
    AND public.object_in_member_workspace(to_object_id)
  );

-- ── stock_transactions ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS stock_tx_select_member ON public.stock_transactions;
DROP POLICY IF EXISTS stock_tx_insert_member ON public.stock_transactions;
DROP POLICY IF EXISTS stock_tx_update_member ON public.stock_transactions;
DROP POLICY IF EXISTS stock_tx_delete_member ON public.stock_transactions;

CREATE POLICY stock_tx_select_member ON public.stock_transactions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY stock_tx_insert_member ON public.stock_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY stock_tx_update_member ON public.stock_transactions
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY stock_tx_delete_member ON public.stock_transactions
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ── service_requests ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS service_requests_select_member ON public.service_requests;
DROP POLICY IF EXISTS service_requests_insert_member ON public.service_requests;
DROP POLICY IF EXISTS service_requests_update_member ON public.service_requests;
DROP POLICY IF EXISTS service_requests_delete_member ON public.service_requests;

CREATE POLICY service_requests_select_member ON public.service_requests
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY service_requests_insert_member ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY service_requests_update_member ON public.service_requests
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY service_requests_delete_member ON public.service_requests
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ── attachments ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS attachments_select_member ON public.attachments;
DROP POLICY IF EXISTS attachments_insert_member ON public.attachments;
DROP POLICY IF EXISTS attachments_update_member ON public.attachments;
DROP POLICY IF EXISTS attachments_delete_member ON public.attachments;

CREATE POLICY attachments_select_member ON public.attachments
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY attachments_insert_member ON public.attachments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY attachments_update_member ON public.attachments
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY attachments_delete_member ON public.attachments
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ── audit_logs ────────────────────────────────────────────────────────────────
-- Schema varies by migration history: workspace_id, profile_id, user_id, or entity-only.
-- Trigger inserts use log_object_changes() (SECURITY DEFINER) below.

DROP POLICY IF EXISTS audit_logs_select_member ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_member ON public.audit_logs;

DO $$
DECLARE
  has_workspace_id boolean;
  has_profile_id boolean;
  has_user_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'workspace_id'
  ) INTO has_workspace_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'profile_id'
  ) INTO has_profile_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_id'
  ) INTO has_user_id;

  IF has_workspace_id THEN
    EXECUTE $policy$
      CREATE POLICY audit_logs_select_member ON public.audit_logs
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))
    $policy$;
    EXECUTE $policy$
      CREATE POLICY audit_logs_insert_member ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))
    $policy$;
  ELSIF has_profile_id THEN
    EXECUTE $policy$
      CREATE POLICY audit_logs_select_member ON public.audit_logs
        FOR SELECT TO authenticated
        USING (
          profile_id = auth.uid()
          OR (
            entity_type IN ('objects', 'object')
            AND public.object_in_member_workspace(entity_id)
          )
        )
    $policy$;
    EXECUTE $policy$
      CREATE POLICY audit_logs_insert_member ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (profile_id IS NULL OR profile_id = auth.uid())
    $policy$;
  ELSIF has_user_id THEN
    EXECUTE $policy$
      CREATE POLICY audit_logs_select_member ON public.audit_logs
        FOR SELECT TO authenticated
        USING (
          user_id = auth.uid()
          OR (
            entity_type IN ('objects', 'object')
            AND public.object_in_member_workspace(entity_id)
          )
        )
    $policy$;
    EXECUTE $policy$
      CREATE POLICY audit_logs_insert_member ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (user_id IS NULL OR user_id = auth.uid())
    $policy$;
  ELSE
    -- MVP schema: log_id, action, entity_type, entity_id, old_values, new_values, created_at
    EXECUTE $policy$
      CREATE POLICY audit_logs_select_member ON public.audit_logs
        FOR SELECT TO authenticated
        USING (
          entity_type IN ('objects', 'object')
          AND public.object_in_member_workspace(entity_id)
        )
    $policy$;
    EXECUTE $policy$
      CREATE POLICY audit_logs_insert_member ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (
          entity_type IN ('objects', 'object')
          AND public.object_in_member_workspace(entity_id)
        )
    $policy$;
  END IF;
END $$;

-- Make object audit trigger SECURITY DEFINER so inserts succeed under RLS
CREATE OR REPLACE FUNCTION public.log_object_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, new_values)
    VALUES ('CREATE', TG_TABLE_NAME, NEW.object_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, old_values, new_values)
    VALUES ('UPDATE', TG_TABLE_NAME, NEW.object_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, old_values)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.object_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
