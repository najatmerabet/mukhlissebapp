<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Http;

class SupabaseServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton('supabase', function ($app) {
            return new class {
                private $url;
                private $key;
                
                public function __construct() {
                    $this->url = config('services.supabase.url');
                    $this->key = config('services.supabase.key');
                    
                    if (!$this->url || !$this->key) {
                        throw new \Exception('Supabase URL and key must be configured');
                    }
                }
                
                public function table($table) {
                    return new class($this->url, $this->key, $table) {
                        private $url;
                        private $key;
                        private $table;
                        
                        public function __construct($url, $key, $table) {
                            $this->url = $url;
                            $this->key = $key;
                            $this->table = $table;
                        }
                        
                        public function insert($data) {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . $this->key,
                                'Content-Type' => 'application/json',
                                'Prefer' => 'return=representation'
                            ])->post($this->url . '/rest/v1/' . $this->table, $data);
                        }
                        
                        public function select($columns = '*') {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . $this->key,
                            ])->get($this->url . '/rest/v1/' . $this->table . '?select=' . $columns);
                        }
                        
                        public function updateUser($data, $conditions = '') {
                            $url = $this->url . '/rest/v1/' . $this->table;
                            if ($conditions) {
                                $url .= '?' . $conditions;
                            }
                            
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . $this->key,
                                'Content-Type' => 'application/json',
                                'Prefer' => 'return=representation'
                            ])->patch($url, $data);
                        }
                        
                        public function delete($conditions = '') {
                            $url = $this->url . '/rest/v1/' . $this->table;
                            if ($conditions) {
                                $url .= '?' . $conditions;
                            }
                            
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . $this->key,
                            ])->delete($url);
                        }
                    };
                }
                
                public function auth() {
                    return new class($this->url, $this->key) {
                        private $url;
                        private $key;
                        
                        public function __construct($url, $key) {
                            $this->url = $url;
                            $this->key = $key;
                        }

                        public function createUser(array $userData) {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE_KEY'),
                                'Content-Type' => 'application/json',
                                'Prefer' => 'return=representation'
                            ])->post($this->url . '/auth/v1/admin/users', [
                                'email' => $userData['email'],
                                'password' => $userData['password'],
                                'user_metadata' => $userData['user_metadata'] ?? [],
                                'email_confirm' => true
                            ]);
                        }

                        public function updateUser($userId, array $userData) {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE_KEY'),
                                'Content-Type' => 'application/json',
                            ])->put($this->url . '/auth/v1/admin/users/' . $userId, $userData);
                        }
                        
                        public function signUp($email, $password, $data = []) {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Content-Type' => 'application/json',
                            ])->post($this->url . '/auth/v1/signup', [
                                'email' => $email,
                                'password' => $password,
                                'data' => $data
                            ]);
                        }
                        
                        public function signIn($email, $password) {
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Content-Type' => 'application/json',
                            ])->post($this->url . '/auth/v1/token?grant_type=password', [
                                'email' => $email,
                                'password' => $password
                            ]);
                        }
                    };
                }

                public function storage() {
                    return new class($this->url, $this->key) {
                        private $url;
                        private $key;
                        
                        public function __construct($url, $key) {
                            $this->url = rtrim($url, '/');
                            $this->key = $key;
                        }
                        
                        public function uploadLogo($bucket, $file, $path = '') {
                            // Validate inputs
                            if (!is_object($file)) {
                                throw new \InvalidArgumentException('Le paramètre $file doit être un objet fichier');
                            }

                            if (!method_exists($file, 'getClientOriginalExtension')) {
                                throw new \InvalidArgumentException('L\'objet fichier ne supporte pas getClientOriginalExtension()');
                            }

                            // Generate unique filename
                            $extension = $file->getClientOriginalExtension();
                            $fileName = 'logo_'.uniqid().'_'.time().'.'.$extension;
                            
                            // Get file content
                            $fileContent = file_get_contents($file->getRealPath());
                            if ($fileContent === false) {
                                throw new \Exception('Impossible de lire le contenu du fichier');
                            }
                            
                            // Build full path
                            $fullPath = $path ? "{$path}/{$fileName}" : $fileName;
                            
                            // Upload URL
                            $uploadUrl = "{$this->url}/storage/v1/object/{$bucket}/{$fullPath}";
                            
                            // Headers
                            $headers = [
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer '.$this->key,
                                'Content-Type' => $file->getMimeType() ?? 'application/octet-stream',
                                'x-upsert' => 'true'
                            ];

                            // Upload file using body content instead of multipart
                            $response = Http::withHeaders($headers)
                                ->withBody($fileContent, $headers['Content-Type'])
                                ->post($uploadUrl);

                            if ($response->successful()) {
                                $publicUrl = "{$this->url}/storage/v1/object/public/{$bucket}/{$fullPath}";
                                \Log::debug('File uploaded successfully', [
                                    'filename' => $fileName,
                                    'path' => $fullPath,
                                    'url' => $publicUrl
                                ]);
                                return $publicUrl;
                            }
                            
                            \Log::error('Supabase upload failed', [
                                'status' => $response->status(),
                                'body' => $response->body(),
                                'headers' => $response->headers()
                            ]);
                            
                            throw new \Exception('Upload failed: '.$response->body());
                        }
                        
                        public function deleteFile($bucket, $path) {
                            $deleteUrl = "{$this->url}/storage/v1/object/{$bucket}/{$path}";
                            
                            return Http::withHeaders([
                                'apikey' => $this->key,
                                'Authorization' => 'Bearer '.$this->key,
                            ])->delete($deleteUrl);
                        }
                    };
                }
            };
        });
    }

    public function boot()
    {
        //
    }
}

?>