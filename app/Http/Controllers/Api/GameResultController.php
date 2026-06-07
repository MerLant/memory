<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GameResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $results = $request->user()
            ->gameResults()
            ->take(10)
            ->get();

        return response()->json(['results' => $results]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'theme' => ['required', Rule::in(['cats', 'code', 'memes'])],
            'moves' => ['required', 'integer', 'min:6', 'max:999'],
            'duration_seconds' => ['required', 'integer', 'min:1', 'max:3600'],
        ]);

        $data['rating'] = max(1, 1000 - ($data['moves'] * 20) - $data['duration_seconds']);

        $result = $request->user()->gameResults()->create($data);

        return response()->json(['result' => $result], 201);
    }
}
