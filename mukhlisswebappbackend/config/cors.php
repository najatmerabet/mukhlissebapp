<?php
return [
    'paths' => [
        'api/*',
        'storage/*',
        'sanctum/csrf-cookie',
        'login',
        'register'
    ],

    'allowed_methods' => ['*'],

    // Spécifiez explicitement votre URL frontend
    'allowed_origins' => [
        'http://localhost:4200', // Pour le développement Angular
        'https://votre-domaine.com' // Pour la production
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Activez ceci si vous utilisez les cookies/sessions
    'supports_credentials' => true,
];

?>