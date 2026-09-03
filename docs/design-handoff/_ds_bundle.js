<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/tokens/fonts.css">
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/tokens/colors.css">
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/tokens/typography.css">
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/tokens/spacing.css">
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/tokens/glass.css">
  <link rel="stylesheet" href="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/styles.css">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script src="_ds/ut-glass-design-system-125d14db-9e2b-4984-b453-da58d738a508/_ds_bundle.js"></script>
  <style>
    body { margin:0; }
    a { color: var(--text-link); text-decoration: none; }
    a:hover { color: var(--ut-blue-800); text-decoration: underline; }
    input, button { font-family: inherit; }
    table { border-collapse: collapse; }
  </style>
</helmet>

<div style="min-height:100vh; box-sizing:border-box; padding:20px 32px 56px; font-family:var(--font-sans); color:var(--text-primary); background:var(--app-bg); background-attachment:fixed;">

  <header style="display:flex; align-items:center; gap:18px; max-width:1180px; margin:0 auto 26px; padding:12px 14px 12px 20px; border-radius:var(--radius-xl); background:var(--glass-chrome); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(20px) saturate(180%); backdrop-filter:blur(20px) saturate(180%);">
    <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(150deg, var(--ut-blue-500), var(--ut-blue-800)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:700; font-size:13px; letter-spacing:-0.02em; box-shadow:var(--shadow-xs);">BP</div>
    <div style="flex:1; min-width:0;">
      <div style="font-family:var(--font-display); font-size:var(--text-base); font-weight:var(--weight-semibold); letter-spacing:var(--tracking-tight); line-height:1.2;">Portal Sertifikat Diklat</div>
      <div style="font-size:var(--text-xs); color:var(--text-tertiary); font-weight:500;">{{ eventName }}</div>
    </div>
    <div style="display:flex; gap:6px; padding:4px; border-radius:var(--radius-pill); background:rgba(11,22,38,0.05);">
      <button onClick="{{ goPublic }}" style="{{ navPublicStyle }}">Cari Sertifikat</button>
      <button onClick="{{ goAdmin }}" style="{{ navAdminStyle }}">Admin</button>
    </div>
  </header>

  <sc-if value="{{ isSearch }}" hint-placeholder-val="{{ true }}">
    <div style="max-width:1180px; margin:0 auto;">
      <div style="max-width:720px; margin:34px auto 0; text-align:center;">
        <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 14px 6px 10px; border-radius:var(--radius-pill); background:var(--glass-thin); border:1px solid var(--glass-border); box-shadow:var(--glass-edge-top); font-size:var(--text-xs); font-weight:600; color:var(--ut-blue-700); -webkit-backdrop-filter:blur(14px) saturate(180%); backdrop-filter:blur(14px) saturate(180%);">
          <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="shield-check" size="15" hint-size="15px,15px"></x-import>
          Verifikasi &amp; unduh sertifikat resmi
        </div>
        <h1 style="font-family:var(--font-display); font-size:44px; line-height:1.08; letter-spacing:-0.028em; font-weight:var(--weight-bold); margin:18px 0 10px; text-wrap:pretty;">Cari sertifikat Anda</h1>
        <p style="margin:0 auto; max-width:520px; font-size:var(--text-base); color:var(--text-secondary); line-height:1.5; text-wrap:pretty;">Masukkan NIK atau nama lengkap sesuai data pendaftaran. Sertifikat yang tersedia akan langsung dapat diunduh dalam format PDF.</p>
      </div>

      <div style="max-width:660px; margin:26px auto 0; padding:22px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-lg), var(--glass-edge-top); -webkit-backdrop-filter:blur(24px) saturate(180%); backdrop-filter:blur(24px) saturate(180%);">
        <div style="display:flex; gap:10px; align-items:flex-end;">
          <div style="flex:1;">
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Input" label="NIK atau Nama Lengkap" icon="search" size="lg" placeholder="mis. 3204012509870007 atau Sri Wahyuni" value="{{ query }}" onChange="{{ onQueryChange }}" onKeyDown="{{ onQueryKey }}" hint-size="100%,74px"></x-import>
          </div>
          <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="primary" size="lg" onClick="{{ doSearch }}" hint-size="130px,50px">Cari</x-import>
        </div>
        <sc-if value="{{ searchError }}" hint-placeholder-val="{{ false }}">
          <div style="display:flex; align-items:center; gap:8px; margin-top:12px; padding:10px 14px; border-radius:var(--radius-md); background:rgba(224,50,46,0.08); color:#a8231f; font-size:var(--text-sm); font-weight:500;">
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="circle-alert" size="16" hint-size="16px,16px"></x-import>
            {{ searchError }}
          </div>
        </sc-if>
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid var(--border-subtle);">
          <span style="font-size:var(--text-xs); color:var(--text-tertiary); font-weight:600; margin-right:2px;">Coba contoh:</span>
          <sc-for list="{{ samples }}" as="s" hint-placeholder-count="3">
            <button onClick="{{ s.onClick }}" style="padding:5px 12px; border-radius:var(--radius-pill); border:1px solid var(--border-subtle); background:rgba(255,255,255,0.6); font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600); cursor:pointer;" style-hover="background:#fff; color:var(--ut-blue-700);">{{ s.label }}</button>
          </sc-for>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:920px; margin:34px auto 0;">
        <div style="padding:18px 20px; border-radius:var(--radius-lg); background:var(--glass-thin); border:1px solid var(--glass-border); box-shadow:var(--shadow-xs), var(--glass-edge-top); -webkit-backdrop-filter:blur(16px) saturate(180%); backdrop-filter:blur(16px) saturate(180%);">
          <div style="color:var(--ut-blue-600); margin-bottom:8px;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="id-card" size="22" hint-size="22px,22px"></x-import></div>
          <div style="font-weight:var(--weight-semibold); font-size:var(--text-sm); margin-bottom:3px;">Satu Kunci Pencarian</div>
          <div style="font-size:var(--text-xs); color:var(--text-secondary); line-height:1.5;">NIK memberi hasil paling tepat; nama boleh sebagian.</div>
        </div>
        <div style="padding:18px 20px; border-radius:var(--radius-lg); background:var(--glass-thin); border:1px solid var(--glass-border); box-shadow:var(--shadow-xs), var(--glass-edge-top); -webkit-backdrop-filter:blur(16px) saturate(180%); backdrop-filter:blur(16px) saturate(180%);">
          <div style="color:var(--ut-green); margin-bottom:8px;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="file-check-2" size="22" hint-size="22px,22px"></x-import></div>
          <div style="font-weight:var(--weight-semibold); font-size:var(--text-sm); margin-bottom:3px;">Berkas Resmi</div>
          <div style="font-size:var(--text-xs); color:var(--text-secondary); line-height:1.5;">PDF bertanda tangan elektronik, siap dicetak A4 lanskap.</div>
        </div>
        <div style="padding:18px 20px; border-radius:var(--radius-lg); background:var(--glass-thin); border:1px solid var(--glass-border); box-shadow:var(--shadow-xs), var(--glass-edge-top); -webkit-backdrop-filter:blur(16px) saturate(180%); backdrop-filter:blur(16px) saturate(180%);">
          <div style="color:var(--ut-orange); margin-bottom:8px;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="life-buoy" size="22" hint-size="22px,22px"></x-import></div>
          <div style="font-weight:var(--weight-semibold); font-size:var(--text-sm); margin-bottom:3px;">Data Tidak Ditemukan?</div>
          <div style="font-size:var(--text-xs); color:var(--text-secondary); line-height:1.5;">Hubungi sekretariat diklat di <a href="mailto:diklat@bpip.go.id">diklat@bpip.go.id</a>.</div>
        </div>
      </div>
    </div>
  </sc-if>

  <sc-if value="{{ isResults }}" hint-placeholder-val="{{ false }}">
    <div style="max-width:900px; margin:0 auto;">
      <button onClick="{{ goPublic }}" style="display:inline-flex; align-items:center; gap:6px; margin-bottom:14px; padding:7px 14px 7px 10px; border-radius:var(--radius-pill); border:1px solid var(--border-subtle); background:rgba(255,255,255,0.55); font-size:var(--text-sm); font-weight:500; color:var(--ink-600); cursor:pointer;" style-hover="background:#fff;">
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="arrow-left" size="16" hint-size="16px,16px"></x-import>
        Pencarian baru
      </button>

      <div style="padding:22px 24px; border-radius:var(--radius-xl); background:linear-gradient(150deg, var(--ut-blue-600), var(--ut-blue-800)); color:#fff; box-shadow:var(--shadow-lg); display:flex; align-items:center; gap:18px;">
        <div style="width:52px; height:52px; border-radius:var(--radius-pill); background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.28); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:700; font-size:19px;">{{ personInitials }}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-family:var(--font-display); font-size:var(--text-2xl); font-weight:var(--weight-bold); letter-spacing:var(--tracking-tight); line-height:1.15;">{{ personName }}</div>
          <div style="display:flex; gap:16px; margin-top:4px; font-size:var(--text-sm); color:rgba(255,255,255,0.76);">
            <span style="font-family:var(--font-mono);">NIK {{ personNik }}</span>
            <span>{{ resultCountLabel }}</span>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
        <sc-for list="{{ results }}" as="c" hint-placeholder-count="2">
          <div style="display:flex; align-items:center; gap:18px; padding:18px 20px; border-radius:var(--radius-lg); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(20px) saturate(180%); backdrop-filter:blur(20px) saturate(180%); transition:box-shadow 180ms var(--ease-out), transform 180ms var(--ease-out);" style-hover="transform:translateY(-2px); box-shadow:var(--shadow-lg), var(--glass-edge-top);">
            <div style="width:44px; height:56px; border-radius:6px; background:#fff; border:1px solid var(--border-default); box-shadow:var(--shadow-xs); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; color:var(--color-danger); flex:none;">
              <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="file-text" size="18" hint-size="18px,18px"></x-import>
              <span style="font-family:var(--font-mono); font-size:9px; font-weight:700; letter-spacing:0.04em;">PDF</span>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:var(--text-base); font-weight:var(--weight-semibold); letter-spacing:-0.01em; line-height:1.3;">{{ c.kegiatan }}</div>
              <div style="display:flex; flex-wrap:wrap; gap:14px; margin-top:5px; font-size:var(--text-xs); color:var(--text-tertiary);">
                <span style="font-family:var(--font-mono);">{{ c.nomor }}</span>
                <span>Terbit {{ c.tanggalLabel }}</span>
                <span>{{ c.jam }} JP</span>
              </div>
            </div>
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Badge" variant="{{ c.badgeVariant }}" size="sm" hint-size="70px,22px">{{ c.statusLabel }}</x-import>
            <div style="display:flex; gap:8px; flex:none;">
              <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="glass" size="sm" onClick="{{ c.onOpen }}" hint-size="94px,32px">Lihat</x-import>
              <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="primary" size="sm" onClick="{{ c.onDownload }}" hint-size="110px,32px">Unduh PDF</x-import>
            </div>
          </div>
        </sc-for>
      </div>
    </div>
  </sc-if>

  <sc-if value="{{ isPreview }}" hint-placeholder-val="{{ false }}">
    <div style="max-width:1180px; margin:0 auto; display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start;">
      <div style="border-radius:var(--radius-xl); overflow:hidden; background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-lg), var(--glass-edge-top); -webkit-backdrop-filter:blur(24px) saturate(180%); backdrop-filter:blur(24px) saturate(180%);">
        <div style="display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid var(--border-subtle); background:rgba(255,255,255,0.35);">
          <button onClick="{{ backToResults }}" style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px 5px 8px; border-radius:var(--radius-pill); border:1px solid var(--border-subtle); background:rgba(255,255,255,0.7); font-size:var(--text-xs); font-weight:600; color:var(--ink-600); cursor:pointer;" style-hover="background:#fff;">
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="arrow-left" size="14" hint-size="14px,14px"></x-import>
            Daftar
          </button>
          <span style="flex:1; font-family:var(--font-mono); font-size:var(--text-xs); color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ activeFileName }}</span>
          <span style="font-size:var(--text-xs); color:var(--text-tertiary);">Halaman 1 / 1</span>
          <div style="display:flex; align-items:center; gap:2px; padding:3px; border-radius:var(--radius-pill); background:rgba(11,22,38,0.06);">
            <button onClick="{{ zoomOut }}" style="width:26px; height:26px; border:none; border-radius:50%; background:transparent; cursor:pointer; color:var(--ink-600); font-size:15px; line-height:1;">−</button>
            <span style="font-family:var(--font-mono); font-size:11px; width:40px; text-align:center; color:var(--ink-600);">{{ zoomLabel }}</span>
            <button onClick="{{ zoomIn }}" style="width:26px; height:26px; border:none; border-radius:50%; background:transparent; cursor:pointer; color:var(--ink-600); font-size:15px; line-height:1;">+</button>
          </div>
        </div>
        <div style="padding:26px; background:rgba(11,22,38,0.05); display:flex; justify-content:center; max-height:640px; overflow:auto;">
          <div style="width:760px; transform:{{ zoomTransform }}; transform-origin:top center; background:#fff; box-shadow:0 18px 50px rgba(7,15,28,0.22); flex:none;">
            <div style="box-sizing:border-box; width:760px; height:538px; padding:38px 46px; border:9px double var(--ut-gold-500); position:relative; display:flex; flex-direction:column; text-align:center;">
              <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
                <div style="width:44px; height:44px; border-radius:50%; border:2px solid var(--ut-gold-600); color:var(--ut-blue-700); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:11px; font-weight:700;">BPIP</div>
                <div style="text-align:left;">
                  <div style="font-family:var(--font-display); font-size:12px; font-weight:700; letter-spacing:0.16em; color:var(--ut-blue-700);">BADAN PEMBINAAN IDEOLOGI PANCASILA</div>
                  <div style="font-size:10px; letter-spacing:0.1em; color:var(--ink-500);">REPUBLIK INDONESIA</div>
                </div>
              </div>
              <div style="font-family:var(--font-display); font-size:34px; font-weight:700; letter-spacing:0.22em; color:var(--ut-blue-800); margin-top:22px;">SERTIFIKAT</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--ink-500); margin-top:6px;">Nomor: {{ activeNomor }}</div>
              <div style="font-size:12px; color:var(--ink-600); margin-top:20px;">Diberikan kepada</div>
              <div style="font-family:var(--font-display); font-size:27px; font-weight:700; color:var(--ink-900); letter-spacing:-0.01em; margin-top:4px; padding-bottom:6px; border-bottom:1px solid var(--ut-gold-300); display:inline-block; align-self:center; padding-left:40px; padding-right:40px;">{{ personName }}</div>
              <div style="font-size:12px; color:var(--ink-600); line-height:1.7; margin-top:16px; max-width:520px; align-self:center;">atas partisipasinya sebagai <strong>Peserta</strong> dalam kegiatan<br><strong style="font-size:14px; color:var(--ut-blue-700);">{{ activeKegiatan }}</strong><br>yang diselenggarakan pada {{ activeTanggalPanjang }} dengan bobot {{ activeJam }} jam pelajaran.</div>
              <div style="margin-top:auto; display:flex; align-items:flex-end; justify-content:space-between;">
                <div style="text-align:left; font-size:10px; color:var(--ink-400); font-family:var(--font-mono); line-height:1.6;">
                  Dokumen ini ditandatangani<br>secara elektronik oleh BSrE BSSN.<br>Kode verifikasi: {{ activeVerif }}
                </div>
                <div style="text-align:center; font-size:11px; color:var(--ink-600);">
                  <div>Jakarta, {{ activeTanggalPanjang }}</div>
                  <div style="height:44px;"></div>
                  <div style="font-weight:700; color:var(--ink-900); border-top:1px solid var(--ink-300); padding-top:5px;">Deputi Bidang Diklat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:14px;">
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Card" variant="glass" title="Rincian Sertifikat" hint-size="100%,300px">
          <div style="display:flex; flex-direction:column; gap:0; margin-top:4px;">
            <div style="display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border-subtle); font-size:var(--text-sm);"><span style="color:var(--text-tertiary);">Nama</span><span style="font-weight:600; text-align:right;">{{ personName }}</span></div>
            <div style="display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border-subtle); font-size:var(--text-sm);"><span style="color:var(--text-tertiary);">NIK</span><span style="font-family:var(--font-mono); font-weight:600;">{{ personNik }}</span></div>
            <div style="display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border-subtle); font-size:var(--text-sm);"><span style="color:var(--text-tertiary);">Kegiatan</span><span style="font-weight:600; text-align:right;">{{ activeKegiatan }}</span></div>
            <div style="display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border-subtle); font-size:var(--text-sm);"><span style="color:var(--text-tertiary);">Tanggal Terbit</span><span style="font-weight:600;">{{ activeTanggalPanjang }}</span></div>
            <div style="display:flex; justify-content:space-between; gap:12px; padding:9px 0; font-size:var(--text-sm);"><span style="color:var(--text-tertiary);">Ukuran</span><span style="font-family:var(--font-mono); font-weight:600;">{{ activeSize }}</span></div>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:18px;">
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="primary" block="true" onClick="{{ downloadActive }}" hint-size="100%,40px">Unduh PDF</x-import>
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="glass" block="true" onClick="{{ printActive }}" hint-size="100%,40px">Cetak</x-import>
          </div>
        </x-import>
        <div style="padding:16px 18px; border-radius:var(--radius-lg); background:rgba(18,161,80,0.10); border:1px solid rgba(18,161,80,0.22); display:flex; gap:11px;">
          <div style="color:var(--ut-green); flex:none;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="badge-check" size="19" hint-size="19px,19px"></x-import></div>
          <div style="font-size:var(--text-xs); color:var(--ink-700); line-height:1.55;">Sertifikat terverifikasi dan tercatat dalam basis data diklat BPIP. Keaslian dapat dicek ulang melalui kode verifikasi pada berkas.</div>
        </div>
      </div>
    </div>
  </sc-if>

  <sc-if value="{{ isAdminLogin }}" hint-placeholder-val="{{ false }}">
    <div style="max-width:420px; margin:56px auto 0; padding:28px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-xl), var(--glass-edge-top); -webkit-backdrop-filter:blur(24px) saturate(180%); backdrop-filter:blur(24px) saturate(180%);">
      <div style="width:44px; height:44px; border-radius:14px; background:linear-gradient(150deg, var(--ut-blue-500), var(--ut-blue-800)); color:#fff; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="lock" size="20" hint-size="20px,20px"></x-import>
      </div>
      <h2 style="font-family:var(--font-display); font-size:var(--text-2xl); font-weight:var(--weight-bold); letter-spacing:var(--tracking-tight); margin:0 0 6px;">Masuk</h2>
      <p style="margin:0 0 20px; font-size:var(--text-sm); color:var(--text-secondary); line-height:1.5;">Khusus pengguna terdaftar di Sekretariat Diklat BPIP.</p>
      <div style="display:flex; flex-direction:column; gap:14px;">
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Input" label="Email Institusi" icon="mail" placeholder="nama@bpip.go.id" value="{{ adminEmail }}" onChange="{{ onAdminEmail }}" hint-size="100%,68px"></x-import>
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Input" label="Kata Sandi" icon="key-round" type="password" placeholder="••••••••" value="{{ adminPass }}" onChange="{{ onAdminPass }}" onKeyDown="{{ onLoginKey }}" hint-size="100%,68px"></x-import>
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="primary" size="lg" block="true" onClick="{{ doLogin }}" hint-size="100%,50px">Masuk</x-import>
      </div>
      <div style="margin-top:14px; font-size:var(--text-xs); color:var(--text-tertiary); text-align:center;">Demo: isi apa saja lalu tekan Masuk.</div>
    </div>
  </sc-if>

  <sc-if value="{{ isAdmin }}" hint-placeholder-val="{{ false }}">
    <div style="max-width:1180px; margin:0 auto;">
      <div style="display:flex; align-items:flex-end; gap:16px; margin-bottom:18px;">
        <div style="flex:1;">
          <h2 style="font-family:var(--font-display); font-size:var(--text-3xl); font-weight:var(--weight-bold); letter-spacing:var(--tracking-tight); margin:0;">Kelola Sertifikat</h2>
          <p style="margin:3px 0 0; font-size:var(--text-sm); color:var(--text-secondary);">{{ eventName }} · Sekretariat Diklat</p>
        </div>
        <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="glass" onClick="{{ doLogout }}" hint-size="110px,40px">Keluar</x-import>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;">
        <sc-for list="{{ stats }}" as="st" hint-placeholder-count="4">
          <div style="padding:16px 18px; border-radius:var(--radius-lg); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-xs), var(--glass-edge-top); -webkit-backdrop-filter:blur(18px) saturate(180%); backdrop-filter:blur(18px) saturate(180%);">
            <div style="display:flex; align-items:center; gap:7px; font-size:var(--text-xs); color:var(--text-tertiary); font-weight:600;">
              <span style="color:{{ st.color }};"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="{{ st.icon }}" size="15" hint-size="15px,15px"></x-import></span>
              {{ st.label }}
            </div>
            <div style="font-family:var(--font-display); font-size:29px; font-weight:var(--weight-bold); letter-spacing:-0.03em; line-height:1.2; margin-top:5px;">{{ st.value }}</div>
          </div>
        </sc-for>
      </div>

      <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Tabs" items="{{ adminTabs }}" value="{{ adminTab }}" onChange="{{ setAdminTab }}" hint-size="100%,46px"></x-import>

      <sc-if value="{{ tabUnggah }}" hint-placeholder-val="{{ true }}">
        <div style="display:flex; align-items:center; gap:22px; margin-top:18px; padding:20px 24px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(22px) saturate(180%); backdrop-filter:blur(22px) saturate(180%);">
          <div style="flex:1; min-width:0;">
            <div style="font-family:var(--font-mono); font-size:11px; font-weight:700; letter-spacing:0.08em; color:var(--ut-blue-600); margin-bottom:5px;">LANGKAH 1</div>
            <div style="font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); letter-spacing:var(--tracking-tight);">Unggah CSV Penerima</div>
            <p style="margin:4px 0 0; font-size:var(--text-sm); color:var(--text-secondary); line-height:1.5; max-width:560px;">Impor daftar penerima lebih dulu — kolom <span style="font-family:var(--font-mono); font-size:12px;">nik,nama,kegiatan,tanggal_terbit,nomor,jam</span>. Data inilah yang dicari peserta dan menjadi acuan pencocokan PDF.</p>
            <sc-if value="{{ csvNote }}" hint-placeholder-val="{{ false }}">
              <div style="margin-top:10px; font-size:var(--text-xs); color:var(--ut-green); font-weight:600;">{{ csvNote }}</div>
            </sc-if>
          </div>
          <div style="display:flex; gap:9px; flex:none;">
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="ghost" onClick="{{ downloadTemplate }}" hint-size="150px,40px">Unduh Templat</x-import>
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="primary" onClick="{{ importCsv }}" hint-size="140px,40px">Pilih CSV</x-import>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.25fr 1fr; gap:18px; margin-top:16px; align-items:start;">
          <div style="padding:22px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(22px) saturate(180%); backdrop-filter:blur(22px) saturate(180%);">
            <div style="font-family:var(--font-mono); font-size:11px; font-weight:700; letter-spacing:0.08em; color:var(--ut-blue-600); margin-bottom:5px;">LANGKAH 2</div>
            <div style="font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); letter-spacing:var(--tracking-tight);">Unggah ZIP Sertifikat</div>
            <p style="margin:4px 0 16px; font-size:var(--text-sm); color:var(--text-secondary); line-height:1.5;">Satu arsip ZIP berisi banyak PDF. Sistem mencocokkan berkas ke penerima secara otomatis.</p>

            <div onClick="{{ startUpload }}" style="border:2px dashed rgba(0,74,147,0.3); border-radius:var(--radius-lg); background:rgba(255,255,255,0.45); padding:30px 22px; text-align:center; cursor:pointer; transition:background 160ms var(--ease-out), border-color 160ms var(--ease-out);" style-hover="background:#fff; border-color:var(--ut-blue-500);">
              <div style="color:var(--ut-blue-600); display:flex; justify-content:center; margin-bottom:10px;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="upload-cloud" size="30" hint-size="30px,30px"></x-import></div>
              <div style="font-weight:var(--weight-semibold); font-size:var(--text-base);">Tarik berkas ZIP ke sini</div>
              <div style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:4px;">atau klik untuk memilih · maksimal 500 MB per arsip</div>
            </div>

            <sc-if value="{{ uploadActive }}" hint-placeholder-val="{{ false }}">
              <div style="margin-top:16px; padding:16px 18px; border-radius:var(--radius-lg); background:rgba(255,255,255,0.6); border:1px solid var(--border-subtle);">
                <div style="display:flex; align-items:center; gap:10px; font-size:var(--text-sm); font-weight:600;">
                  <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ uploadFileName }}</span>
                  <span style="font-family:var(--font-mono); color:var(--ut-blue-700);">{{ uploadPctLabel }}</span>
                </div>
                <div style="height:7px; border-radius:99px; background:rgba(11,22,38,0.09); overflow:hidden; margin-top:9px;">
                  <div style="height:100%; border-radius:99px; background:linear-gradient(90deg, var(--ut-blue-500), var(--ut-cyan)); width:{{ uploadPctWidth }}; transition:width 200ms var(--ease-out);"></div>
                </div>
                <div style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:8px;">{{ uploadStatusText }}</div>
              </div>
            </sc-if>

            <sc-if value="{{ uploadDone }}" hint-placeholder-val="{{ false }}">
              <div style="margin-top:16px; border-radius:var(--radius-lg); border:1px solid var(--border-subtle); background:rgba(255,255,255,0.6); overflow:hidden;">
                <div style="display:flex; gap:0; border-bottom:1px solid var(--border-subtle);">
                  <div style="flex:1; padding:14px 18px; border-right:1px solid var(--border-subtle);">
                    <div style="font-size:var(--text-xs); color:var(--text-tertiary); font-weight:600;">Cocok otomatis</div>
                    <div style="font-family:var(--font-display); font-size:var(--text-2xl); font-weight:700; color:var(--ut-green);">{{ uploadMatched }}</div>
                  </div>
                  <div style="flex:1; padding:14px 18px;">
                    <div style="font-size:var(--text-xs); color:var(--text-tertiary); font-weight:600;">Perlu ditinjau</div>
                    <div style="font-family:var(--font-display); font-size:var(--text-2xl); font-weight:700; color:var(--ut-orange);">{{ uploadUnmatchedCount }}</div>
                  </div>
                </div>
                <div style="padding:6px 18px 14px;">
                  <sc-for list="{{ uploadUnmatched }}" as="u" hint-placeholder-count="3">
                    <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                      <span style="font-family:var(--font-mono); font-size:var(--text-xs); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ u.file }}</span>
                      <span style="font-size:var(--text-xs); color:var(--ut-orange); font-weight:600;">{{ u.reason }}</span>
                      <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="ghost" size="sm" onClick="{{ u.onFix }}" hint-size="90px,32px">Cocokkan</x-import>
                    </div>
                  </sc-for>
                </div>
              </div>
            </sc-if>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="padding:20px 22px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(22px) saturate(180%); backdrop-filter:blur(22px) saturate(180%);">
              <div style="font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); letter-spacing:var(--tracking-tight);">Aturan Penamaan Berkas</div>
              <p style="margin:4px 0 12px; font-size:var(--text-sm); color:var(--text-secondary); line-height:1.5;">Rekomendasi: sertakan <span style="font-family:var(--font-mono); font-size:12px;">manifest.csv</span> di akar ZIP. Bila tidak ada, sistem membaca NIK dari nama berkas.</p>
              <div style="font-family:var(--font-mono); font-size:11px; line-height:1.9; color:var(--ink-700); background:rgba(11,22,38,0.05); border-radius:var(--radius-sm); padding:12px 14px;">
                diklat-2026.zip<br>
                ├── manifest.csv<br>
                ├── 3204012509870007_SK-1182.pdf<br>
                └── 3174052003910012_SK-1183.pdf
              </div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary); margin-top:10px;">manifest.csv → nik,nama,file</div>
            </div>

          </div>
        </div>
      </sc-if>

      <sc-if value="{{ tabPenerima }}" hint-placeholder-val="{{ false }}">
        <div style="margin-top:18px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(22px) saturate(180%); backdrop-filter:blur(22px) saturate(180%); overflow:hidden;">
          <div style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid var(--border-subtle);">
            <div style="width:290px;">
              <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Input" icon="search" placeholder="Cari nama, NIK, atau nomor" value="{{ tableQuery }}" onChange="{{ onTableQuery }}" hint-size="100%,40px"></x-import>
            </div>
            <div style="display:flex; gap:5px; padding:4px; border-radius:var(--radius-pill); background:rgba(11,22,38,0.05);">
              <sc-for list="{{ filters }}" as="f" hint-placeholder-count="3">
                <button onClick="{{ f.onClick }}" style="{{ f.style }}">{{ f.label }}</button>
              </sc-for>
            </div>
            <div style="flex:1;"></div>
            <span style="font-size:var(--text-xs); color:var(--text-tertiary);">{{ tableCountLabel }}</span>
          </div>
          <table style="width:100%; font-size:var(--text-sm);">
            <thead>
              <tr style="background:rgba(255,255,255,0.4);">
                <th onClick="{{ sortNama }}" style="text-align:left; padding:11px 20px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); cursor:pointer; white-space:nowrap;">Nama {{ sortIndNama }}</th>
                <th onClick="{{ sortNik }}" style="text-align:left; padding:11px 12px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); cursor:pointer; white-space:nowrap;">NIK {{ sortIndNik }}</th>
                <th style="text-align:left; padding:11px 12px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); white-space:nowrap;">Kegiatan</th>
                <th onClick="{{ sortTanggal }}" style="text-align:left; padding:11px 12px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); cursor:pointer; white-space:nowrap;">Terbit {{ sortIndTanggal }}</th>
                <th style="text-align:left; padding:11px 12px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); white-space:nowrap;">Status</th>
                <th style="text-align:right; padding:11px 12px; font-size:var(--text-xs); font-weight:700; color:var(--ink-500); white-space:nowrap;">Unduh</th>
                <th style="padding:11px 20px;"></th>
              </tr>
            </thead>
            <tbody>
              <sc-for list="{{ tableRows }}" as="r" hint-placeholder-count="6">
                <tr style="border-top:1px solid var(--border-subtle);" style-hover="background:rgba(255,255,255,0.45);">
                  <td style="padding:12px 20px; font-weight:600;">{{ r.nama }}</td>
                  <td style="padding:12px 12px; font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600);">{{ r.nikShown }}</td>
                  <td style="padding:12px 12px; color:var(--ink-600);">{{ r.kegiatanShort }}</td>
                  <td style="padding:12px 12px; font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600);">{{ r.tanggalLabel }}</td>
                  <td style="padding:12px 12px;">
                    <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Badge" variant="{{ r.badgeVariant }}" size="sm" hint-size="72px,22px">{{ r.statusLabel }}</x-import>
                  </td>
                  <td style="padding:12px 12px; text-align:right; font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600);">{{ r.unduh }}</td>
                  <td style="padding:12px 20px;">
                    <div style="display:flex; gap:6px; justify-content:flex-end;">
                      <x-import component-from-global-scope="UTGlassDesignSystem_125d14.IconButton" icon="refresh-cw" label="Ganti berkas" size="sm" variant="ghost" onClick="{{ r.onReplace }}" hint-size="32px,32px"></x-import>
                      <x-import component-from-global-scope="UTGlassDesignSystem_125d14.IconButton" icon="trash-2" label="Hapus berkas" size="sm" variant="ghost" onClick="{{ r.onDelete }}" hint-size="32px,32px"></x-import>
                    </div>
                  </td>
                </tr>
              </sc-for>
            </tbody>
          </table>
          <sc-if value="{{ tableEmpty }}" hint-placeholder-val="{{ false }}">
            <div style="padding:38px; text-align:center; font-size:var(--text-sm); color:var(--text-tertiary);">Tidak ada data yang cocok dengan filter ini.</div>
          </sc-if>
        </div>
      </sc-if>

      <sc-if value="{{ tabLog }}" hint-placeholder-val="{{ false }}">
        <div style="margin-top:18px; border-radius:var(--radius-xl); background:var(--glass-regular); border:1px solid var(--glass-border); box-shadow:var(--shadow-sm), var(--glass-edge-top); -webkit-backdrop-filter:blur(22px) saturate(180%); backdrop-filter:blur(22px) saturate(180%); overflow:hidden;">
          <div style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:12px;">
            <div style="flex:1;">
              <div style="font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); letter-spacing:var(--tracking-tight);">Log Unduhan</div>
              <div style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:2px;">Jejak akses berkas oleh penerima, terbaru di atas.</div>
            </div>
            <x-import component-from-global-scope="UTGlassDesignSystem_125d14.Button" variant="glass" size="sm" onClick="{{ exportLog }}" hint-size="120px,32px">Ekspor CSV</x-import>
          </div>
          <div>
            <sc-for list="{{ logRows }}" as="l" hint-placeholder-count="5">
              <div style="display:flex; align-items:center; gap:16px; padding:13px 20px; border-bottom:1px solid var(--border-subtle);">
                <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--text-tertiary); width:132px; flex:none;">{{ l.waktu }}</span>
                <span style="font-weight:600; width:200px; flex:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ l.nama }}</span>
                <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--ink-600); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ l.file }}</span>
                <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--text-tertiary); flex:none;">{{ l.ip }}</span>
              </div>
            </sc-for>
          </div>
        </div>
      </sc-if>
    </div>
  </sc-if>

  <sc-if value="{{ toast }}" hint-placeholder-val="{{ false }}">
    <div style="position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:60; display:flex; align-items:center; gap:10px; padding:13px 20px; border-radius:var(--radius-pill); background:rgba(11,22,38,0.86); color:#fff; font-size:var(--text-sm); font-weight:500; box-shadow:var(--shadow-xl); -webkit-backdrop-filter:blur(18px) saturate(180%); backdrop-filter:blur(18px) saturate(180%);">
      <span style="color:var(--ut-green-soft); display:flex;"><x-import component-from-global-scope="UTGlassDesignSystem_125d14.Icon" name="check" size="17" hint-size="17px,17px"></x-import></span>
      {{ toast }}
    </div>
  </sc-if>
</div>

</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;eventName&quot;:{&quot;editor&quot;:&quot;text&quot;,&quot;default&quot;:&quot;Diklat BPIP RI&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;maskNik&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Privasi&quot;},&quot;requireAdminLogin&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Akses&quot;}}">
const DATA = [
  { id: 1, nama: 'Sri Wahyuni', nik: '3204012509870007', kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII', jam: 32, tanggal: '2026-06-18', nomor: 'SK-1182/DIK/2026', file: '3204012509870007_SK-1182.pdf', size: '412 KB', status: 'siap', unduh: 3 },
  { id: 2, nama: 'Sri Wahyuni', nik: '3204012509870007', kegiatan: 'Pelatihan Fasilitator Ideologi Pancasila', jam: 24, tanggal: '2026-03-04', nomor: 'SK-0741/DIK/2026', file: '3204012509870007_SK-0741.pdf', size: '388 KB', status: 'siap', unduh: 1 },
  { id: 3, nama: 'Bayu Anggara Putra', nik: '3174052003910012', kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII', jam: 32, tanggal: '2026-06-18', nomor: 'SK-1183/DIK/2026', file: '3174052003910012_SK-1183.pdf', size: '405 KB', status: 'siap', unduh: 0 },
  { id: 4, nama: 'Nurul Aisyah Rahmani', nik: '3325116607920003', kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII', jam: 32, tanggal: '2026-06-18', nomor: 'SK-1184/DIK/2026', file: '3325116607920003_SK-1184.pdf', size: '399 KB', status: 'siap', unduh: 2 },
  { id: 5, nama: 'Teguh Prakoso', nik: '3510140812880009', kegiatan: 'Pelatihan Fasilitator Ideologi Pancasila', jam: 24, tanggal: '2026-03-04', nomor: 'SK-0742/DIK/2026', file: null, size: '—', status: 'belum', unduh: 0 },
  { id: 6, nama: 'Made Ayu Kirana', nik: '5103061104930008', kegiatan: 'Diklat Kepemimpinan Berbasis Pancasila', jam: 40, tanggal: '2026-05-22', nomor: 'SK-0998/DIK/2026', file: '5103061104930008_SK-0998.pdf', size: '431 KB', status: 'siap', unduh: 5 },
  { id: 7, nama: 'Rizky Fadillah', nik: '1671030209950004', kegiatan: 'Diklat Kepemimpinan Berbasis Pancasila', jam: 40, tanggal: '2026-05-22', nomor: 'SK-0999/DIK/2026', file: '1671030209950004_SK-0999.pdf', size: '428 KB', status: 'siap', unduh: 0 },
  { id: 8, nama: 'Yohana Silalahi', nik: '1275071506890001', kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII', jam: 32, tanggal: '2026-06-18', nomor: 'SK-1185/DIK/2026', file: null, size: '—', status: 'belum', unduh: 0 },
  { id: 9, nama: 'Ahmad Zulfikar', nik: '3273201011900006', kegiatan: 'Pelatihan Fasilitator Ideologi Pancasila', jam: 24, tanggal: '2026-03-04', nomor: 'SK-0743/DIK/2026', file: '3273201011900006_SK-0743.pdf', size: '392 KB', status: 'siap', unduh: 1 },
  { id: 10, nama: 'Dewi Lestari', nik: '3603142207910002', kegiatan: 'Diklat Kepemimpinan Berbasis Pancasila', jam: 40, tanggal: '2026-05-22', nomor: 'SK-1000/DIK/2026', file: '3603142207910002_SK-1000.pdf', size: '436 KB', status: 'siap', unduh: 4 },
  { id: 11, nama: 'Hendra Wijaya', nik: '6401030103860005', kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII', jam: 32, tanggal: '2026-06-18', nomor: 'SK-1186/DIK/2026', file: '6401030103860005_SK-1186.pdf', size: '401 KB', status: 'siap', unduh: 0 },
  { id: 12, nama: 'Ni Kadek Sari', nik: '5108122812940010', kegiatan: 'Pelatihan Fasilitator Ideologi Pancasila', jam: 24, tanggal: '2026-03-04', nomor: 'SK-0744/DIK/2026', file: '3204012509870007_SK-0744.pdf', size: '377 KB', status: 'siap', unduh: 2 }
];

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

class Component extends DCLogic {
  state = {
    route: 'search', query: '', searchError: '', results: [], person: null,
    active: null, zoom: 1,
    adminEmail: '', adminPass: '', adminTab: 'unggah',
    upload: null, csvNote: '',
    tableQuery: '', filter: 'semua', sortKey: 'nama', sortDir: 1,
    rows: DATA.map(function (d) { return Object.assign({}, d); }),
    log: [
      { waktu: '18 Jun 2026 · 14:22', nama: 'Made Ayu Kirana', file: '5103061104930008_SK-0998.pdf', ip: '103.28.14.77' },
      { waktu: '18 Jun 2026 · 13:58', nama: 'Dewi Lestari', file: '3603142207910002_SK-1000.pdf', ip: '112.215.66.4' },
      { waktu: '18 Jun 2026 · 11:07', nama: 'Sri Wahyuni', file: '3204012509870007_SK-1182.pdf', ip: '36.72.101.19' },
      { waktu: '17 Jun 2026 · 20:41', nama: 'Nurul Aisyah Rahmani', file: '3325116607920003_SK-1184.pdf', ip: '182.1.44.203' },
      { waktu: '17 Jun 2026 · 16:30', nama: 'Ahmad Zulfikar', file: '3273201011900006_SK-0743.pdf', ip: '125.166.9.88' }
    ],
    toast: ''
  };

  componentWillUnmount() { clearInterval(this._t); clearTimeout(this._toast); }

  say(msg) {
    clearTimeout(this._toast);
    this.setState({ toast: msg });
    this._toast = setTimeout(() => this.setState({ toast: '' }), 2600);
  }

  mask(nik) {
    if (this.props.maskNik === false) return nik;
    return nik.slice(0, 4) + '••••••' + nik.slice(-4);
  }

  longDate(iso) {
    const p = iso.split('-');
    return Number(p[2]) + ' ' + BULAN[Number(p[1]) - 1] + ' ' + p[0];
  }
  shortDate(iso) {
    const p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  search = () => {
    const q = this.state.query.trim().toLowerCase();
    if (!q) return this.setState({ searchError: 'Masukkan NIK atau nama lengkap terlebih dahulu.' });
    const digits = q.replace(/\D/g, '');
    const hits = this.state.rows.filter(function (r) {
      if (digits.length >= 6) return r.nik.indexOf(digits) === 0;
      return r.nama.toLowerCase().indexOf(q) !== -1;
    });
    if (!hits.length) return this.setState({ searchError: 'Data tidak ditemukan. Periksa kembali NIK atau ejaan nama Anda.' });
    const ready = hits.filter(function (h) { return h.status === 'siap'; });
    if (!ready.length) return this.setState({ searchError: 'Sertifikat Anda belum diunggah oleh sekretariat. Silakan cek kembali beberapa hari lagi.' });
    this.setState({ searchError: '', route: 'results', results: ready, person: ready[0] });
  };

  open = (row) => this.setState({ route: 'preview', active: row, zoom: 1 });

  download = (row) => {
    const now = new Date();
    const stamp = now.getDate() + ' ' + BULAN[now.getMonth()].slice(0, 3) + ' ' + now.getFullYear() + ' · ' +
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    this.setState(s => ({
      rows: s.rows.map(r => r.id === row.id ? Object.assign({}, r, { unduh: r.unduh + 1 }) : r),
      log: [{ waktu: stamp, nama: row.nama, file: row.file, ip: '36.72.101.19' }].concat(s.log)
    }));
    this.say('Sertifikat ' + row.nomor + ' diunduh.');
  };

  startUpload = () => {
    clearInterval(this._t);
    this.setState({ upload: { pct: 0, phase: 'Mengunggah arsip…' } });
    this._t = setInterval(() => {
      const u = this.state.upload;
      if (!u) return clearInterval(this._t);
      const pct = Math.min(100, u.pct + 7 + Math.random() * 9);
      if (pct >= 100) {
        clearInterval(this._t);
        this.setState({
          upload: {
            pct: 100, phase: 'Selesai', done: true, matched: 148,
            unmatched: [
              { file: 'sertifikat_final(1).pdf', reason: 'NIK tidak terbaca' },
              { file: '3510140812880009_SK-0742.pdf', reason: 'NIK ganda, nama beda' },
              { file: 'scan_teguh.pdf', reason: 'Tidak ada di manifest' }
            ]
          }
        });
        this.say('151 berkas diproses · 148 tercocokkan otomatis.');
      } else {
        this.setState({ upload: { pct: pct, phase: pct < 62 ? 'Mengunggah arsip…' : 'Membaca manifest & mencocokkan NIK…' } });
      }
    }, 320);
  };

  renderVals() {
    const s = this.state;
    const eventName = this.props.eventName ?? 'Diklat BPIP RI';
    const pill = (on) => 'padding:7px 15px; border:none; border-radius:999px; cursor:pointer; font-size:13px; font-weight:600; font-family:inherit; transition:all 160ms cubic-bezier(.32,.72,0,1); ' +
      (on ? 'background:#fff; color:var(--ut-blue-700); box-shadow:var(--shadow-xs);' : 'background:transparent; color:var(--ink-500);');
    const chip = (on) => 'padding:6px 13px; border:none; border-radius:999px; cursor:pointer; font-size:12px; font-weight:600; font-family:inherit; ' +
      (on ? 'background:#fff; color:var(--ut-blue-700); box-shadow:var(--shadow-xs);' : 'background:transparent; color:var(--ink-500);');

    const person = s.person;
    const active = s.active;
    const rows = s.rows;
    const readyCount = rows.filter(r => r.status === 'siap').length;
    const totalDl = rows.reduce((a, r) => a + r.unduh, 0);

    // admin table
    const q = s.tableQuery.trim().toLowerCase();
    let table = rows.filter(r => {
      if (s.filter === 'siap' && r.status !== 'siap') return false;
      if (s.filter === 'belum' && r.status !== 'belum') return false;
      if (!q) return true;
      return (r.nama + ' ' + r.nik + ' ' + r.nomor).toLowerCase().indexOf(q) !== -1;
    });
    const k = s.sortKey, dir = s.sortDir;
    table = table.slice().sort((a, b) => {
      const av = k === 'tanggal' ? a.tanggal : String(a[k]);
      const bv = k === 'tanggal' ? b.tanggal : String(b[k]);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    const ind = (key) => s.sortKey === key ? (dir === 1 ? '↑' : '↓') : '';
    const toggleSort = (key) => () => this.setState(p => ({ sortKey: key, sortDir: p.sortKey === key ? -p.sortDir : 1 }));

    const u = s.upload;

    return {
      eventName,
      isSearch: s.route === 'search', isResults: s.route === 'results', isPreview: s.route === 'preview',
      isAdminLogin: s.route === 'adminLogin', isAdmin: s.route === 'admin',
      navPublicStyle: pill(s.route === 'search' || s.route === 'results' || s.route === 'preview'),
      navAdminStyle: pill(s.route === 'admin' || s.route === 'adminLogin'),
      goPublic: () => this.setState({ route: 'search', searchError: '' }),
      goAdmin: () => this.setState({ route: this.props.requireAdminLogin === false ? 'admin' : 'adminLogin' }),

      query: s.query, searchError: s.searchError,
      onQueryChange: (e) => this.setState({ query: e.target.value, searchError: '' }),
      onQueryKey: (e) => { if (e.key === 'Enter') this.search(); },
      doSearch: this.search,
      samples: [
        { label: '3204012509870007', onClick: () => this.setState({ query: '3204012509870007', searchError: '' }, this.search) },
        { label: 'Made Ayu Kirana', onClick: () => this.setState({ query: 'Made Ayu Kirana', searchError: '' }, this.search) },
        { label: 'Teguh Prakoso', onClick: () => this.setState({ query: 'Teguh Prakoso', searchError: '' }, this.search) }
      ],

      personName: person ? person.nama : '',
      personNik: person ? this.mask(person.nik) : '',
      personInitials: person ? person.nama.split(' ').slice(0, 2).map(w => w[0]).join('') : '',
      resultCountLabel: s.results.length + ' sertifikat tersedia',
      results: s.results.map(r => ({
        kegiatan: r.kegiatan, nomor: r.nomor, jam: r.jam,
        tanggalLabel: this.longDate(r.tanggal),
        statusLabel: 'Terverifikasi', badgeVariant: 'success',
        onOpen: () => this.open(r), onDownload: () => this.download(r)
      })),

      activeKegiatan: active ? active.kegiatan : '',
      activeNomor: active ? active.nomor : '',
      activeJam: active ? active.jam : '',
      activeFileName: active ? active.file : '',
      activeSize: active ? active.size : '',
      activeTanggalPanjang: active ? this.longDate(active.tanggal) : '',
      activeVerif: active ? active.nomor.replace(/[^0-9]/g, '').slice(0, 8) : '',
      zoomLabel: Math.round(s.zoom * 100) + '%',
      zoomTransform: 'scale(' + s.zoom + ')',
      zoomIn: () => this.setState(p => ({ zoom: Math.min(1.6, p.zoom + 0.15) })),
      zoomOut: () => this.setState(p => ({ zoom: Math.max(0.6, p.zoom - 0.15) })),
      backToResults: () => this.setState({ route: 'results' }),
      downloadActive: () => this.download(active),
      printActive: () => this.say('Dialog cetak dibuka (demo).'),

      adminEmail: s.adminEmail, adminPass: s.adminPass,
      onAdminEmail: (e) => this.setState({ adminEmail: e.target.value }),
      onAdminPass: (e) => this.setState({ adminPass: e.target.value }),
      onLoginKey: (e) => { if (e.key === 'Enter') this.setState({ route: 'admin' }); },
      doLogin: () => this.setState({ route: 'admin' }),
      doLogout: () => this.setState({ route: 'search', adminPass: '' }),

      adminTabs: [
        { label: 'Unggah Berkas', value: 'unggah', icon: 'upload' },
        { label: 'Data Penerima', value: 'penerima', count: rows.length },
        { label: 'Log Unduhan', value: 'log' }
      ],
      adminTab: s.adminTab,
      setAdminTab: (v) => this.setState({ adminTab: typeof v === 'string' ? v : v.value }),
      tabUnggah: s.adminTab === 'unggah', tabPenerima: s.adminTab === 'penerima', tabLog: s.adminTab === 'log',

      stats: [
        { label: 'Total Penerima', value: rows.length, icon: 'users', color: 'var(--ut-blue-600)' },
        { label: 'Sertifikat Siap', value: readyCount, icon: 'file-check-2', color: 'var(--ut-green)' },
        { label: 'Belum Cocok', value: rows.length - readyCount, icon: 'triangle-alert', color: 'var(--ut-orange)' },
        { label: 'Total Unduhan', value: totalDl, icon: 'download', color: 'var(--ut-cyan)' }
      ],

      startUpload: this.startUpload,
      uploadActive: !!u,
      uploadDone: !!(u && u.done),
      uploadFileName: 'sertifikat-diklat-juni-2026.zip · 151 berkas',
      uploadPctLabel: u ? Math.round(u.pct) + '%' : '',
      uploadPctWidth: u ? u.pct + '%' : '0%',
      uploadStatusText: u ? u.phase : '',
      uploadMatched: u && u.done ? u.matched : '',
      uploadUnmatchedCount: u && u.done ? u.unmatched.length : '',
      uploadUnmatched: u && u.done ? u.unmatched.map(x => ({
        file: x.file, reason: x.reason,
        onFix: () => this.say('Berkas ' + x.file + ' dikirim ke antrean pencocokan manual.')
      })) : [],

      importCsv: () => this.setState({ csvNote: '152 baris terbaca · 12 duplikat NIK dilewati.' }),
      downloadTemplate: () => this.say('Templat manifest.csv diunduh.'),
      csvNote: s.csvNote,

      tableQuery: s.tableQuery,
      onTableQuery: (e) => this.setState({ tableQuery: e.target.value }),
      filters: [
        { label: 'Semua', onClick: () => this.setState({ filter: 'semua' }), style: chip(s.filter === 'semua') },
        { label: 'Siap', onClick: () => this.setState({ filter: 'siap' }), style: chip(s.filter === 'siap') },
        { label: 'Belum ada PDF', onClick: () => this.setState({ filter: 'belum' }), style: chip(s.filter === 'belum') }
      ],
      tableCountLabel: table.length + ' dari ' + rows.length + ' baris',
      tableEmpty: table.length === 0,
      sortNama: toggleSort('nama'), sortNik: toggleSort('nik'), sortTanggal: toggleSort('tanggal'),
      sortIndNama: ind('nama'), sortIndNik: ind('nik'), sortIndTanggal: ind('tanggal'),
      tableRows: table.map(r => ({
        nama: r.nama, nikShown: this.mask(r.nik),
        kegiatanShort: r.kegiatan.length > 34 ? r.kegiatan.slice(0, 32) + '…' : r.kegiatan,
        tanggalLabel: this.shortDate(r.tanggal),
        statusLabel: r.status === 'siap' ? 'Siap' : 'Belum ada',
        badgeVariant: r.status === 'siap' ? 'success' : 'warning',
        unduh: r.unduh,
        onReplace: () => this.say('Pilih PDF pengganti untuk ' + r.nama + '.'),
        onDelete: () => {
          this.setState(p => ({ rows: p.rows.map(x => x.id === r.id ? Object.assign({}, x, { status: 'belum', file: null, size: '—' }) : x) }));
          this.say('Berkas ' + r.nomor + ' dihapus.');
        }
      })),

      logRows: s.log,
      exportLog: () => this.say('Log unduhan diekspor ke CSV.'),
      toast: s.toast
    };
  }
}

</script>
</body>
</html>
