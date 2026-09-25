<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\RecurringTransferController;
use App\Http\Controllers\TransactionAttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::apiResource('accounts', AccountController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('transfers', TransferController::class);
    Route::apiResource('budgets', BudgetController::class);
    Route::apiResource('recurring-transfers', RecurringTransferController::class);
    Route::apiResource('transaction-attachments', TransactionAttachmentController::class);
});
Route::post('/register', [AuthController::class, 'register']);
