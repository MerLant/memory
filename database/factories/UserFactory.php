<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'login' => fake()->unique()->userName(),
            'password' => Hash::make('password1234'),
            'age' => fake()->numberBetween(10, 80),
            'gender' => fake()->randomElement(['female', 'male', 'other']),
            'game_background' => 'paper',
            'card_back' => 'waves',
            'remember_token' => Str::random(10),
        ];
    }
}
