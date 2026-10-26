import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateBanner() {
  const WIDTH = 2048;
  const HEIGHT = 1152;

  console.log('1. Preparing workshop photos...');
  // Left photo: Panadería - warm and authentic
  const leftPhotoBuf = await sharp('public/nosotros/taller-panaderia.webp')
    .resize({ width: 850, height: 680, fit: 'cover', position: 'center' })
    .modulate({ brightness: 0.75, saturation: 1.0 })
    .toBuffer();

  // Right photo: Grupo de Estudiantes - bright and welcoming
  const rightPhotoBuf = await sharp('public/nosotros/hero-estudiantes.webp')
    .resize({ width: 950, height: 680, fit: 'cover', position: 'center' })
    .modulate({ brightness: 0.70, saturation: 0.95 })
    .toBuffer();

  // Official logo oscuro resized to 640px for maximum impact
  const logoBuf = await sharp('public/logo-oscuro.svg')
    .resize({ width: 640 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();
  console.log('Logo dimensions:', logoMeta.width, logoMeta.height);

  // SVG Overlay containing graphics, ambience, and typography
  const svgOverlay = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Base deep navy gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#010c17" />
        <stop offset="35%" stop-color="#00182b" />
        <stop offset="70%" stop-color="#002b49" />
        <stop offset="100%" stop-color="#010f1c" />
      </linearGradient>

      <!-- Vignette masks for smooth photo integration -->
      <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#001628" stop-opacity="0.1" />
        <stop offset="45%" stop-color="#001628" stop-opacity="0.6" />
        <stop offset="80%" stop-color="#001628" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#001628" stop-opacity="1" />
      </linearGradient>

      <linearGradient id="rightFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#001628" stop-opacity="1" />
        <stop offset="20%" stop-color="#001628" stop-opacity="0.95" />
        <stop offset="55%" stop-color="#001628" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#001628" stop-opacity="0.1" />
      </linearGradient>

      <!-- Ambient Glows -->
      <radialGradient id="centerGlow" cx="50%" cy="52%" r="48%">
        <stop offset="0%" stop-color="#1B4E8E" stop-opacity="0.55" />
        <stop offset="55%" stop-color="#002B49" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#00182b" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="goldGlow" cx="50%" cy="48%" r="40%">
        <stop offset="0%" stop-color="#FFC72C" stop-opacity="0.22" />
        <stop offset="50%" stop-color="#F5C100" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="greenGlow" cx="30%" cy="50%" r="35%">
        <stop offset="0%" stop-color="#3FAA2C" stop-opacity="0.20" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>

      <!-- Pill Card Gradient -->
      <linearGradient id="pillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#072b4c" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#021424" stop-opacity="0.95" />
      </linearGradient>

      <!-- Drop Shadows -->
      <filter id="shadowHeavy" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.75"/>
      </filter>
      <filter id="shadowMedium" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
      <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>

    <style>
      .badge-txt { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-weight: 800; font-size: 13.5px; fill: #FFD15C; letter-spacing: 2.2px; }
      .slogan { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-style: italic; font-weight: 600; font-size: 24.5px; fill: #FFFFFF; letter-spacing: 0.5px; }
      .pill-txt { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-weight: 700; font-size: 14.5px; fill: #F8FAFC; }
      .contact-txt { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-weight: 600; font-size: 16.5px; fill: #94A3B8; }
      .highlight-txt { fill: #38BDF8; font-weight: 700; }
      .gold-txt { fill: #FFC72C; font-weight: 700; }
      .tv-tagline { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 15px; fill: #64748B; letter-spacing: 3px; text-transform: uppercase; }
    </style>

    <!-- TV Area Accent: Top and Bottom Decors (visible on Smart TV 2048x1152) -->
    <g opacity="0.5">
      <line x1="200" y1="120" x2="1848" y2="120" stroke="#1E3A5F" stroke-width="1.2" stroke-dasharray="10 10" />
      <circle cx="1024" cy="120" r="3.5" fill="#3FAA2C" />
      <text x="1024" y="95" text-anchor="middle" class="tv-tagline">Centro de Formación Laboral · Inclusión y Empleabilidad</text>

      <line x1="200" y1="1032" x2="1848" y2="1032" stroke="#1E3A5F" stroke-width="1.2" stroke-dasharray="10 10" />
      <circle cx="1024" cy="1032" r="3.5" fill="#FFC72C" />
      <text x="1024" y="1065" text-anchor="middle" class="tv-tagline">El Salvador · Formando Jóvenes con Discapacidad Intelectual</text>
    </g>

    <!-- Ambient Center Lights -->
    <rect x="200" y="300" width="1648" height="552" fill="url(#centerGlow)" />
    <circle cx="1024" cy="555" r="440" fill="url(#goldGlow)" />
    <circle cx="560" cy="565" r="340" fill="url(#greenGlow)" />

    <!-- ======================================================== -->
    <!-- CENTRAL SAFE AREA CONTENT (Centered at X=1024, Y=576)    -->
    <!-- Safe Area Bounds: X: 408..1640 (W:1232), Y: 407..745 (H:338) -->
    <!-- ======================================================== -->

    <!-- 1. Top Institutional Pill: ASPAPREM · DESDE 1993 · EL SALVADOR -->
    <g transform="translate(1024, 432)" filter="url(#badgeShadow)">
      <rect x="-215" y="-14" width="430" height="28" rx="14" fill="#031E36" stroke="#FFC72C" stroke-width="1.3" stroke-opacity="0.9" />
      <!-- Left green dot -->
      <circle cx="-188" cy="0" r="3.5" fill="#3FAA2C" />
      <!-- Text centered -->
      <text x="0" y="4.5" text-anchor="middle" class="badge-txt">ASPAPREM · DESDE 1993 · EL SALVADOR</text>
      <!-- Right green dot -->
      <circle cx="188" cy="0" r="3.5" fill="#3FAA2C" />
    </g>

    <!-- 2. Logo will be composited as an image at X = 704, Y = 458 (width 640, height 191) -->

    <!-- 3. Slogan: Formando futuros, integrando vidas -->
    <g transform="translate(1024, 665)" filter="url(#shadowMedium)">
      <text x="0" y="0" text-anchor="middle" class="slogan">
        <tspan fill="#FFC72C" font-weight="800">« </tspan>Formando futuros, integrando vidas<tspan fill="#FFC72C" font-weight="800"> »</tspan>
      </text>
    </g>

    <!-- 4. Workshop Pills Row (4 pills: Panadería, Costura, Carpintería, Autonomía) -->
    <g transform="translate(1024, 700)">
      <!-- Pill 1: Panadería -->
      <g transform="translate(-330, 0)" filter="url(#badgeShadow)">
        <rect x="-72" y="-13" width="144" height="26" rx="13" fill="url(#pillGrad)" stroke="#F59E0B" stroke-width="1.2" stroke-opacity="0.9"/>
        <!-- Bread SVG Icon -->
        <g transform="translate(-56, -7)">
          <path d="M 2 8 C 2 3, 12 3, 12 8 C 12 11, 2 11, 2 8 Z" fill="#F59E0B"/>
        </g>
        <text x="5" y="4.5" text-anchor="middle" class="pill-txt">Panadería</text>
      </g>

      <!-- Pill 2: Costura -->
      <g transform="translate(-112, 0)" filter="url(#badgeShadow)">
        <rect x="-65" y="-13" width="130" height="26" rx="13" fill="url(#pillGrad)" stroke="#EC4899" stroke-width="1.2" stroke-opacity="0.9"/>
        <!-- Spool SVG Icon -->
        <g transform="translate(-50, -6)">
          <circle cx="5" cy="6" r="4.5" fill="#EC4899" />
          <circle cx="5" cy="6" r="2" fill="#072b4c" />
        </g>
        <text x="6" y="4.5" text-anchor="middle" class="pill-txt">Costura</text>
      </g>

      <!-- Pill 3: Carpintería -->
      <g transform="translate(108, 0)" filter="url(#badgeShadow)">
        <rect x="-72" y="-13" width="144" height="26" rx="13" fill="url(#pillGrad)" stroke="#10B981" stroke-width="1.2" stroke-opacity="0.9"/>
        <!-- Hammer SVG Icon -->
        <g transform="translate(-55, -6)">
          <rect x="2" y="2" width="7" height="3.5" rx="1" fill="#10B981" />
          <rect x="4.5" y="5.5" width="2" height="6.5" rx="0.5" fill="#10B981" />
        </g>
        <text x="5" y="4.5" text-anchor="middle" class="pill-txt">Carpintería</text>
      </g>

      <!-- Pill 4: Vida Laboral -->
      <g transform="translate(328, 0)" filter="url(#badgeShadow)">
        <rect x="-80" y="-13" width="160" height="26" rx="13" fill="url(#pillGrad)" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.9"/>
        <!-- Star SVG Icon -->
        <g transform="translate(-64, -6)">
          <polygon points="5,1 6.5,4.2 10,4.6 7.5,7 8.2,10.4 5,8.6 1.8,10.4 2.5,7 0,4.6 3.5,4.2" fill="#38BDF8"/>
        </g>
        <text x="6" y="4.5" text-anchor="middle" class="pill-txt">Vida Laboral</text>
      </g>
    </g>

    <!-- 5. Channels and Contact Row -->
    <g transform="translate(1024, 735)" filter="url(#badgeShadow)">
      <text x="0" y="0" text-anchor="middle" class="contact-txt">
        <tspan class="highlight-txt">🌐 lariojacflsv.site</tspan>
        <tspan fill="#475569">   •   </tspan>
        <tspan class="gold-txt">▶ @LaRiojaCFL</tspan>
        <tspan fill="#475569">   •   </tspan>
        <tspan fill="#F1F5F9">📱 (503) 7731-0792</tspan>
      </text>
    </g>

  </svg>
  `;

  // Masks for blending photos
  const leftMaskSvg = `
  <svg width="850" height="680" viewBox="0 0 850 680" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fadeMaskL" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.75" />
        <stop offset="45%" stop-color="#fff" stop-opacity="0.35" />
        <stop offset="85%" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="vMask" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.1" />
        <stop offset="20%" stop-color="#fff" stop-opacity="1" />
        <stop offset="80%" stop-color="#fff" stop-opacity="1" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="850" height="680" fill="url(#fadeMaskL)" mask="url(#vMask)" />
  </svg>
  `;

  const rightMaskSvg = `
  <svg width="950" height="680" viewBox="0 0 950 680" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fadeMaskR" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="15%" stop-color="#fff" stop-opacity="0" />
        <stop offset="55%" stop-color="#fff" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.7" />
      </linearGradient>
      <linearGradient id="vMaskR" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.1" />
        <stop offset="20%" stop-color="#fff" stop-opacity="1" />
        <stop offset="80%" stop-color="#fff" stop-opacity="1" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="950" height="680" fill="url(#fadeMaskR)" mask="url(#vMaskR)" />
  </svg>
  `;

  console.log('2. Applying masks...');
  const maskedLeftPhoto = await sharp(leftPhotoBuf)
    .composite([{ input: Buffer.from(leftMaskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const maskedRightPhoto = await sharp(rightPhotoBuf)
    .composite([{ input: Buffer.from(rightMaskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  console.log('3. Assembling canvas...');
  const baseBg = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 1, g: 14, b: 26, alpha: 1 } // Deep Navy #010E1A
    }
  }).png().toBuffer();

  // Logo position:
  // Width: 640, height: 191
  // Left: 1024 - 320 = 704
  // Top: 456
  const logoLeft = Math.round(1024 - (logoMeta.width / 2));
  const logoTop = 456;

  const outputJpg = 'public/youtube-banner-2048x1152.jpg';
  const outputPng = 'public/youtube-banner-2048x1152.png';

  console.log('4. Generating production banners...');
  const composedBuffer = await sharp(baseBg)
    .composite([
      // Left photo
      {
        input: maskedLeftPhoto,
        top: 236,
        left: 0,
        blend: 'over'
      },
      // Right photo
      {
        input: maskedRightPhoto,
        top: 236,
        left: WIDTH - 950,
        blend: 'over'
      },
      // Vector overlay
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
        blend: 'over'
      },
      // Official Logo render
      {
        input: logoBuf,
        top: logoTop,
        left: logoLeft,
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  // Save JPG
  await sharp(composedBuffer)
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(outputJpg);

  // Save PNG
  await sharp(composedBuffer)
    .png({ compressionLevel: 8 })
    .toFile(outputPng);

  // 5. Generate Safe Zone Guide for user verification
  console.log('5. Generating safe zone verification preview...');
  const guideSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <!-- Desktop Horizontal Strip: 2048 x 338 (Y: 407..745) -->
    <rect x="0" y="407" width="2048" height="338" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="8 8" />
    <rect x="10" y="415" width="370" height="28" rx="4" fill="#001a2e" fill-opacity="0.8" />
    <text x="20" y="434" fill="#38BDF8" font-family="sans-serif" font-size="15" font-weight="bold">ÁREA VISIBLE EN COMPUTADORAS (2048 × 338)</text>

    <!-- Mobile Safe Area: 1232 x 338 (X: 408..1640, Y: 407..745) -->
    <rect x="408" y="407" width="1232" height="338" fill="none" stroke="#FFC72C" stroke-width="3.5" />
    <rect x="415" y="415" width="560" height="28" rx="4" fill="#001a2e" fill-opacity="0.85" />
    <text x="425" y="434" fill="#FFC72C" font-family="sans-serif" font-size="15" font-weight="bold">ZONA SEGURA / CELULARES Y TODOS LOS DISPOSITIVOS (1232 × 338)</text>

    <!-- TV Label -->
    <rect x="15" y="25" width="370" height="34" rx="4" fill="#001a2e" fill-opacity="0.8" />
    <text x="25" y="48" fill="#E2E8F0" font-family="sans-serif" font-size="16" font-weight="bold">ÁREA TOTAL PARA SMART TV (2048 × 1152 px)</text>
  </svg>
  `;

  const guidePng = 'public/youtube-banner-safezone-guide.png';
  await sharp(composedBuffer)
    .composite([{ input: Buffer.from(guideSvg), blend: 'over' }])
    .png()
    .toFile(guidePng);

  const jpgStats = fs.statSync(outputJpg);
  const pngStats = fs.statSync(outputPng);
  const guideStats = fs.statSync(guidePng);

  console.log(`✅ Final banners generated!`);
  console.log(`JPG: ${outputJpg} - ${(jpgStats.size / 1024).toFixed(1)} KB`);
  console.log(`PNG: ${outputPng} - ${(pngStats.size / 1024).toFixed(1)} KB`);
  console.log(`Guía: ${guidePng} - ${(guideStats.size / 1024).toFixed(1)} KB`);
}

generateBanner().catch(err => {
  console.error(err);
  process.exit(1);
});
