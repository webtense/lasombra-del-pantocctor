INSERT INTO public.admin_audit_config (id, read_key_hash)
VALUES (1, '4c2c47a05bd3243b5b7026ffd508b5f7ccd7c64c49b73988216d1b4a842a2951')
ON CONFLICT (id) DO UPDATE SET read_key_hash = EXCLUDED.read_key_hash;
