<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameResultController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/csrf-token', fn () => response()->json(['csrf_token' => csrf_token()]));
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::get('/results', [GameResultController::class, 'index']);
        Route::post('/results', [GameResultController::class, 'store']);
    });
});

Route::view('/{any?}', 'app')->where('any', '.*');
