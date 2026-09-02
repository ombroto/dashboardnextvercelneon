/* ============================================================
   UT GLASS · COLORS
   Palette extracted directly from the Universitas Terbuka logo:
   the royal-blue university shield, the gold arc, and the
   Direktorat Sistem Informasi (DiSI) rainbow swirl.
   ============================================================ */
:root {
  /* ---- Brand: UT Blue (primary) ---- */
  --ut-blue-50:  #eef4fc;
  --ut-blue-100: #d3e3f6;
  --ut-blue-200: #a6c6ec;
  --ut-blue-300: #6fa0db;
  --ut-blue-400: #3c79c5;
  --ut-blue-500: #1a59ac;
  --ut-blue-600: #004a93;   /* core brand blue */
  --ut-blue-700: #003c78;
  --ut-blue-800: #002e5e;
  --ut-blue-900: #001f42;

  /* ---- Brand: UT Gold (secondary) ---- */
  --ut-gold-50:  #fef9e6;
  --ut-gold-100: #fdf0bf;
  --ut-gold-200: #fbe183;
  --ut-gold-300: #f9d251;
  --ut-gold-400: #f6c62c;
  --ut-gold-500: #f5c518;   /* core brand gold */
  --ut-gold-600: #d3a106;
  --ut-gold-700: #a37a00;

  /* ---- DiSI swirl accents ---- */
  --ut-magenta: #c0265e;
  --ut-magenta-soft: #d8497d;
  --ut-cyan:    #1486be;
  --ut-cyan-soft: #4aa8d6;
  --ut-green:   #12a150;
  --ut-green-soft: #36bd6e;
  --ut-orange:  #f39200;
  --ut-orange-soft: #f8ad3e;

  /* ---- Neutrals: cool slate, tuned to read on frosted glass ---- */
  --ink-950: #070f1c;
  --ink-900: #0b1626;
  --ink-800: #1a2740;
  --ink-700: #2c3a4f;
  --ink-600: #45556d;
  --ink-500: #5d6e87;
  --ink-400: #8492a8;
  --ink-300: #aab6c6;
  --ink-200: #cfd8e3;
  --ink-100: #e6ecf3;
  --ink-50:  #f3f6fb;
  --white:   #ffffff;

  /* ---- Semantic status ---- */
  --color-success: var(--ut-green);
  --color-warning: var(--ut-orange);
  --color-danger:  #e0322e;
  --color-danger-soft: #ef5d59;
  --color-info:    var(--ut-cyan);

  /* ---- Semantic aliases ---- */
  --brand-primary:   var(--ut-blue-600);
  --brand-primary-hover: var(--ut-blue-700);
  --brand-secondary: var(--ut-gold-500);
  --brand-accent:    var(--ut-magenta);

  --text-primary:    var(--ink-900);
  --text-secondary:  var(--ink-600);
  --text-tertiary:   var(--ink-400);
  --text-on-brand:   #ffffff;
  --text-on-gold:    var(--ut-blue-900);
  --text-link:       var(--ut-blue-600);

  --border-subtle:   rgba(11, 22, 38, 0.08);
  --border-default:  rgba(11, 22, 38, 0.14);
  --border-strong:   rgba(11, 22, 38, 0.24);

  --focus-ring:      rgba(0, 74, 147, 0.45);

  /* ---- Demo wallpaper: UT-tinted aurora mesh that glass sits over ---- */
  --app-bg:
    radial-gradient(900px 600px at 12% 8%,  rgba(245,197,24,0.30), transparent 60%),
    radial-gradient(1000px 700px at 88% 6%, rgba(192,38,94,0.22), transparent 58%),
    radial-gradient(1100px 800px at 78% 95%, rgba(20,134,190,0.30), transparent 60%),
    radial-gradient(900px 700px at 8% 92%,  rgba(18,161,80,0.20), transparent 60%),
    linear-gradient(160deg, #eaf1fb 0%, #dfeaf7 45%, #e9eef7 100%);
}
