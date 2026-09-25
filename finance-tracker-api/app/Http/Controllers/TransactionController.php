<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Account;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'type' => 'sometimes|in:income,expense',
            'account_id' => 'sometimes|integer|exists:accounts,id',
            'category_id' => 'sometimes|integer|exists:categories,id',
            'from' => 'sometimes|date',
            'to' => 'sometimes|date',
        ]);

        $query = Transaction::where('user_id', $request->user()->id);

        $query->when($validated['type'] ?? null, function ($query, $type) {
            $query->where('type', $type);
        });

        $query->when($validated['account_id'] ?? null, function ($query, $accountId) {
            $query->where('account_id', $accountId);
        });

        $query->when($validated['category_id'] ?? null, function ($query, $categoryId) {
            $query->where('category_id', $categoryId);
        });

        $query->when($validated['from'] ?? null, function ($query, $from) {
            $query->whereDate('transaction_date', '>=', $from);
        });

        $query->when($validated['to'] ?? null, function ($query, $to) {
            $query->whereDate('transaction_date', '<=', $to);
        });

        return $query->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where('user_id', $user->id),
            ],

            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $user->id),
            ],

            'type' => 'required|in:income,expense',
            'amount' => 'required|integer|min:1',
            'description' => 'required|string|max:255',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $transaction = Transaction::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return $transaction;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->user_id === $request->user()->id, 404);

        return $transaction;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $user = $request->user();

        abort_unless($transaction->user_id === $user->id, 404);

        $validated = $request->validate([
            'account_id' => 'sometimes|integer|exists:accounts,id',
            'category_id' => 'sometimes|integer|exists:categories,id',
            'type' => 'sometimes|string|max:20',
            'amount' => 'sometimes|integer',
            'description' => 'sometimes|string|max:255',
            'transaction_date' => 'sometimes|date',
            'notes' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['account_id'])) {
            Account::where('id', $validated['account_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        if (isset($validated['category_id'])) {
            Category::where('id', $validated['category_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $transaction->update($validated);

        return $transaction;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->user_id === $request->user()->id, 404);

        $transaction->delete();

        return response()->json([
            'message' => 'Transaction deleted'
        ]);
    }
}
