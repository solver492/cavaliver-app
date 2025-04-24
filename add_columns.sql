-- Ajouter les nouvelles colonnes à la table prestation
ALTER TABLE prestation ADD COLUMN transporteur_id INTEGER;
ALTER TABLE prestation ADD COLUMN vehicule_id INTEGER;

-- Créer les clés étrangères
-- Commenter ces lignes si elles posent problème
-- ALTER TABLE prestation ADD CONSTRAINT fk_prestation_transporteur FOREIGN KEY (transporteur_id) REFERENCES transporteur(id);
-- ALTER TABLE prestation ADD CONSTRAINT fk_prestation_vehicule FOREIGN KEY (vehicule_id) REFERENCES vehicule(id);
