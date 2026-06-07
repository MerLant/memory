<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users')->ignore($request->user()->id)],
            'login' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash:ascii', Rule::unique('users')->ignore($request->user()->id)],
            'age' => ['required', 'integer', 'min:6', 'max:120'],
            'gender' => ['required', Rule::in(['female', 'male', 'other'])],
            'game_background' => ['required', Rule::in(['paper', 'mint', 'night'])],
            'card_back' => ['required', Rule::in(['waves', 'stars', 'grid'])],
        ]);

        $request->user()->update($data);

        return response()->json(['user' => $request->user()->fresh()]);
    }
}
