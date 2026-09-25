<?php

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('unauthenticated user cannot access dashboard', function () {
    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(401);
});

test('authenticated user can access dashboard', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard');

    $response
        ->assertStatus(200)
        ->assertJsonStructure([
            'total_balance',
            'income_this_month',
            'expenses_this_month',
            'recent_transactions',
        ]);
});

test('dashboard calculates the total balance correctly', function () {
    $user = User::factory()->create();

    Account::factory()->create([
        'user_id' => $user->id,
        'initial_balance' => 1_000_000,
    ]);

    Account::factory()->create([
        'user_id' => $user->id,
        'initial_balance' => 500_000,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'income',
        'amount' => 300_000,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'expense',
        'amount' => 200_000,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard');

    $response
        ->assertStatus(200)
        ->assertJson([
            'total_balance' => 1_600_000,
        ]);
});

test('dashboard calculates this months income and expenses', function () {
    $user = User::factory()->create();

    Carbon::setTestNow(Carbon::create(2026, 9, 15));

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'income',
        'amount' => 500_000,
        'transaction_date' => Carbon::create(2026, 9, 5),
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'expense',
        'amount' => 150_000,
        'transaction_date' => Carbon::create(2026, 9, 10),
    ]);

    // Should NOT be included because it is from August.
    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'income',
        'amount' => 1_000_000,
        'transaction_date' => Carbon::create(2026, 8, 20),
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard');

    $response
        ->assertStatus(200)
        ->assertJson([
            'income_this_month' => 500_000,
            'expenses_this_month' => 150_000,
        ]);

    Carbon::setTestNow();
});

test('dashboard only uses the authenticated users transactions', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'income',
        'amount' => 100_000,
    ]);

    Transaction::factory()->create([
        'user_id' => $otherUser->id,
        'type' => 'income',
        'amount' => 999_999,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard');

    $response
        ->assertStatus(200)
        ->assertJson([
            'total_balance' => 100_000,
        ]);
});

test('dashboard returns at most five recent transactions', function () {
    $user = User::factory()->create();

    Transaction::factory()
        ->count(7)
        ->create([
            'user_id' => $user->id,
        ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard');

    $response->assertStatus(200);

    expect($response->json('recent_transactions'))->toHaveCount(5);
});
