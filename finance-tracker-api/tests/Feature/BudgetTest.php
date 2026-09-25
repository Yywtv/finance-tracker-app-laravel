<?php

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create budget', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 3000000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('budgets', [
        'user_id' => $user->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
    ]);
});

test('unauthenticated user cannot create budget', function () {
    $response = $this->postJson('/api/budgets', [
        'category_id' => 1,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response->assertStatus(401);
});

test('user can list their budgets', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    Budget::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/budgets');

    $response
        ->assertStatus(200)
        ->assertJsonCount(1);
});

test('user cannot see another user\'s budgets', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = Category::create([
        'user_id' => $anotherUser->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    Budget::create([
        'user_id' => $anotherUser->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/budgets');

    $response
        ->assertStatus(200)
        ->assertJsonCount(0);
});

test('user can view their budget', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/budgets/{$budget->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $budget->id,
            'amount' => 3000000,
        ]);
});

test('user cannot view another user\'s budget', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = Category::create([
        'user_id' => $anotherUser->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $anotherUser->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/budgets/{$budget->id}");

    $response->assertStatus(404);
});

test('user can update their budget', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/budgets/{$budget->id}", [
            'amount' => 5000000,
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'amount' => 5000000,
    ]);
});

test('user cannot update another user\'s budget', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = Category::create([
        'user_id' => $anotherUser->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $anotherUser->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/budgets/{$budget->id}", [
            'amount' => 5000000,
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'amount' => 3000000,
    ]);
});

test('user can delete their budget', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/budgets/{$budget->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('budgets', [
        'id' => $budget->id,
    ]);
});

test('user cannot delete another user\'s budget', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = Category::create([
        'user_id' => $anotherUser->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $budget = Budget::create([
        'user_id' => $anotherUser->id,
        'category_id' => $category->id,
        'amount' => 3000000,
        'period' => 'monthly',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-30',
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/budgets/{$budget->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
    ]);
});

test('amount validation works', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 0,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('date and period validation works', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 3000000,
            'period' => 'invalid',
            'start_date' => '2026-09-01',
            'end_date' => '2026-08-01',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'period',
            'end_date',
        ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 3000000,
            'period' => 'monthly',
            'start_date' => 'not-a-date',
            'end_date' => '2026-09-30',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'start_date',
        ]);
});

test('category ownership is validated', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = Category::create([
        'user_id' => $anotherUser->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 3000000,
            'period' => 'monthly',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category_id']);
});
