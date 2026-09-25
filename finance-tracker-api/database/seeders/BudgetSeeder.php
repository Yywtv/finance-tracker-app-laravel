<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Budget;

class BudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();

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

        Budget::factory()->create([
            'user_id' => $user->id,
            'category_id' => $food->id,
            'amount' => 2_000_000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

        Budget::factory()->create([
            'user_id' => $user->id,
            'category_id' => $shopping->id,
            'amount' => 3_000_000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

        Budget::factory()->create([
            'user_id' => $user->id,
            'category_id' => $transportation->id,
            'amount' => 1_000_000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

        Budget::factory()->create([
            'user_id' => $user->id,
            'category_id' => $bills->id,
            'amount' => 1_500_000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);
    }
}
