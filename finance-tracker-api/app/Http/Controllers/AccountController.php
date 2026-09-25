<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Account::where('user_id', $request->user()->id)->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|string|max:30',
            'currency' => 'required|string|size:3',
            'initial_balance' => 'required|integer',
            'is_active' => 'boolean',
        ]);

        $account = Account::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return $account;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 404);

        return $account;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'type' => 'sometimes|string|max:30',
            'currency' => 'sometimes|string|size:3',
            'initial_balance' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $account->update($validated);

        return $account;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Account $account)
    {
        abort_unless($account->user_id === $request->user()->id, 404);

        $account->delete();

        return response()->json([
            'message' => 'Account deleted'
        ]);
    }
}
