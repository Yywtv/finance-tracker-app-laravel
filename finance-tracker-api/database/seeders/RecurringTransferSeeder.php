<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\RecurringTransfer;

class RecurringTransferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();

        $bca = Account::where('user_id', $user->id)
            ->where('name', 'BCA Savings')
            ->first();

        $cash = Account::where('user_id', $user->id)
            ->where('name', 'Cash')
            ->first();

        $gopay = Account::where('user_id', $user->id)
            ->where('name', 'GoPay')
            ->first();

        RecurringTransfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $bca->id,
            'to_account_id' => $gopay->id,
            'amount' => 200_000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_active' => true,
        ]);

        RecurringTransfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $bca->id,
            'to_account_id' => $cash->id,
            'amount' => 500_000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-05',
            'start_date' => '2026-01-05',
            'end_date' => null,
            'is_active' => true,
        ]);

        RecurringTransfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $gopay->id,
            'to_account_id' => $bca->id,
            'amount' => 100_000,
            'frequency' => 'weekly',
            'next_occurrence' => '2026-09-28',
            'start_date' => '2026-08-01',
            'end_date' => null,
            'is_active' => false,
        ]);
    }
}
