<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'from_account_id' => 'sometimes|integer|exists:accounts,id',
            'to_account_id' => 'sometimes|integer|exists:accounts,id',
            'from' => 'sometimes|date',
            'to' => 'sometimes|date',
        ]);

        $query = Transfer::where('user_id', $request->user()->id);

        $query->when($validated['from_account_id'] ?? null, function ($query, $fromAccountId) {
            $query->where('from_account_id', $fromAccountId);
        });

        $query->when($validated['to_account_id'] ?? null, function ($query, $toAccountId) {
            $query->where('to_account_id', $toAccountId);
        });

        $query->when($validated['from'] ?? null, function ($query, $from) {
            $query->whereDate('transfer_date', '>=', $from);
        });

        $query->when($validated['to'] ?? null, function ($query, $to) {
            $query->whereDate('transfer_date', '<=', $to);
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
            'from_account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where('user_id', $user->id),
            ],
            'to_account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where('user_id', $user->id),
                'different:from_account_id',
            ],
            'amount' => 'required|integer|min:1',
            'transfer_date' => 'required|date',
            'description' => 'nullable|string|max:255',
        ]);

        $transfer = Transfer::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return $transfer;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Transfer $transfer)
    {
        abort_unless($transfer->user_id === $request->user()->id, 404);

        return $transfer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transfer $transfer)
    {
        abort_unless(
            $transfer->user_id === $request->user()->id,
            404
        );

        $user = $request->user();

        $validated = $request->validate([
            'from_account_id' => [
                'sometimes',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where('user_id', $user->id),
            ],
            'to_account_id' => [
                'sometimes',
                'integer',
                Rule::exists('accounts', 'id')
                    ->where('user_id', $user->id),
            ],
            'amount' => 'sometimes|integer|min:1',
            'transfer_date' => 'sometimes|date',
            'description' => 'sometimes|nullable|string|max:255',
        ]);

        $transfer->update($validated);

        return $transfer;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transfer $transfer)
    {
        abort_unless($transfer->user_id === $request->user()->id, 404);

        $transfer->delete();

        return response()->json([
            'message' => 'Transfer deleted'
        ]);
    }
}
