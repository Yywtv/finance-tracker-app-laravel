<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can create an account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'IDR',
            'initial_balance' => 5000000,
            'is_active' => true,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('accounts', [
        'user_id' => $user->id,
        'name' => 'BCA Savings',
    ]);
});

test('user cannot access another user\'s account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'IDR',
            'initial_balance' => 5000000,
            'is_active' => true,
        ]);

    $response->assertStatus(201);

    $accountId = $response->json('id');

    $anotherUser = User::factory()->create();

    $response = $this
        ->actingAs($anotherUser, 'sanctum')
        ->getJson("/api/accounts/{$accountId}");

    $response->assertStatus(404);
});

test('unauthenticated user cannot create account', function () {
    $response = $this->postJson('/api/accounts', [
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response->assertStatus(401);
});

test('unauthenticated user cannot view accounts', function () {
    $response = $this->getJson('/api/accounts');

    $response->assertStatus(401);
});

test('user can list their own accounts', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'IDR',
            'initial_balance' => 5000000,
            'is_active' => true,
        ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/accounts');

    $response
        ->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'name' => 'BCA Savings',
        ]);
});

test('user cannot see another user\'s accounts', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/accounts');

    $response
        ->assertStatus(200)
        ->assertJsonMissing([
            'name' => 'Another User Account',
        ]);
});

test('user can view their own account', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/accounts/{$account->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $account->id,
            'name' => 'BCA Savings',
        ]);
});

test('user can update their own account', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/accounts/{$account->id}", [
            'name' => 'BCA Main Savings',
        ]);

    $response
        ->assertStatus(200)
        ->assertJson([
            'name' => 'BCA Main Savings',
        ]);

    $this->assertDatabaseHas('accounts', [
        'id' => $account->id,
        'name' => 'BCA Main Savings',
    ]);
});

test('user cannot update another user\'s account', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/accounts/{$account->id}", [
            'name' => 'Hacked Account',
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('accounts', [
        'id' => $account->id,
        'name' => 'Another User Account',
    ]);
});

test('user can delete their own account', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'name' => 'BCA Savings',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/accounts/{$account->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'message' => 'Account deleted',
        ]);

    $this->assertDatabaseMissing('accounts', [
        'id' => $account->id,
    ]);
});

test('user cannot delete another user\'s account', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $account = $anotherUser->accounts()->create([
        'name' => 'Another User Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 5000000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/accounts/{$account->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('accounts', [
        'id' => $account->id,
    ]);
});

test('required account fields are validated', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', []);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'name',
            'type',
            'currency',
            'initial_balance',
        ]);
});

test('invalid currency is rejected', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'INVALID',
            'initial_balance' => 5000000,
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'currency',
        ]);
});

test('invalid initial balance is rejected', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/accounts', [
            'name' => 'BCA Savings',
            'type' => 'bank',
            'currency' => 'IDR',
            'initial_balance' => 'invalid',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'initial_balance',
        ]);
});
