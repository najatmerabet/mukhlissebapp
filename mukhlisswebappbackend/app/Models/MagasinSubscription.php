<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MagasinSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'magasin_subscriptions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'magasin_id',
        'magasin_name',
        'contact_phone',
        'contact_email',
        'is_active',
        'status',
        'start_date',
        'end_date',
        'payment_method',
        'last_payment_date',
        'last_payment_amount',
        'payment_reference',
        'admin_notes',
        'suspension_reason',
        'plan_type',
        'plan_price',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'last_payment_date' => 'date',
        'last_payment_amount' => 'decimal:2',
        'plan_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relation avec Magazin
    public function magazin()
    {
        return $this->belongsTo(Magazin::class, 'magasin_id');
    }

    // Relation avec les paiements
    public function payments()
    {
        return $this->hasMany(SubscriptionPayment::class, 'subscription_id');
    }

    // Relation avec le créateur
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes pour filtrer facilement
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('status', 'active')
                     ->where('end_date', '>=', now());
    }

    public function scopeExpiringSoon($query, $days = 7)
    {
        $days = (int) $days; // Cast to int to avoid Carbon error
        return $query->where('is_active', true)
                     ->whereBetween('end_date', [now(), now()->addDays($days)]);
    }

    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', now());
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    // Accessors
    public function getDaysRemainingAttribute()
    {
        return now()->diffInDays($this->end_date, false);
    }

    public function getIsExpiredAttribute()
    {
        return $this->end_date < now();
    }

    public function getIsExpiringSoonAttribute()
    {
        return $this->days_remaining <= 7 && $this->days_remaining >= 0;
    }

    // Helper methods
    public function renew($months = 1, $paymentData = [])
    {
        $newEndDate = max($this->end_date, now())->addMonths($months);
        
        $this->update([
            'end_date' => $newEndDate,
            'status' => 'active',
            'is_active' => true,
            'last_payment_date' => $paymentData['payment_date'] ?? now(),
            'last_payment_amount' => $paymentData['amount'] ?? null,
            'payment_reference' => $paymentData['reference'] ?? null,
        ]);

        return $this;
    }

    public function suspend($reason = null)
    {
        $this->update([
            'status' => 'suspended',
            'is_active' => false,
            'suspension_reason' => $reason,
        ]);

        return $this;
    }

    public function activate()
    {
        $this->update([
            'status' => 'active',
            'is_active' => true,
            'suspension_reason' => null,
        ]);

        return $this;
    }
}
