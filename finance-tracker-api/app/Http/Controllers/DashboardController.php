<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $initialBalance = Account::where('user_id', $user->id)
            ->sum('initial_balance');

        $income = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->sum('amount');

        $expenses = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->sum('amount');

        $totalBalance = $initialBalance + $income - $expenses;

        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $incomeThisMonth = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $expensesThisMonth = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $recentTransactions = Transaction::where('user_id', $user->id)
            ->orderByDesc('transaction_date')
            ->limit(5)
            ->get();

        return response()->json([
            'total_balance' => $totalBalance,
            'income_this_month' => $incomeThisMonth,
            'expenses_this_month' => $expensesThisMonth,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
