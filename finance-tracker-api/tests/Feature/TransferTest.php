<?php

use App\Models\Account;
use App\Models\User;
use App\Models\Transfer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create transfer', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'transfer_date' => '2026-09-13',
            'description' => 'Move money to cash',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('transfers', [
        'user_id' => $user->id,
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
    ]);
});

test('unauthenticated user cannot create transfer', function () {
    $response = $this->postJson('/api/transfers', [
        'from_account_id' => 1,
        'to_account_id' => 2,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Test transfer',
    ]);

    $response->assertStatus(401);
});

test('user can list their transfers', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $user->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Move money',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers');

    $response
        ->assertStatus(200)
        ->assertJsonPath('total', 1)
        ->assertJsonFragment([
            'description' => 'Move money',
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

test('transfers are paginated', function () {
    $user = User::factory()->create();

    Transfer::factory()
        ->count(25)
        ->create([
            'user_id' => $user->id,
        ]);

    // Page 1
    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers');

    $response->assertOk();

    $response->assertJsonPath('current_page', 1);
    $response->assertJsonPath('per_page', 20);
    $response->assertJsonPath('total', 25);

    expect($response->json('data'))->toHaveCount(20);

    // Page 2
    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers?page=2');

    $response->assertOk();

    $response->assertJsonPath('current_page', 2);

    expect($response->json('data'))->toHaveCount(5);
});

test('user can filter transfers by from account', function () {
    $user = User::factory()->create();

    $account1 = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $account2 = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $account3 = $user->accounts()->create([
        'name' => 'GoPay',
        'type' => 'e_wallet',
        'currency' => 'IDR',
        'initial_balance' => 500000,
        'is_active' => true,
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $account1->id,
        'to_account_id' => $account2->id,
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $account3->id,
        'to_account_id' => $account2->id,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transfers?from_account_id={$account1->id}");

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(1);
    expect($transfers[0]['from_account_id'])->toBe($account1->id);
});

test('user can filter transfers by to account', function () {
    $user = User::factory()->create();

    $account1 = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $account2 = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $account3 = $user->accounts()->create([
        'name' => 'GoPay',
        'type' => 'e_wallet',
        'currency' => 'IDR',
        'initial_balance' => 500000,
        'is_active' => true,
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $account1->id,
        'to_account_id' => $account2->id,
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $account1->id,
        'to_account_id' => $account3->id,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transfers?to_account_id={$account2->id}");

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(1);
    expect($transfers[0]['to_account_id'])->toBe($account2->id);
});

test('user can filter transfers from a date', function () {
    $user = User::factory()->create();

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-01',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers?from=2026-09-15');

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(2);

    expect(collect($transfers)->pluck('transfer_date')->sort()->values()->all())
        ->toBe([
            '2026-09-15',
            '2026-09-30',
        ]);
});

test('user can filter transfers to a date', function () {
    $user = User::factory()->create();

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-01',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers?to=2026-09-15');

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(2);

    expect(collect($transfers)->pluck('transfer_date')->sort()->values()->all())
        ->toBe([
            '2026-09-01',
            '2026-09-15',
        ]);
});

test('user can filter transfers by date range', function () {
    $user = User::factory()->create();

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-01',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'transfer_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers?from=2026-09-10&to=2026-09-20');

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(1);
    expect($transfers[0]['transfer_date'])->toBe('2026-09-15');
});

test('user can combine transfer filters', function () {
    $user = User::factory()->create();

    $bca = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $cash = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $gopay = $user->accounts()->create([
        'name' => 'GoPay',
        'type' => 'e_wallet',
        'currency' => 'IDR',
        'initial_balance' => 500000,
        'is_active' => true,
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $bca->id,
        'to_account_id' => $cash->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $bca->id,
        'to_account_id' => $gopay->id,
        'amount' => 200000,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $gopay->id,
        'to_account_id' => $cash->id,
        'amount' => 100000,
        'transfer_date' => '2026-09-15',
    ]);

    Transfer::factory()->create([
        'user_id' => $user->id,
        'from_account_id' => $bca->id,
        'to_account_id' => $cash->id,
        'amount' => 300000,
        'transfer_date' => '2026-08-15',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson(
            "/api/transfers?from_account_id={$bca->id}&to_account_id={$cash->id}&from=2026-09-01&to=2026-09-30"
        );

    $response->assertOk();

    $transfers = $response->json('data');

    expect($transfers)->toHaveCount(1);
    expect($transfers[0]['from_account_id'])->toBe($bca->id);
    expect($transfers[0]['to_account_id'])->toBe($cash->id);
    expect($transfers[0]['amount'])->toBe(500000);
    expect($transfers[0]['transfer_date'])->toBe('2026-09-15');
});

test('user cannot see another user\'s transfers', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $anotherUser->accounts()->create([
        'name' => 'Another BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $anotherUser->accounts()->create([
        'name' => 'Another Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $anotherUser->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Another User Transfer',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transfers');

    $response
        ->assertStatus(200)
        ->assertJsonMissing([
            'description' => 'Another User Transfer',
        ]);
});

test('user can view their transfer', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $user->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Move money',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transfers/{$transfer->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $transfer->id,
            'description' => 'Move money',
        ]);
});

test('user cannot view another user\'s transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $anotherUser->accounts()->create([
        'name' => 'Another BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $anotherUser->accounts()->create([
        'name' => 'Another Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $anotherUser->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Another User Transfer',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transfers/{$transfer->id}");

    $response->assertStatus(404);
});

test('user can update their transfer', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $user->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Original transfer',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/transfers/{$transfer->id}", [
            'amount' => 750000,
            'description' => 'Updated transfer',
        ]);

    $response
        ->assertStatus(200)
        ->assertJson([
            'amount' => 750000,
            'description' => 'Updated transfer',
        ]);

    $this->assertDatabaseHas('transfers', [
        'id' => $transfer->id,
        'amount' => 750000,
        'description' => 'Updated transfer',
    ]);
});

test('user cannot update another user\'s transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $anotherUser->accounts()->create([
        'name' => 'Another BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $anotherUser->accounts()->create([
        'name' => 'Another Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $anotherUser->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Original transfer',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/transfers/{$transfer->id}", [
            'amount' => 999999,
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('transfers', [
        'id' => $transfer->id,
        'amount' => 500000,
    ]);
});

test('user can delete their transfer', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $user->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Move money',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/transfers/{$transfer->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'message' => 'Transfer deleted',
        ]);

    $this->assertDatabaseMissing('transfers', [
        'id' => $transfer->id,
    ]);
});

test('user cannot delete another user\'s transfer', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $anotherUser->accounts()->create([
        'name' => 'Another BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $anotherUser->accounts()->create([
        'name' => 'Another Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $transfer = $anotherUser->transfers()->create([
        'from_account_id' => $fromAccount->id,
        'to_account_id' => $toAccount->id,
        'amount' => 500000,
        'transfer_date' => '2026-09-13',
        'description' => 'Another User Transfer',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/transfers/{$transfer->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('transfers', [
        'id' => $transfer->id,
    ]);
});

test('source account must belong to user', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'My Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'transfer_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'from_account_id',
        ]);
});

test('destination account must belong to user', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'My BCA',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'transfer_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'to_account_id',
        ]);
});

test('source and destination accounts cannot be the same', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $account->id,
            'to_account_id' => $account->id,
            'amount' => 500000,
            'transfer_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'to_account_id',
        ]);
});

test('amount must be valid', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 0,
            'transfer_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'amount',
        ]);
});

test('transfer affects balances correctly', function () {
    $user = User::factory()->create();

    $fromAccount = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $toAccount = $user->accounts()->create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transfers', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 500000,
            'transfer_date' => '2026-09-13',
            'description' => 'Move money to cash',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('accounts', [
        'id' => $fromAccount->id,
        'initial_balance' => 5000000,
    ]);

    $this->assertDatabaseHas('accounts', [
        'id' => $toAccount->id,
        'initial_balance' => 1000000,
    ]);
});
