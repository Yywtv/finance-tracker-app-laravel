<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\AccountSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\TransactionSeeder;
use Database\Seeders\TransferSeeder;
use Database\Seeders\BudgetSeeder;
use Database\Seeders\RecurringTransferSeeder;
use Database\Seeders\TransactionAttachmentSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            AccountSeeder::class,
            CategorySeeder::class,
            TransactionSeeder::class,
            TransferSeeder::class,
            BudgetSeeder::class,
            RecurringTransferSeeder::class,
            TransactionAttachmentSeeder::class,
        ]);
    }
}
