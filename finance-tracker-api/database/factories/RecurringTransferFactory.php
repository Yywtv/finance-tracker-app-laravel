<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\RecurringTransfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecurringTransfer>
 */
class RecurringTransferFactory extends Factory
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

            'from_account_id' => Account::factory(),

            'to_account_id' => Account::factory(),

            'amount' => fake()->numberBetween(
                10_000,
                5_000_000
            ),

            'frequency' => fake()->randomElement([
                'daily',
                'weekly',
                'monthly',
                'yearly',
            ]),

            'next_occurrence' => fake()
                ->dateTimeBetween('now', '+6 months')
                ->format('Y-m-d'),

            'start_date' => $startDate->format('Y-m-d'),

            'end_date' => fake()->dateTimeBetween(
                $startDate,
                '+1 year'
            )->format('Y-m-d'),

            'is_active' => fake()->boolean(),
        ];
    }
}
