<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\TransactionAttachment;
use Illuminate\Database\Seeder;

class TransactionAttachmentSeeder extends Seeder
{
    public function run(): void
    {
        Transaction::query()
            ->each(function (Transaction $transaction) {
                TransactionAttachment::factory()
                    ->count(fake()->numberBetween(0, 3))
                    ->create([
                        'transaction_id' => $transaction->id,
                    ]);
            });
    }
}
