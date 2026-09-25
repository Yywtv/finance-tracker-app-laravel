<?php

use App\Models\User;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\Category;
use App\Models\TransactionAttachment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createTransactionFor(User $user): Transaction
{
    $account = Account::create([
        'user_id' => $user->id,
        'name' => 'Bank Account',
        'type' => 'bank',
        'currency' => 'IDR',
        'initial_balance' => 1000000,
        'is_active' => true,
    ]);

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Food',
        'type' => 'expense',
        'is_active' => true,
    ]);

    return Transaction::create([
        'user_id' => $user->id,
        'account_id' => $account->id,
        'category_id' => $category->id,
        'type' => 'expense',
        'amount' => 50000,
        'description' => 'Lunch',
        'transaction_date' => '2026-09-01',
    ]);
}

function createAttachmentFor(Transaction $transaction): TransactionAttachment
{
    return TransactionAttachment::create([
        'transaction_id' => $transaction->id,
        'file_path' => 'attachments/receipt.jpg',
        'original_filename' => 'receipt.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1000,
    ]);
}

test('authenticated user can upload attachment', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/transaction-attachments', [
            'transaction_id' => $transaction->id,
            'file_path' => 'attachments/receipt.jpg',
            'original_filename' => 'receipt.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 1000,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('transaction_attachments', [
        'transaction_id' => $transaction->id,
        'file_path' => 'attachments/receipt.jpg',
        'original_filename' => 'receipt.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1000,
    ]);
});

test('unauthenticated user cannot upload attachment', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);

    $response = $this->postJson('/api/transaction-attachments', [
        'transaction_id' => $transaction->id,
        'file_path' => 'attachments/receipt.jpg',
        'original_filename' => 'receipt.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1000,
    ]);

    $response->assertStatus(401);
});

test('user can retrieve their attachment', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);
    $attachment = createAttachmentFor($transaction);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/transaction-attachments/{$attachment->id}");

    $response->assertStatus(200);

    $response->assertJson([
        'id' => $attachment->id,
        'transaction_id' => $transaction->id,
        'file_path' => 'attachments/receipt.jpg',
        'original_filename' => 'receipt.jpg',
        'mime_type' => 'image/jpeg',
        'file_size' => 1000,
    ]);
});

test('user cannot retrieve another user attachment', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $transaction = createTransactionFor($otherUser);
    $attachment = createAttachmentFor($transaction);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/transaction-attachments/{$attachment->id}");

    $response->assertStatus(404);
});

test('user can delete their attachment', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);
    $attachment = createAttachmentFor($transaction);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/transaction-attachments/{$attachment->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('transaction_attachments', [
        'id' => $attachment->id,
    ]);
});

test('user cannot delete another user attachment', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $transaction = createTransactionFor($otherUser);
    $attachment = createAttachmentFor($transaction);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/transaction-attachments/{$attachment->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('transaction_attachments', [
        'id' => $attachment->id,
    ]);
});

test('attachment must belong to user transaction', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $transaction = createTransactionFor($otherUser);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/transaction-attachments', [
            'transaction_id' => $transaction->id,
            'file_path' => 'attachments/receipt.jpg',
            'original_filename' => 'receipt.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 1000,
        ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'transaction_id',
    ]);

    $this->assertDatabaseMissing('transaction_attachments', [
        'transaction_id' => $transaction->id,
    ]);
});

test('file type validation works', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/transaction-attachments', [
            'transaction_id' => $transaction->id,
            'file_path' => 'attachments/file.exe',
            'original_filename' => 'file.exe',
            'mime_type' => 'application/x-msdownload',
            'file_size' => 1000,
        ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'mime_type',
    ]);
});

test('file size validation works', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/transaction-attachments', [
            'transaction_id' => $transaction->id,
            'file_path' => 'attachments/large-file.pdf',
            'original_filename' => 'large-file.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 5242881,
        ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'file_size',
    ]);
});

test('missing file is rejected', function () {
    $user = User::factory()->create();
    $transaction = createTransactionFor($user);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/transaction-attachments', [
            'transaction_id' => $transaction->id,
        ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
    ]);
});
