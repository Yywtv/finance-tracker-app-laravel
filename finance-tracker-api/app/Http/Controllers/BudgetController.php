<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Budget::where('user_id', $request->user()->id)->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $request->user()->id),
            ],
            'amount' => 'required|integer|min:1',
            'period' => 'required|in:weekly,monthly,yearly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $budget = Budget::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return $budget;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 404);

        return $budget;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'category_id' => [
                'sometimes',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $request->user()->id),
            ],
            'amount' => 'sometimes|integer|min:1',
            'period' => 'sometimes|in:weekly,monthly,yearly',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
        ]);

        $budget->update($validated);

        return $budget;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Budget $budget)
    {
        abort_unless($budget->user_id === $request->user()->id, 404);

        $budget->delete();

        return response()->json([
            'message' => 'Budget deleted'
        ]);
    }
}
