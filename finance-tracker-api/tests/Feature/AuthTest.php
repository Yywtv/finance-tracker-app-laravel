<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('user can register', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
});

test('duplicate email is rejected', function () {
    User::factory()->create([
        'email' => 'john@example.com',
    ]);

    $response = $this->postJson('/api/register', [
        'name' => 'Another User',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'email',
    ]);
});

test('invalid email is rejected', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'not-an-email',
        'password' => 'password123',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'email',
    ]);
});

test('password validation works', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => '123',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'password',
    ]);
});

test('password is hashed', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(201);

    $user = User::where('email', 'john@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->password)->not->toBe('password123');
    expect(Hash::check('password123', $user->password))->toBeTrue();
});

test('registration returns a Sanctum token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(201);

    $response->assertJsonStructure([
        'token',
    ]);

    expect($response->json('token'))->not->toBeEmpty();
});

test('/api/user works with a valid token', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader(
        'Authorization',
        'Bearer ' . $token
    )->getJson('/api/user');

    $response->assertStatus(200);

    $response->assertJson([
        'id' => $user->id,
        'email' => $user->email,
    ]);
});

test('/api/user rejects unauthenticated requests', function () {
    $response = $this->getJson('/api/user');

    $response->assertStatus(401);
});
