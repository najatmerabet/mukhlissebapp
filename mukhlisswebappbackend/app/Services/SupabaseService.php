<?php


namespace App\Services;

use Supabase\Storage\StorageClient;

class SupabaseService
{
    protected $storage;

    public function __construct()
    {
        $this->storage = new StorageClient(
            config('supabase.project_url'),
            config('supabase.api_key')
        );
    }

    public function storage()
    {
        return $this->storage;
    }
}








?>