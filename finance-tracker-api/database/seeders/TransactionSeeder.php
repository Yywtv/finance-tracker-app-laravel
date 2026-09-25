<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
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

        $salary = Category::where('user_id', $user->id)
            ->where('name', 'Salary')
            ->first();

        $food = Category::where('user_id', $user->id)
            ->where('name', 'Food')
            ->first();

        $shopping = Category::where('user_id', $user->id)
            ->where('name', 'Shopping')
            ->first();

        $transportation = Category::where('user_id', $user->id)
            ->where('name', 'Transportation')
            ->first();

        $bills = Category::where('user_id', $user->id)
            ->where('name', 'Bills')
            ->first();

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $bca->id,
            'category_id' => $salary->id,
            'type' => 'income',
            'amount' => 10_000_000,
            'description' => 'Monthly Salary',
            'transaction_date' => '2026-09-01',
            'notes' => 'September salary',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $bca->id,
            'category_id' => $food->id,
            'type' => 'expense',
            'amount' => 75_000,
            'description' => 'Lunch',
            'transaction_date' => '2026-09-05',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $gopay->id,
            'category_id' => $transportation->id,
            'type' => 'expense',
            'amount' => 50_000,
            'description' => 'GoRide',
            'transaction_date' => '2026-09-06',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $bca->id,
            'category_id' => $shopping->id,
            'type' => 'expense',
            'amount' => 350_000,
            'description' => 'Online Shopping',
            'transaction_date' => '2026-09-10',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $bca->id,
            'category_id' => $bills->id,
            'type' => 'expense',
            'amount' => 250_000,
            'description' => 'Internet Bill',
            'transaction_date' => '2026-09-15',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $cash->id,
            'category_id' => $food->id,
            'type' => 'expense',
            'amount' => 40_000,
            'description' => 'Coffee',
            'transaction_date' => '2026-09-18',
        ]);
    }
}
