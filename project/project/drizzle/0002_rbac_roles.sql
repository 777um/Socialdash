-- Migration 0002: Expandir enum de roles para RBAC completo
-- Adiciona: viewer, analyst, editor, manager  (admin já existia)
-- 'user' (legado) é mantido temporariamente; normalizado em runtime via normalizeRole()
-- Após migrar todos os registros legados pode-se rodar um UPDATE e remover 'user' do enum.

ALTER TABLE `users`
  MODIFY COLUMN `role`
    ENUM('user','viewer','analyst','editor','manager','admin')
    NOT NULL DEFAULT 'viewer';

-- Converter registros legados com role='user' para 'viewer'
UPDATE `users` SET `role` = 'viewer' WHERE `role` = 'user';

-- Agora remover 'user' do enum (requer segundo ALTER após o UPDATE)
ALTER TABLE `users`
  MODIFY COLUMN `role`
    ENUM('viewer','analyst','editor','manager','admin')
    NOT NULL DEFAULT 'viewer';
