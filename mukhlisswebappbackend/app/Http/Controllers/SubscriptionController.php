<?php

namespace App\Http\Controllers;

use App\Models\MagasinSubscription;
use App\Models\SubscriptionPayment;
use App\Models\AppAccessLog;
use App\Models\Magazin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    /**
     * Liste tous les abonnements avec filtres
     */
    public function index(Request $request)
    {
        $query = MagasinSubscription::with(['magazin', 'creator']);

        // Filtres
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        if ($request->has('magasin_id')) {
            $query->where('magasin_id', $request->magasin_id);
        }

        if ($request->has('expiring_soon') && $request->expiring_soon == 'true') {
            $query->expiringSoon($request->get('days', 7));
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('magasin_name', 'ILIKE', "%{$search}%")
                  ->orWhere('contact_email', 'ILIKE', "%{$search}%")
                  ->orWhere('contact_phone', 'LIKE', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $subscriptions = $query->paginate($perPage);

        return response()->json($subscriptions);
    }

    /**
     * Affiche un abonnement spécifique
     */
    public function show($id)
    {
        $subscription = MagasinSubscription::with([
            'magazin', 
            'creator', 
            'payments' => function($query) {
                $query->orderBy('payment_date', 'desc');
            }
        ])->findOrFail($id);

        // Ajouter les derniers logs d'accès
        $recentLogs = AppAccessLog::forMagasin($subscription->magasin_id)
            ->recent(30)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'subscription' => $subscription,
            'recent_logs' => $recentLogs,
        ]);
    }

    /**
     * Crée un nouvel abonnement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'magasin_id' => 'required|uuid|exists:magasins,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'plan_type' => 'nullable|string|max:50',
            'plan_price' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,bank_transfer',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Récupérer les infos du magasin
        $magazin = Magazin::findOrFail($request->magasin_id);

        $subscription = MagasinSubscription::create([
            'magasin_id' => $request->magasin_id,
            'magasin_name' => $magazin->nom_enseigne,
            'contact_phone' => $request->contact_phone ?? $magazin->telephone,
            'contact_email' => $request->contact_email ?? $magazin->email,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'plan_type' => $request->plan_type,
            'plan_price' => $request->plan_price,
            'payment_method' => $request->payment_method,
            'admin_notes' => $request->admin_notes,
            'is_active' => true,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Abonnement créé avec succès',
            'subscription' => $subscription->load('magazin'),
        ], 201);
    }

    /**
     * Met à jour un abonnement
     */
    public function update(Request $request, $id)
    {
        $subscription = MagasinSubscription::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'plan_type' => 'nullable|string|max:50',
            'plan_price' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,bank_transfer',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'admin_notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription->update($request->only([
            'start_date',
            'end_date',
            'plan_type',
            'plan_price',
            'payment_method',
            'contact_phone',
            'contact_email',
            'admin_notes',
            'is_active',
        ]));

        return response()->json([
            'message' => 'Abonnement mis à jour avec succès',
            'subscription' => $subscription->fresh()->load('magazin'),
        ]);
    }

    /**
     * Supprime un abonnement
     */
    public function destroy($id)
    {
        $subscription = MagasinSubscription::findOrFail($id);
        $subscription->delete();

        return response()->json([
            'message' => 'Abonnement supprimé avec succès',
        ]);
    }

    /**
     * Renouvelle un abonnement
     */
    public function renew(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'months' => 'required|integer|min:1|max:24',
            'payment_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank_transfer',
            'payment_date' => 'required|date',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription = MagasinSubscription::findOrFail($id);
        
        DB::beginTransaction();
        try {
            // Calculer les nouvelles dates
            $months = (int) $request->months; // Cast to int to avoid Carbon error
            $oldEndDate = $subscription->end_date;
            $startDate = max($oldEndDate, now());
            $endDate = $startDate->copy()->addMonths($months);

            // Renouveler l'abonnement
            $subscription->update([
                'end_date' => $endDate,
                'status' => 'active',
                'is_active' => true,
                'last_payment_date' => $request->payment_date,
                'last_payment_amount' => $request->payment_amount,
                'payment_reference' => $request->payment_reference,
                'payment_method' => $request->payment_method,
            ]);

            // Enregistrer le paiement
            SubscriptionPayment::create([
                'magasin_id' => $subscription->magasin_id,
                'subscription_id' => $subscription->id,
                'amount' => $request->payment_amount,
                'payment_method' => $request->payment_method,
                'payment_date' => $request->payment_date,
                'payment_reference' => $request->payment_reference,
                'period_start' => $startDate,
                'period_end' => $endDate,
                'notes' => $request->notes,
                'recorded_by' => null, // TODO: Fix when users table uses UUIDs
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Abonnement renouvelé avec succès',
                'subscription' => $subscription->fresh()->load('magazin'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du renouvellement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suspend un abonnement
     */
    public function suspend(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription = MagasinSubscription::findOrFail($id);
        $subscription->suspend($request->reason);

        return response()->json([
            'message' => 'Abonnement suspendu',
            'subscription' => $subscription->fresh(),
        ]);
    }

    /**
     * Réactive un abonnement
     */
    public function activate($id)
    {
        $subscription = MagasinSubscription::findOrFail($id);
        $subscription->activate();

        return response()->json([
            'message' => 'Abonnement réactivé',
            'subscription' => $subscription->fresh(),
        ]);
    }

    /**
     * Statistiques globales
     */
    public function stats()
    {
        $stats = [
            'total' => MagasinSubscription::count(),
            'active' => MagasinSubscription::active()->count(),
            'expiring_soon' => MagasinSubscription::expiringSoon(7)->count(),
            'expired' => MagasinSubscription::expired()->count(),
            'suspended' => MagasinSubscription::suspended()->count(),
            'monthly_revenue' => SubscriptionPayment::inPeriod(
                now()->startOfMonth(),
                now()->endOfMonth()
            )->sum('amount'),
            'yearly_revenue' => SubscriptionPayment::inPeriod(
                now()->startOfYear(),
                now()->endOfYear()
            )->sum('amount'),
        ];

        // Revenue par mois (12 derniers mois)
        $monthlyRevenue = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthlyRevenue[] = [
                'month' => $month->format('Y-m'),
                'revenue' => SubscriptionPayment::inPeriod(
                    $month->copy()->startOfMonth(),
                    $month->copy()->endOfMonth()
                )->sum('amount'),
            ];
        }
        $stats['monthly_revenue_chart'] = $monthlyRevenue;

        return response()->json($stats);
    }

    /**
     * Liste des abonnements qui expirent bientôt
     */
    public function expiring(Request $request)
    {
        $days = $request->get('days', 7);
        $subscriptions = MagasinSubscription::with('magazin')
            ->expiringSoon($days)
            ->orderBy('end_date', 'asc')
            ->get();

        return response()->json($subscriptions);
    }

    /**
     * Historique des paiements d'un abonnement
     */
    public function payments($id)
    {
        $subscription = MagasinSubscription::findOrFail($id);
        $payments = $subscription->payments()
            ->with('recorder')
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json($payments);
    }

    /**
     * Enregistre un nouveau paiement
     */
    public function storePayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'magasin_id' => 'required|uuid|exists:magasins,id',
            'subscription_id' => 'required|uuid|exists:magasin_subscriptions,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank_transfer',
            'payment_date' => 'required|date',
            'payment_reference' => 'nullable|string|max:100',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payment = SubscriptionPayment::create([
            'magasin_id' => $request->magasin_id,
            'subscription_id' => $request->subscription_id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'payment_date' => $request->payment_date,
            'payment_reference' => $request->payment_reference,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'notes' => $request->notes,
            'recorded_by' => null, // TODO: Fix when users table uses UUIDs
        ]);

        // Mettre à jour l'abonnement
        $subscription = MagasinSubscription::find($request->subscription_id);
        $subscription->update([
            'last_payment_date' => $request->payment_date,
            'last_payment_amount' => $request->amount,
            'payment_reference' => $request->payment_reference,
        ]);

        return response()->json([
            'message' => 'Paiement enregistré avec succès',
            'payment' => $payment->load('recorder'),
        ], 201);
    }

    /**
     * Logs d'accès
     */
    public function accessLogs(Request $request)
    {
        $query = AppAccessLog::with('magazin');

        if ($request->has('magasin_id')) {
            $query->forMagasin($request->magasin_id);
        }

        if ($request->has('event_type')) {
            $query->byEventType($request->event_type);
        }

        if ($request->has('days')) {
            $query->recent($request->days);
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }
}
