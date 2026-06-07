import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

const THEMES = {
  cats: {
    title: 'Кошки',
    symbols: ['🐱', '😺', '😸', '😻', '🐈', '🧶'],
  },
  code: {
    title: 'Языки',
    symbols: ['PHP', 'JS', 'SQL', 'HTML', 'CSS', 'RX'],
  },
  memes: {
    title: 'Мемы',
    symbols: ['WOW', 'LOL', 'NO', 'OK', 'GG', '404'],
  },
};

const BACKGROUNDS = {
  paper: 'Бумага',
  mint: 'Мята',
  night: 'Ночь',
};

const BACKS = {
  waves: 'Волны',
  stars: 'Звезды',
  grid: 'Сетка',
};

let csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const configuredMemorizeSeconds = Number(new URLSearchParams(window.location.search).get('memorizeSeconds'));
const memorizeSeconds = Number.isInteger(configuredMemorizeSeconds) && configuredMemorizeSeconds > 0
  ? configuredMemorizeSeconds
  : 60;

async function api(path, options = {}, retry = true) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrf,
      ...(options.headers ?? {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 419 && retry) {
    await api('/api/csrf-token', {}, false).catch(() => {});
    return api(path, options, false);
  }

  if (!response.ok) {
    const message = data.message || Object.values(data.errors ?? {})?.[0]?.[0] || 'Ошибка запроса.';
    throw new Error(message);
  }

  if (data.csrf_token) {
    csrf = data.csrf_token;
  }

  return data;
}

function shuffle(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function makeDeck(theme) {
  return shuffle(
    THEMES[theme].symbols.flatMap((symbol, index) => [
      { id: `${theme}-${index}-a`, pair: index, symbol },
      { id: `${theme}-${index}-b`, pair: index, symbol },
    ]),
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [theme, setTheme] = useState('cats');
  const [deck, setDeck] = useState(() => makeDeck('cats'));
  const [phase, setPhase] = useState('idle');
  const [memorizeLeft, setMemorizeLeft] = useState(memorizeSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [opened, setOpened] = useState([]);
  const [matched, setMatched] = useState([]);
  const [modal, setModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [settings, setSettings] = useState({ game_background: 'paper', card_back: 'waves' });

  useEffect(() => {
    api('/api/me').then((data) => setUser(data.user)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setSettings({
        game_background: user.game_background ?? 'paper',
        card_back: user.card_back ?? 'waves',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    api('/api/results').then((data) => setHistory(data.results)).catch((event) => setError(event.message));
  }, [user]);

  useEffect(() => {
    if (phase !== 'memorize') return undefined;
    if (memorizeLeft <= 0) {
      setPhase('playing');
      return undefined;
    }
    const timer = window.setTimeout(() => setMemorizeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, memorizeLeft]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (opened.length !== 2) return undefined;
    const [first, second] = opened.map((id) => deck.find((card) => card.id === id));
    setMoves((value) => value + 1);

    if (first.pair === second.pair) {
      const nextMatched = [...matched, first.pair];
      setMatched(nextMatched);
      setOpened([]);

      if (nextMatched.length === 6) {
        setPhase('won');
        setModal(true);
        saveResult(moves + 1, Math.max(elapsed, 1));
      }
      return undefined;
    }

    const timer = window.setTimeout(() => setOpened([]), 850);
    return () => window.clearTimeout(timer);
  }, [opened]);

  const rating = useMemo(() => Math.max(1, 1000 - moves * 20 - elapsed), [moves, elapsed]);

  function resetGame(nextTheme = theme) {
    setTheme(nextTheme);
    setDeck(makeDeck(nextTheme));
    setPhase('idle');
    setMemorizeLeft(memorizeSeconds);
    setElapsed(0);
    setMoves(0);
    setOpened([]);
    setMatched([]);
    setModal(false);
    setNotice('');
  }

  function startGame() {
    resetGame(theme);
    setPhase('memorize');
  }

  function openCard(card) {
    if (phase !== 'playing' || opened.length === 2 || opened.includes(card.id) || matched.includes(card.pair)) return;
    setOpened((value) => [...value, card.id]);
  }

  async function saveResult(finalMoves, finalSeconds) {
    if (!user) return;
    try {
      await api('/api/results', {
        method: 'POST',
        body: { theme, moves: finalMoves, duration_seconds: finalSeconds },
      });
      const data = await api('/api/results');
      setHistory(data.results);
    } catch (event) {
      setError(event.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError('');
    const form = Object.fromEntries(new FormData(formElement));
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const body = authMode === 'login' ? form : { ...form, password_confirmation: form.password };

    try {
      const data = await api(endpoint, { method: 'POST', body });
      setUser(data.user);
      setNotice(authMode === 'login' ? 'Вы вошли в систему.' : 'Профиль создан.');
      formElement.reset();
    } catch (authError) {
      setError(authError.message);
    }
  }

  async function logout() {
    await api('/api/csrf-token').catch(() => {});
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    await api('/api/csrf-token').catch(() => {});
    setUser(null);
    setNotice('Сессия завершена.');
  }

  async function updateProfile(event) {
    event.preventDefault();
    setError('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api('/api/profile', { method: 'PATCH', body });
      setUser(data.user);
      setSettings({
        game_background: data.user.game_background,
        card_back: data.user.card_back,
      });
      setNotice('Профиль сохранен.');
    } catch (profileError) {
      setError(profileError.message);
    }
  }

  return (
    <div className={`app bg-${settings.game_background}`}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Игра memory">
          <span className="brand-mark">M</span>
          <span>Игра memory</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#game">Игра</a>
          <a href="#profile">Профиль</a>
          <a href="#history">История</a>
        </nav>
      </header>

      <main>
        <section className="game-shell" id="game" aria-labelledby="game-title">
          <h1 id="game-title">Игра memory</h1>

          <div className="toolbar" aria-label="Управление игрой">
            <label>
              <span>Тема</span>
              <select value={theme} onChange={(event) => resetGame(event.target.value)}>
                {Object.entries(THEMES).map(([key, item]) => (
                  <option key={key} value={key}>{item.title}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={startGame}>Начать</button>
            <button type="button" className="secondary" onClick={() => resetGame()}>Сброс</button>
          </div>

          <div className="stats" aria-live="polite">
            <span>{phase === 'memorize' ? `Запоминание ${memorizeLeft}с` : formatTime(elapsed)}</span>
            <span>Ходы: {moves}</span>
            <span>Рейтинг: {rating}</span>
          </div>

          <section className={`board back-${settings.card_back}`} aria-label="Поле из 12 карточек">
            {deck.map((card) => {
              const visible = phase === 'memorize' || opened.includes(card.id) || matched.includes(card.pair);
              return (
                <button
                  type="button"
                  key={card.id}
                  className={`memory-card ${visible ? 'is-open' : ''}`}
                  onClick={() => openCard(card)}
                  aria-label={visible ? `Карточка ${card.symbol}` : 'Закрытая карточка'}
                >
                  <span className="card-face card-front">{card.symbol}</span>
                  <span className="card-face card-back" aria-hidden="true">?</span>
                </button>
              );
            })}
          </section>
        </section>

        <aside className="side-panel" id="profile" aria-labelledby="profile-title">
          <section>
            <h2 id="profile-title">{user ? 'Профиль' : 'Вход'}</h2>
            {error && <p className="alert error">{error}</p>}
            {notice && <p className="alert success">{notice}</p>}

            {!user ? (
              <>
                <div className="switcher">
                  <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                    Вход
                  </button>
                  <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
                    Регистрация
                  </button>
                </div>
                <form className="form" onSubmit={handleAuth}>
                  {authMode === 'register' && <input name="email" type="email" placeholder="E-mail" autoComplete="email" required />}
                  <input name="login" type="text" placeholder="Логин" autoComplete="username" required />
                  <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    minLength="10"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  {authMode === 'register' && (
                    <>
                      <input name="age" type="number" min="6" max="120" placeholder="Возраст" required />
                      <select name="gender" defaultValue="other" required>
                        <option value="female">Женский</option>
                        <option value="male">Мужской</option>
                        <option value="other">Не указан</option>
                      </select>
                    </>
                  )}
                  <button type="submit">{authMode === 'login' ? 'Войти' : 'Создать профиль'}</button>
                </form>
              </>
            ) : (
              <form className="form" onSubmit={updateProfile}>
                <input name="email" type="email" defaultValue={user.email} required />
                <input name="login" type="text" defaultValue={user.login} required />
                <input name="age" type="number" min="6" max="120" defaultValue={user.age} required />
                <select name="gender" defaultValue={user.gender} required>
                  <option value="female">Женский</option>
                  <option value="male">Мужской</option>
                  <option value="other">Не указан</option>
                </select>
                <label>
                  <span>Фон игры</span>
                  <select
                    name="game_background"
                    value={settings.game_background}
                    onChange={(event) => setSettings({ ...settings, game_background: event.target.value })}
                  >
                    {Object.entries(BACKGROUNDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Рубашка карточек</span>
                  <select
                    name="card_back"
                    value={settings.card_back}
                    onChange={(event) => setSettings({ ...settings, card_back: event.target.value })}
                  >
                    {Object.entries(BACKS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <div className="button-row">
                  <button type="submit">Сохранить</button>
                  <button type="button" className="secondary" onClick={logout}>Выход</button>
                </div>
              </form>
            )}
          </section>

          <section id="history" aria-labelledby="history-title">
            <h2 id="history-title">История игр</h2>
            {user ? (
              <div className="history-list">
                {history.length === 0 && <p className="muted">Пока нет сохраненных игр.</p>}
                {history.map((item) => (
                  <article className="history-item" key={item.id}>
                    <strong>{THEMES[item.theme]?.title ?? item.theme}</strong>
                    <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>
                    <span>{item.moves} ходов, {formatTime(item.duration_seconds)}, рейтинг {item.rating}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">История последних 10 игр доступна после входа.</p>
            )}
          </section>
        </aside>
      </main>

      <footer>
        <span>Laravel 12</span>
        <span>React 19</span>
        <span>SQLite</span>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="win-title">
            <h2 id="win-title">Победа</h2>
            <p>Игра пройдена за {moves} ходов и {formatTime(elapsed)}. Рейтинг: {rating}.</p>
            <button type="button" onClick={startGame}>Играть снова</button>
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
