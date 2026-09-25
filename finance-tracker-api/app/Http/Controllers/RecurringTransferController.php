<?php

namespace App\Http\Controllers;

use App\Models\RecurringTransfer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecurringTransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return RecurringTransfer::where(
            'user_id',
            $request->user()->id
        )->get();
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
            'frequency' => 'required|in:daily,weekly,monthly,yearly',
            'next_occurrence' => 'required|date',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $recurringTransfer = RecurringTransfer::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return $recurringTransfer;
    }

    /**
     * Display the specified resource.
     */
    public function show(
        Request $request,
        RecurringTransfer $recurringTransfer
    ) {
        abort_unless(
            $recurringTransfer->user_id === $request->user()->id,
            404
        );

        return $recurringTransfer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        Request $request,
        RecurringTransfer $recurringTransfer
    ) {
        abort_unless(
            $recurringTransfer->user_id === $request->user()->id,
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
                'different:from_account_id',
            ],
            'amount' => 'sometimes|integer|min:1',
            'frequency' => 'sometimes|in:daily,weekly,monthly,yearly',
            'next_occurrence' => 'sometimes|date',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
            'is_active' => 'sometimes|boolean',
        ]);

        $recurringTransfer->update($validated);

        return $recurringTransfer;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(
        Request $request,
        RecurringTransfer $recurringTransfer
    ) {
        abort_unless(
            $recurringTransfer->user_id === $request->user()->id,
            404
        );

        $recurringTransfer->delete();

        return response()->json([
            'message' => 'Recurring transfer deleted'
        ]);
    }
}
