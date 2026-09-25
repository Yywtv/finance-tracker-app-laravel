<?php

use App\Models\Account;
use App\Models\RecurringTransfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create recurring transfer', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('recurring_transfers', [
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'is_active' => true,
    ]);
});

test('unauthenticated user cannot create recurring transfer', function () {
    $response = $this->postJson('/api/recurring-transfers', [
        'from_account_id' => 1,
        'to_account_id' => 2,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response->assertStatus(401);
});

test('user can list their recurring transfers', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    RecurringTransfer::create([
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/recurring-transfers');

    $response
        ->assertStatus(200)
        ->assertJsonCount(1);
});

test('user cannot see another user\'s recurring transfers', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    RecurringTransfer::create([
        'user_id' => $anotherUser->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/recurring-transfers');

    $response
        ->assertStatus(200)
        ->assertJsonCount(0);
});

test('user can view their recurring transfer', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/recurring-transfers/{$recurringTransfer->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $recurringTransfer->id,
            'amount' => 500000,
        ]);
});

test('user cannot view another user\'s recurring transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $anotherUser->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/recurring-transfers/{$recurringTransfer->id}");

    $response->assertStatus(404);
});

test('user can update their recurring transfer', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/recurring-transfers/{$recurringTransfer->id}", [
            'amount' => 750000,
            'is_active' => false,
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('recurring_transfers', [
        'id' => $recurringTransfer->id,
        'amount' => 750000,
        'is_active' => false,
    ]);
});

test('user cannot update another user\'s recurring transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $anotherUser->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/recurring-transfers/{$recurringTransfer->id}", [
            'amount' => 750000,
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('recurring_transfers', [
        'id' => $recurringTransfer->id,
        'amount' => 500000,
    ]);
});

test('user can delete their recurring transfer', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/recurring-transfers/{$recurringTransfer->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('recurring_transfers', [
        'id' => $recurringTransfer->id,
    ]);
});

test('user cannot delete another user\'s recurring transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $recurringTransfer = RecurringTransfer::create([
        'user_id' => $anotherUser->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'frequency' => 'monthly',
        'next_occurrence' => '2026-10-01',
        'start_date' => '2026-09-01',
        'end_date' => '2027-09-01',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/recurring-transfers/{$recurringTransfer->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('recurring_transfers', [
        'id' => $recurringTransfer->id,
    ]);
});

test('source account belongs to user', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $foreignAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Foreign Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $foreignAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['from_account_id']);
});

test('destination account belongs to user', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $foreignAccount = Account::create([
        'user_id' => $anotherUser->id,
        'name' => 'Foreign Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $foreignAccount->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['to_account_id']);
});

test('source and destination accounts cannot be the same', function () {
    $user = User::factory()->create();

    $account = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $account->id,
            'to_account_id' => $account->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['to_account_id']);
});

test('amount is valid', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 0,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('frequency is valid', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'frequency' => 'invalid',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['frequency']);
});

test('start and end dates are valid', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2026-08-01',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['end_date']);
});

test('active and inactive state works', function () {
    $user = User::factory()->create();

    $fromAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = Account::create([
        'user_id' => $user->id,
        'name' => 'Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/recurring-transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'frequency' => 'monthly',
            'next_occurrence' => '2026-10-01',
            'start_date' => '2026-09-01',
            'end_date' => '2027-09-01',
            'is_active' => false,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('recurring_transfers', [
        'user_id' => $user->id,
        'is_active' => false,
    ]);
});
