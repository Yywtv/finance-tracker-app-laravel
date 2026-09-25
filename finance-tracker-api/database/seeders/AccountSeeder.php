<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();

        Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'BCA Savings',
        ]);

        Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Cash',
        ]);

        Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'GoPay',
        ]);
    }
}
