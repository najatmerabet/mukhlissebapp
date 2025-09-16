<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Magazin extends Model 
{
    protected $table = 'magasins';
    use HasFactory;
    
    protected $fillable = [
        'id',
        'nom_enseigne',
        'siret',
        'adresse',
        'ville',
        'code_postal',
        'telephone',
        'description',
        'geom',
        'Categorieid',
        'email',
        'logoUrl',
        'created_at'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = Str::uuid()->toString();
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'Categorieid', 'id');
    }
}