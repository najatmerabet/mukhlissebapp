<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SubscriptionPayment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'subscription_payments';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'magasin_id',
        'subscription_id',
        'amount',
        'payment_method',
        'payment_date',
        'payment_reference',
        'period_start',
        'period_end',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'recorded_at' => 'datetime',
    ];

    // Relation avec le magasin
    public function magazin()
    {
        return $this->belongsTo(Magazin::class, 'magasin_id');
    }

    // Relation avec l'abonnement
    public function subscription()
    {
        return $this->belongsTo(MagasinSubscription::class, 'subscription_id');
    }

    // Relation avec l'utilisateur qui a enregistré
    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // Scopes
    public function scopeForMagasin($query, $magasinId)
    {
        return $query->where('magasin_id', $magasinId);
    }

    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    // Accessors
    public function getCoverageMonthsAttribute()
    {
        return $this->period_start->diffInMonths($this->period_end);
    }
}
