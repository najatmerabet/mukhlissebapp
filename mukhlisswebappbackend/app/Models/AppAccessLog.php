<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AppAccessLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'app_access_logs';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'magasin_id',
        'event_type',
        'user_id',
        'user_email',
        'device_info',
        'app_version',
        'denial_reason',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Relation avec le magasin
    public function magazin()
    {
        return $this->belongsTo(Magazin::class, 'magasin_id');
    }

    // Scopes
    public function scopeForMagasin($query, $magasinId)
    {
        return $query->where('magasin_id', $magasinId);
    }

    public function scopeByEventType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    public function scopeAccessDenied($query)
    {
        return $query->where('event_type', 'access_denied');
    }

    public function scopeAccessGranted($query)
    {
        return $query->where('event_type', 'access_granted');
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
