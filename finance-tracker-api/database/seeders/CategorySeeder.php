<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Salary',
            'type' => 'income',
            'icon' => 'salary',
            'color' => '#22C55E',
        ]);

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Food',
            'type' => 'expense',
            'icon' => 'food',
            'color' => '#F97316',
        ]);

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Shopping',
            'type' => 'expense',
            'icon' => 'shopping',
            'color' => '#8B5CF6',
        ]);

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Transportation',
            'type' => 'expense',
            'icon' => 'transport',
            'color' => '#3B82F6',
        ]);

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Bills',
            'type' => 'expense',
            'icon' => 'home',
            'color' => '#EF4444',
        ]);

        Category::factory()->create([
            'user_id' => $user->id,
            'name' => 'Health',
            'type' => 'expense',
            'icon' => 'health',
            'color' => '#EC4899',
        ]);
    }
}
