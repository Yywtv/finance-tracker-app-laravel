<?php

namespace Database\Factories;

use App\Models\Budget;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-6 months', 'now');

        return [
            'user_id' => User::factory(),

            'category_id' => Category::factory(),

            'amount' => fake()->numberBetween(
                100_000,
                10_000_000
            ),

            'period' => fake()->randomElement([
                'weekly',
                'monthly',
                'yearly',
            ]),

            'start_date' => $startDate->format('Y-m-d'),

            'end_date' => fake()
                ->dateTimeBetween($startDate, '+6 months')
                ->format('Y-m-d'),
        ];
    }
}
