<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Supprimer l'ancien trigger
        DB::unprepared('DROP TRIGGER IF EXISTS trigger_refresh_offers_cache ON magasins');
        
        // Recréer la fonction trigger corrigée
        DB::unprepared('
            CREATE OR REPLACE FUNCTION refresh_offers_cache()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Pour DELETE, utiliser OLD au lieu de NEW
                IF TG_OP = \'DELETE\' THEN
                    -- Supprimer l\'entrée du cache au lieu de la mettre à NULL
                    DELETE FROM offers_cache WHERE magasin_id = OLD.magasin_id;
                ELSE
                    -- Pour INSERT/UPDATE, utiliser NEW
                    INSERT INTO offers_cache (magasin_id, amounts, points)
                    VALUES (NEW.magasin_id, NULL, NULL)
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
        // Restaurer l'ancien comportement si nécessaire
        DB::unprepared('DROP TRIGGER IF EXISTS trigger_refresh_offers_cache ON magasins');
        DB::unprepared('DROP FUNCTION IF EXISTS refresh_offers_cache()');
    }
};