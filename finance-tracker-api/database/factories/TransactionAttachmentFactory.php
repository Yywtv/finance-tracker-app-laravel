<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\TransactionAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionAttachmentFactory extends Factory
{
    protected $model = TransactionAttachment::class;

    public function definition(): array
    {
        return [
            'transaction_id' => null,
            'file_path' => 'transactions/' . fake()->uuid() . '.pdf',
            'original_filename' => fake()->word() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => fake()->numberBetween(10_000, 5_000_000),
        ];
    }
}
