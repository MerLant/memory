<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Веб-версия классической игры Memory с темами, профилем и историей результатов.">
    <meta name="keywords" content="memory, игра, карточки, Laravel, React">
    <meta property="og:title" content="Игра memory">
    <meta property="og:description" content="Запоминайте карточки, находите пары и улучшайте рейтинг по количеству ходов.">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="ru_RU">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Игра memory</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
