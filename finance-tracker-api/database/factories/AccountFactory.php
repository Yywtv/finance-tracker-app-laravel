<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
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
                'checking',
                'savings',
                'cash',
                'e_wallet',
                'credit_card',
                'investment',
                'other',
            ]),
            'currency' => fake()->randomElement([
                'IDR',
                'USD',
                'EUR',
                'GBP',
                'JPY',
                'SGD',
                'AUD',
            ]),
            'initial_balance' => fake()->numberBetween(100000, 1000000),
            'is_active' => fake()->boolean(),
        ];
    }
}
