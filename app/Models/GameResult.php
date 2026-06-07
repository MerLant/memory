<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'theme',
        'moves',
        'duration_seconds',
        'rating',
    ];

    protected function casts(): array
    {
        return [
            'moves' => 'integer',
            'duration_seconds' => 'integer',
            'rating' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
