<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Transfer;
use App\Models\RecurringTransfer;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'currency',
        'initial_balance',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->hasMany(Transaction::class);
    }

    public function outgoingTransfers()
    {
        return $this->hasMany(Transfer::class, 'from_account_id');
    }

    public function incomingTransfers()
    {
        return $this->hasMany(Transfer::class, 'to_account_id');
    }

    public function outgoingRecurringTransfers()
    {
        return $this->hasMany(
            RecurringTransfer::class,
            'from_account_id'
        );
    }

    public function incomingRecurringTransfers()
    {
        return $this->hasMany(
            RecurringTransfer::class,
            'to_account_id'
        );
    }
}
