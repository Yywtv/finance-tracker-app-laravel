<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transfer>
 */
class TransferFactory extends Factory
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

            'from_account_id' => Account::factory(),

            'to_account_id' => Account::factory(),

            'amount' => fake()->numberBetween(
                10_000,
                5_000_000
            ),

            'transfer_date' => fake()
                ->dateTimeBetween('-1 year', 'now')
                ->format('Y-m-d'),

            'description' => fake()->optional()->sentence(),
        ];
    }
}
