# melatonin → Astro Migration

Самодостаточный модуль для переноса проекта с ванильного HTML/CSS/JS на [Astro](https://astro.build).
Все ресурсы продублированы внутри модуля — внешних зависимостей от папок нет.

## Структура

```
astro-migration/
├── public/
│   ├── assets/                  # CSS, изображения, музыка, видео
│   │   ├── css/                 # main.css + все @import-файлы
│   │   ├── img/
│   │   ├── music/
│   │   └── video/
│   └── src/js/                  # JS-модули (раздаются как статика)
│       ├── App.js
│       ├── main.js
│       ├── components/
│       ├── content/
│       └── utils/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro     # Общая оболочка: <head>, boot-loader, header, nav, lightbox
│   ├── pages/
│   │   ├── index.astro          # Главная страница
│   │   ├── about.astro          # О группе (со слайд-секцией)
│   │   └── farewells.astro      # Farewells (JS-рендер секций)
│   └── components/              # Папка для будущих Astro-компонентов
├── astro.config.mjs
└── package.json
```

## Запуск

```bash
cd astro-migration
npm install      # если node_modules ещё нет
npm run dev      # → http://localhost:4321
```

## Страницы

| URL            | Файл                    | Оригинал           |
|----------------|-------------------------|--------------------|
| `/`            | `pages/index.astro`     | `index.html`       |
| `/about`       | `pages/about.astro`     | `about.html`       |
| `/farewells`   | `pages/farewells.astro` | `farewells.html`   |

## Совместимость с JS

- `App.getPageKey()` читает ключ страницы из `<meta name="page-key">` (Astro-способ).
- Все пути к ресурсам в JS изменены с `assets/...` на `/assets/...` (абсолютные).
- JS-модули в `public/src/js/` подключаются через `<script type="module" src="/src/js/main.js">`.
  Astro не трогает файлы из `public/`, поэтому все `import` внутри JS работают как есть.
