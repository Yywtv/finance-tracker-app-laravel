<?php

namespace App\Http\Controllers;

use App\Models\TransactionAttachment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionAttachmentController extends Controller
{
    public function index(Request $request)
    {
        return TransactionAttachment::whereHas('transaction', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => [
                'required',
                'integer',
                Rule::exists('transactions', 'id')
                    ->where('user_id', $request->user()->id),
            ],
            'file_path' => 'required|string|max:255',
            'original_filename' => 'required|string|max:255',
            'mime_type' => [
                'required',
                'string',
                'in:image/jpeg,image/png,application/pdf',
            ],
            'file_size' => 'required|integer|min:1|max:5242880',
        ]);

        $attachment = TransactionAttachment::create($validated);

        return $attachment;
    }

    public function show(
        Request $request,
        TransactionAttachment $transactionAttachment
    ) {
        abort_unless(
            $transactionAttachment->transaction->user_id === $request->user()->id,
            404
        );

        return $transactionAttachment;
    }

    public function update(
        Request $request,
        TransactionAttachment $transactionAttachment
    ) {
        abort_unless(
            $transactionAttachment->transaction->user_id === $request->user()->id,
            404
        );

        $validated = $request->validate([
            'file_path' => 'sometimes|string|max:255',
            'original_filename' => 'sometimes|string|max:255',
            'mime_type' => [
                'sometimes',
                'string',
                'in:image/jpeg,image/png,application/pdf',
            ],
            'file_size' => 'sometimes|integer|min:1|max:5242880',
        ]);

        $transactionAttachment->update($validated);

        return $transactionAttachment;
    }

    public function destroy(
        Request $request,
        TransactionAttachment $transactionAttachment
    ) {
        abort_unless(
            $transactionAttachment->transaction->user_id === $request->user()->id,
            404
        );

        $transactionAttachment->delete();

        return response()->json([
            'message' => 'Transaction attachment deleted'
        ]);
    }
}
