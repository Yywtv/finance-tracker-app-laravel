<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),

            'name' => fake()->word(),

            'type' => fake()->randomElement([
                'income',
                'expense',
            ]),

            'icon' => fake()->randomElement([
                'food',
                'shopping',
                'transport',
                'home',
                'health',
                'education',
                'entertainment',
                'salary',
                'other',
            ]),

            'color' => fake()->hexColor(),

            'is_active' => fake()->boolean(),
        ];
    }
}
