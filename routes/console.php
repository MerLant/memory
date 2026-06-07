<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('memory:about', function () {
    $this->info('Игра memory');
});
