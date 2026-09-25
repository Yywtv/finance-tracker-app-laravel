<?php

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create transaction', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 75000,
            'description' => 'Lunch',
            'transaction_date' => '2026-09-13',
            'notes' => 'Lunch with friends',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('transactions', [
        'user_id' => $user->id,
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 75000,
        'type' => 'expense',
    ]);
});

test('unauthenticated user cannot create transaction', function () {
    $response = $this->postJson('/api/transactions', [
        'account_id' => 1,
        'category_id' => 1,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-13',
    ]);

    $response->assertStatus(401);
});

test('user can list their transactions', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $user->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions');

    $response
        ->assertStatus(200)
        ->assertJsonPath('total', 1)
        ->assertJsonFragment([
            'description' => 'Lunch',
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

test('transactions are paginated', function () {
    $user = User::factory()->create();

    Transaction::factory()
        ->count(25)
        ->create([
            'user_id' => $user->id,
        ]);

    // Page 1
    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions');

    $response->assertOk();

    $response->assertJsonPath('current_page', 1);
    $response->assertJsonPath('per_page', 20);
    $response->assertJsonPath('total', 25);

    expect($response->json('data'))->toHaveCount(20);

    // Page 2
    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions?page=2');

    $response->assertOk();

    $response->assertJsonPath('current_page', 2);

    expect($response->json('data'))->toHaveCount(5);
});

test('user can filter transactions by account', function () {
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

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account1->id,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account2->id,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transactions?account_id={$account1->id}");

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(1);
    expect($transactions[0]['account_id'])->toBe($account1->id);
});

test('user can filter transactions by category', function () {
    $user = User::factory()->create();

    $category1 = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $category2 = $user->categories()->create([
        'name' => 'Transport',
        'type' => 'expense',
        'is_active' => true,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category1->id,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category2->id,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transactions?category_id={$category1->id}");

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(1);
    expect($transactions[0]['category_id'])->toBe($category1->id);
});

test('user can filter transactions from a date', function () {
    $user = User::factory()->create();

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-01',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions?from=2026-09-15');

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(2);
    expect(collect($transactions)->pluck('transaction_date')->sort()->values()->all())
        ->toBe([
            '2026-09-15',
            '2026-09-30',
        ]);
});

test('user can filter transactions to a date', function () {
    $user = User::factory()->create();

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-01',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions?to=2026-09-15');

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(2);
    expect(collect($transactions)->pluck('transaction_date')->sort()->values()->all())
        ->toBe([
            '2026-09-01',
            '2026-09-15',
        ]);
});

test('user can filter transactions by date range', function () {
    $user = User::factory()->create();

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-01',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'transaction_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions?from=2026-09-10&to=2026-09-20');

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(1);
    expect($transactions[0]['transaction_date'])->toBe('2026-09-15');
});

test('user can combine transaction filters', function () {
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

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account1->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account1->id,
        'category_id' => $category->id,
        'type' => 'income',
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account2->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'transaction_date' => '2026-09-15',
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'account_id' => $account1->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'transaction_date' => '2026-08-15',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson(
            "/api/transactions?type=expense&account_id={$account1->id}&category_id={$category->id}&from=2026-09-01&to=2026-09-30"
        );

    $response->assertOk();

    $transactions = $response->json('data');

    expect($transactions)->toHaveCount(1);
    expect($transactions[0]['type'])->toBe('expense');
    expect($transactions[0]['account_id'])->toBe($account1->id);
    expect($transactions[0]['category_id'])->toBe($category->id);
    expect($transactions[0]['transaction_date'])->toBe('2026-09-15');
});

test('user cannot see another user\'s transactions', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $anotherUser->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => 'food',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $anotherUser->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Another User Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/transactions');

    $response
        ->assertStatus(200)
        ->assertJsonMissing([
            'description' => 'Another User Lunch',
        ]);
});

test('user can view their transaction', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $user->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transactions/{$transaction->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $transaction->id,
            'description' => 'Lunch',
        ]);
});

test('user cannot view another user\'s transaction', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $anotherUser->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $anotherUser->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Another User Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/transactions/{$transaction->id}");

    $response->assertStatus(404);
});

test('user can update their transaction', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $user->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/transactions/{$transaction->id}", [
            'amount' => 100000,
            'description' => 'Updated Lunch',
        ]);

    $response
        ->assertStatus(200)
        ->assertJson([
            'amount' => 100000,
            'description' => 'Updated Lunch',
        ]);

    $this->assertDatabaseHas('transactions', [
        'id' => $transaction->id,
        'amount' => 100000,
        'description' => 'Updated Lunch',
    ]);
});

test('user cannot update another user\'s transaction', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $anotherUser->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $anotherUser->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Original Transaction',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/transactions/{$transaction->id}", [
            'amount' => 999999,
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('transactions', [
        'id' => $transaction->id,
        'amount' => 75000,
    ]);
});

test('user can delete their transaction', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $user->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/transactions/{$transaction->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'message' => 'Transaction deleted',
        ]);

    $this->assertDatabaseMissing('transactions', [
        'id' => $transaction->id,
    ]);
});

test('user cannot delete another user\'s transaction', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $anotherUser->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $transaction = $anotherUser->transactions()->create([
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 75000,
        'description' => 'Another User Transaction',
        'transaction_date' => '2026-09-13',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/transactions/{$transaction->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('transactions', [
        'id' => $transaction->id,
    ]);
});

test('required transaction fields are validated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', []);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'account_id',
            'category_id',
            'type',
            'amount',
            'description',
            'transaction_date',
        ]);
});

test('amount validation works', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 0,
            'description' => 'Invalid amount',
            'transaction_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'amount',
        ]);
});

test('account ownership is validated', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 75000,
            'description' => 'Invalid account',
            'transaction_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'account_id',
        ]);
});

test('category ownership is validated', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $anotherUser->categories()->create([
        'name' => 'Another User Category',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 75000,
            'description' => 'Invalid category',
            'transaction_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'category_id',
        ]);
});

test('invalid transaction type is rejected', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $category = $user->categories()->create([
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'invalid',
            'amount' => 75000,
            'description' => 'Invalid type',
            'transaction_date' => '2026-09-13',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'type',
        ]);
});
