<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Transfer;

class TransferSeeder extends Seeder
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

        Transfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $bca->id,
            'to_account_id' => $cash->id,
            'amount' => 500_000,
            'transfer_date' => '2026-09-05',
            'description' => 'Cash withdrawal',
        ]);

        Transfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $bca->id,
            'to_account_id' => $gopay->id,
            'amount' => 200_000,
            'transfer_date' => '2026-09-10',
            'description' => 'Top up GoPay',
        ]);

        Transfer::factory()->create([
            'user_id' => $user->id,
            'from_account_id' => $cash->id,
            'to_account_id' => $bca->id,
            'amount' => 100_000,
            'transfer_date' => '2026-09-20',
            'description' => 'Cash deposit',
        ]);
    }
}
