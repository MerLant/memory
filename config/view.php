<?php

return [

    /*
    |--------------------------------------------------------------------------
    | View Paths
    |--------------------------------------------------------------------------
    |
    | Here you may specify which view paths should be checked when looking for
    | a view. By default, Laravel uses the resources/views directory.
    |
    */

    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled Views
    |--------------------------------------------------------------------------
    |
    | This option determines where all the compiled Blade templates will be
    | stored for your application. Typically, this is within the storage
    | directory and should be writable.
    |
    */

    'compiled' => env(
        'VIEW_COMPILED_PATH',
        realpath(storage_path('framework/views')) ?: storage_path('framework/views')
    ),

    /*
    |--------------------------------------------------------------------------
    | Relative Hashing
    |--------------------------------------------------------------------------
    |
    | When enabled, compiled view hashes are generated relative to the base
    | path of the application. That is useful when the project is mounted in
    | different locations between environments.
    |
    */

    'relative_hash' => env('VIEW_RELATIVE_HASH', false),

    /*
    |--------------------------------------------------------------------------
    | View Caching
    |--------------------------------------------------------------------------
    |
    | Controls whether Blade view compilation should be cached on disk.
    |
    */

    'cache' => env('VIEW_CACHE', true),

    /*
    |--------------------------------------------------------------------------
    | Compiled Extension
    |--------------------------------------------------------------------------
    |
    | The file extension used for compiled Blade templates.
    |
    */

    'compiled_extension' => env('VIEW_COMPILED_EXTENSION', 'php'),

];
