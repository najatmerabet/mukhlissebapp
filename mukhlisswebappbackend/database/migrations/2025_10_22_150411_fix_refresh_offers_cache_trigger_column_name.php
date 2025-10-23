<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Supprimer l'ancien trigger
        DB::unprepared('DROP TRIGGER IF EXISTS trigger_refresh_offers_cache ON magasins');
        
        // Recréer la fonction trigger corrigée avec le bon nom de colonne
        DB::unprepared('
            CREATE OR REPLACE FUNCTION refresh_offers_cache()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Pour DELETE, utiliser OLD.id au lieu de OLD.magasin_id
                IF TG_OP = \'DELETE\' THEN
                    -- Supprimer l\'entrée du cache
                    DELETE FROM offers_cache WHERE magasin_id = OLD.id;
                ELSE
                    -- Pour INSERT/UPDATE, utiliser NEW.id
                    INSERT INTO offers_cache (magasin_id, amounts, points)
                    VALUES (NEW.id, NULL, NULL)
                    ON CONFLICT (magasin_id) 
                    DO UPDATE SET 
                        amounts = NULL,
                        points = NULL,
                        refreshed_at = NOW();
                END IF;
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        ');
        
        // Recréer le trigger
        DB::unprepared('
            CREATE TRIGGER trigger_refresh_offers_cache
            AFTER INSERT OR UPDATE OR DELETE ON magasins
            FOR EACH ROW
            EXECUTE FUNCTION refresh_offers_cache();
        ');
    }

    public function down()
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trigger_refresh_offers_cache ON magasins');
        DB::unprepared('DROP FUNCTION IF EXISTS refresh_offers_cache()');
    }
};