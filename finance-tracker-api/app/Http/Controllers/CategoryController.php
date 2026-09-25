<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return Category::where('user_id', $request->user()->id)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $category = Category::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return $category;
    }

    public function show(Request $request, Category $category)
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $user = $request->user();

        abort_unless($category->user_id === $user->id, 404);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'type' => 'sometimes|in:income,expense',
            'icon' => 'sometimes|nullable|string|max:50',
            'color' => 'sometimes|nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($validated);

        return $category;
    }

    public function destroy(Request $request, Category $category)
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->delete();

        return response()->json([
            'message' => 'Category deleted'
        ]);
    }
}
