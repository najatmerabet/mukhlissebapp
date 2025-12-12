<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MagazinController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClientsController;
use App\Http\Controllers\SubscriptionController;


Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/magazinadd', [MagazinController::class, 'storemagazin']);

// ===== MONITORING & HEALTH CHECKS (Public - Pas d'auth) =====
// Route de test Sentry (à supprimer en production)
Route::get('/sentry-test', function () {
    throw new \Exception('Sentry Test - Monitoring fonctionne! 🎉');
});

// Test Sentry avec capture manuelle
Route::get('/sentry-test-manual', function () {
    try {
        \Sentry\captureMessage('Test manuel Sentry - Ça marche! 🎉');
        \Sentry\captureException(new \Exception('Exception de test manuel'));
        
        return response()->json([
            'status' => 'Erreur envoyée à Sentry',
            'message' => 'Vérifiez votre dashboard Sentry!',
            'dsn' => substr(config('sentry.dsn'), 0, 30) . '...',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
        ], 500);
    }
});

// Debug Sentry - Vérifier config
Route::get('/sentry-debug', function () {
    return response()->json([
        'sentry_dsn' => config('sentry.dsn') ? 'Configuré ✅' : 'Pas configuré ❌',
        'sentry_enabled' => app()->bound('sentry') ? 'Oui ✅' : 'Non ❌',
        'environment' => config('app.env'),
    ]);
});

// Health check (pour monitoring uptime)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'services' => [
            'database' => \DB::connection()->getPdo() ? 'ok' : 'error',
            'cache' => 'ok', // TODO: vérifier cache
        ],
    ]);
});

// ===== APP UPDATE CHECK (Public) =====
// Route pour vérifier si une mise à jour de l'app mobile est disponible
Route::get('/app/check-update', function (Illuminate\Http\Request $request) {
    // Version actuelle envoyée par l'app
    $currentVersion = $request->header('X-App-Version', '0.0.0');
    
    // Version disponible (à mettre en .env ou DB plus tard)
    $latestVersion = '1.0.0';
    $downloadUrl = env('APP_DOWNLOAD_URL', 'https://mukhliss.com/downloads/mukhliss-merchant-latest.apk');
    
    // Comparer les versions
    if (version_compare($currentVersion, $latestVersion, '<')) {
        return response()->json([
            'update_available' => true,
            'latest_version' => $latestVersion,
            'download_url' => $downloadUrl,
            'mandatory' => false,  // true pour forcer la mise à jour
            'changelog' => 'Améliorations du scanner QR et corrections de bugs',
            'size_mb' => 18,
        ]);
    }
    
    return response()->json([
        'update_available' => false,
        'current_version' => $currentVersion,
    ]);
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Auth & Users
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/users', [AuthController::class, 'getallusers']);
    
    // Magasins
    Route::get('/magazinget', [MagazinController::class, 'getallmagazin']);
    Route::get('/magazin/{id}', [MagazinController::class, 'getmagasinbyid']);
    Route::post('/magazinupdate/{id}', [MagazinController::class, 'updatemagazin']);
    Route::delete('magazindelete/{id}', [MagazinController::class, 'delete']);
    
    // Categories
    Route::get('/categoryget', [CategoryController::class, 'index']);
    Route::post('/categoryadd', [CategoryController::class, 'store']);
    Route::get('/category/{id}', [CategoryController::class, 'show']);
    Route::post('/categoryupdate/{id}', [CategoryController::class, 'update']);
    Route::delete('/categorydelete/{id}', [CategoryController::class, 'destroy']);
    
    // Clients
    Route::get('/allclients', [ClientsController::class, 'index']);
    
    // ===== SUBSCRIPTIONS (Abonnements) =====
    // Liste et CRUD
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/{id}', [SubscriptionController::class, 'show']);
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::put('/subscriptions/{id}', [SubscriptionController::class, 'update']);
    Route::delete('/subscriptions/{id}', [SubscriptionController::class, 'destroy']);
    
    // Actions spéciales
    Route::post('/subscriptions/{id}/renew', [SubscriptionController::class, 'renew']);
    Route::post('/subscriptions/{id}/suspend', [SubscriptionController::class, 'suspend']);
    Route::post('/subscriptions/{id}/activate', [SubscriptionController::class, 'activate']);
    
    // Paiements
    Route::get('/subscriptions/{id}/payments', [SubscriptionController::class, 'payments']);
    Route::post('/subscription-payments', [SubscriptionController::class, 'storePayment']);
    
    // Statistiques et rapports
    Route::get('/subscriptions-stats', [SubscriptionController::class, 'stats']);
    Route::get('/subscriptions-expiring', [SubscriptionController::class, 'expiring']);
    
    // Logs d'accès mobile
    Route::get('/access-logs', [SubscriptionController::class, 'accessLogs']);
});
?>
