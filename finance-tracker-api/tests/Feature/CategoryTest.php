<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create category', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/categories', [
            'name' => 'Food & Dining',
            'type' => 'expense',
            'icon' => 'utensils',
            'color' => '#FF5733',
            'is_active' => true,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'Food & Dining',
    ]);
});

test('unauthenticated user cannot create category', function () {
    $response = $this->postJson('/api/categories', [
        'name' => 'Food & Dining',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response->assertStatus(401);
});

test('user can list their categories', function () {
    $user = User::factory()->create();

    $user->categories()->create([
        'name' => 'Food & Dining',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/categories');

    $response
        ->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'name' => 'Food & Dining',
        ]);
});

test('user cannot see another user\'s categories', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $anotherUser->categories()->create([
        'name' => 'Another User Category',
        'type' => 'expense',
        'icon' => 'food',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson('/api/categories');

    $response
        ->assertStatus(200)
        ->assertJsonMissing([
            'name' => 'Another User Category',
        ]);
});

test('user can view their own category', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'name' => 'Food & Dining',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/categories/{$category->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'id' => $category->id,
            'name' => 'Food & Dining',
        ]);
});

test('user cannot view another user\'s category', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = $anotherUser->categories()->create([
        'name' => 'Another User Category',
        'type' => 'expense',
        'icon' => 'food',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson("/api/categories/{$category->id}");

    $response->assertStatus(404);
});

test('user can update their category', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'name' => 'Food & Dining',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/categories/{$category->id}", [
            'name' => 'Restaurants',
        ]);

    $response
        ->assertStatus(200)
        ->assertJson([
            'name' => 'Restaurants',
        ]);

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'Restaurants',
    ]);
});

test('user cannot update another user\'s category', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = $anotherUser->categories()->create([
        'name' => 'Another User Category',
        'type' => 'expense',
        'icon' => 'food',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->putJson("/api/categories/{$category->id}", [
            'name' => 'Hacked Category',
        ]);

    $response->assertStatus(404);

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'Another User Category',
    ]);
});

test('user can delete their category', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'name' => 'Food & Dining',
        'type' => 'expense',
        'icon' => 'utensils',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/categories/{$category->id}");

    $response
        ->assertStatus(200)
        ->assertJson([
            'message' => 'Category deleted',
        ]);

    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);
});

test('user cannot delete another user\'s category', function () {
    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $category = $anotherUser->categories()->create([
        'name' => 'Another User Category',
        'type' => 'expense',
        'icon' => 'food',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->deleteJson("/api/categories/{$category->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
    ]);
});

test('required category fields are validated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/categories', []);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'name',
            'type',
        ]);
});

test('category name constraints are validated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user, 'sanctum')
        ->postJson('/api/categories', [
            'name' => str_repeat('a', 101),
            'type' => 'expense',
            'icon' => 'food',
            'color' => '#FF5733',
            'is_active' => true,
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'name',
        ]);
});
