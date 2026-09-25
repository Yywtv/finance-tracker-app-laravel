<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Transaction;

class TransactionAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
