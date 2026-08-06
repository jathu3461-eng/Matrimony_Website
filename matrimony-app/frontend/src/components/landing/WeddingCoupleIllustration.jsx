import { motion, useReducedMotion } from 'framer-motion';

const SKIN = 'url(#skinGrad)';
const GOLD = 'url(#goldGrad)';

function Sparkle({ x, y, size = 12, delay = 0 }) {
  const s = size;
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.path
        d={`M0 ${-s / 2} L${s / 7} ${-s / 7} L${s / 2} 0 L${s / 7} ${s / 7} L0 ${s / 2} L${-s / 7} ${s / 7} L${-s / 2} 0 L${-s / 7} ${-s / 7} Z`}
        fill="#ffd97a"
        animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </g>
  );
}

function Heart({ x, y, size = 18, fill = '#ff5f9e', delay = 0, float = true }) {
  const h = size;
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        animate={float ? { y: [0, -9, 0], rotate: [-4, 4, -4] } : undefined}
        transition={float ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay } : undefined}
      >
        <path
          d={`M0 ${h * 0.25}
              C ${-h * 0.62} ${-h * 0.3}, ${-h * 0.18} ${-h * 0.85}, 0 ${-h * 0.28}
              C ${h * 0.18} ${-h * 0.85}, ${h * 0.62} ${-h * 0.3}, 0 ${h * 0.25} Z`}
          fill={fill}
        />
        <path
          d={`M0 ${h * 0.16}
              C ${-h * 0.5} ${-h * 0.24}, ${-h * 0.15} ${-h * 0.66}, 0 ${-h * 0.22}
              C ${h * 0.15} ${-h * 0.66}, ${h * 0.5} ${-h * 0.24}, 0 ${h * 0.16} Z`}
          fill="#ffffff"
          opacity="0.35"
        />
      </motion.g>
    </g>
  );
}

function Petal({ x, y, size = 9, rotate = 0, fill = '#ffb3c8', delay = 0, drift = true }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <motion.g
        animate={drift ? { y: [0, -12, 0], x: [0, 5, 0], rotate: [0, 14, 0] } : undefined}
        transition={drift ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay } : undefined}
      >
        <path
          d={`M0 ${-size} C ${size * 0.8} ${-size * 0.2}, ${size * 0.5} ${size * 0.8}, 0 ${size * 0.55} C ${-size * 0.5} ${size * 0.8}, ${-size * 0.8} ${-size * 0.2}, 0 ${-size} Z`}
          fill={fill}
        />
        <path
          d={`M0 ${-size * 0.5} L0 ${size * 0.4}`}
          stroke="#f36a92"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </motion.g>
    </g>
  );
}

export default function WeddingCoupleIllustration({ className = '' }) {
  const reduce = useReducedMotion();
  const float = reduce ? {} : {};
  const ringsAnim = reduce
    ? {}
    : { animate: { y: [0, -7, 0], rotate: [-5, 5, -5] }, transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 640 520"
        className="w-full h-full"
        role="img"
        aria-label="Elegant Tamil couple illustration for premium wedding matchmaking"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff7fa" />
            <stop offset="0.45" stopColor="#ffe4ef" />
            <stop offset="0.8" stopColor="#ffeede" />
            <stop offset="1" stopColor="#ffd9d0" />
          </linearGradient>
          <radialGradient id="glowRadial" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbd3ab" />
            <stop offset="1" stopColor="#f2b98a" />
          </linearGradient>
          <linearGradient id="sherwaniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf6" />
            <stop offset="1" stopColor="#f1e2cc" />
          </linearGradient>
          <linearGradient id="sareeGrad" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#e8407f" />
            <stop offset="1" stopColor="#a80f4e" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset="0.5" stopColor="#f4bd43" />
            <stop offset="1" stopColor="#cf8f26" />
          </linearGradient>
          <linearGradient id="palluGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f9d68a" />
            <stop offset="0.5" stopColor="#efb94e" />
            <stop offset="1" stopColor="#d49a2e" />
          </linearGradient>
          <linearGradient id="pillarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff0e2" />
            <stop offset="0.5" stopColor="#ffe2d3" />
            <stop offset="1" stopColor="#f6c9b4" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="640" height="520" fill="url(#bgGrad)" />

        {/* Mandap glow behind couple */}
        <circle cx="325" cy="300" r="225" fill="url(#glowRadial)" />

        {/* Mandap arch */}
        <g>
          <path d="M 95 300 C 95 118, 545 118, 545 300" fill="none" stroke="#f2c98a" strokeWidth="14" strokeLinecap="round" opacity="0.75" />
          <path d="M 95 300 C 95 118, 545 118, 545 300" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
          {/* Marigold garland along arch */}
          <path d="M 95 300 C 95 118, 545 118, 545 300" fill="none" stroke="#ff8c42" strokeWidth="7.5" strokeLinecap="round" strokeDasharray="0 15" opacity="0.95" />
          {/* Rose garland slightly inset */}
          <path
            d="M 95 300 C 95 118, 545 118, 545 300"
            fill="none"
            stroke="#f472b6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="0 15"
            opacity="0.9"
            transform="translate(325 300) scale(0.93) translate(-325 -300)"
          />
          {/* Dangling marigold strings from arch top */}
          <path d="M 120 128 L 120 205" stroke="#ff8c42" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 11" />
          <path d="M 530 128 L 530 205" stroke="#ff8c42" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 11" />
        </g>

        {/* Pillars */}
        <g>
          <rect x="72" y="300" width="34" height="180" rx="10" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
          <rect x="64" y="286" width="50" height="18" rx="8" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
          <rect x="64" y="474" width="50" height="12" rx="6" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
          <rect x="534" y="300" width="34" height="180" rx="10" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
          <rect x="526" y="286" width="50" height="18" rx="8" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
          <rect x="526" y="474" width="50" height="12" rx="6" fill="url(#pillarGrad)" stroke="#f3c9a8" strokeWidth="2" />
        </g>

        {/* Floor / dais */}
        <ellipse cx="325" cy="480" rx="225" ry="18" fill="#ffffff" opacity="0.55" />
        <ellipse cx="325" cy="479" rx="150" ry="13" fill="#ef9ec0" opacity="0.28" />

        {/* ──────────────── GROOM (left) ──────────────── */}
        <g>
          {/* Shoes */}
          <rect x="204" y="462" width="30" height="20" rx="9" fill="#4a2f28" />
          <rect x="252" y="462" width="30" height="20" rx="9" fill="#4a2f28" />

          {/* Churidar legs */}
          <rect x="214" y="416" width="26" height="50" rx="11" fill="url(#sherwaniGrad)" />
          <rect x="262" y="416" width="26" height="50" rx="11" fill="url(#sherwaniGrad)" />

          {/* Sherwani coat */}
          <path
            d="M192 322 C192 305 205 298 228 298 L272 298 C295 298 308 305 308 322 L301 428 L199 428 Z"
            fill="url(#sherwaniGrad)"
          />
          {/* Gold collar piping */}
          <path d="M228 300 L250 352 L272 300" fill="none" stroke="#d9a441" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Buttons */}
          <circle cx="250" cy="360" r="2.6" fill="#d9a441" />
          <circle cx="250" cy="374" r="2.6" fill="#d9a441" />
          <circle cx="250" cy="388" r="2.6" fill="#d9a441" />
          {/* Side embroidery motifs */}
          <path d="M222 336 Q230 344 222 352" fill="none" stroke="#c9a15c" strokeWidth="2" strokeLinecap="round" />
          <path d="M278 336 Q270 344 278 352" fill="none" stroke="#c9a15c" strokeWidth="2" strokeLinecap="round" />
          {/* Left arm at side */}
          <path d="M198 320 Q188 352 190 392 L202 390 Q200 352 208 326 Z" fill="url(#sherwaniGrad)" />
          <circle cx="196" cy="400" r="9" fill={SKIN} />
          {/* Right arm reaching toward bride */}
          <path d="M286 320 Q318 330 322 372 L306 376 Q300 344 276 330 Z" fill="url(#sherwaniGrad)" />
          <rect x="310" y="370" width="16" height="12" rx="5" fill="#e9d6b0" />

          {/* Neck */}
          <rect x="234" y="258" width="32" height="42" rx="12" fill={SKIN} />

          {/* Head */}
          <ellipse cx="250" cy="246" rx="33" ry="37" fill={SKIN} />
          <circle cx="216" cy="248" r="7" fill={SKIN} />
          <circle cx="284" cy="248" r="7" fill={SKIN} />
          {/* Temple hair */}
          <path d="M216 232 Q212 252 218 270 L226 268 Q220 252 224 232 Z" fill="#24161c" />
          <path d="M284 232 Q288 252 282 270 L274 268 Q280 252 276 232 Z" fill="#24161c" />
          {/* Eyebrows */}
          <path d="M226 236 Q236 229 246 234" fill="none" stroke="#24161c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M254 234 Q264 229 274 236" fill="none" stroke="#24161c" strokeWidth="2.5" strokeLinecap="round" />
          {/* Happy closed eyes */}
          <path d="M228 250 Q236 243 244 250" fill="none" stroke="#3b241c" strokeWidth="3" strokeLinecap="round" />
          <path d="M256 250 Q264 243 272 250" fill="none" stroke="#3b241c" strokeWidth="3" strokeLinecap="round" />
          {/* Nose */}
          <path d="M250 255 Q253 264 249 266" fill="none" stroke="#d69a6b" strokeWidth="2" strokeLinecap="round" />
          {/* Smile */}
          <path d="M237 272 Q250 283 263 272" fill="none" stroke="#b0542f" strokeWidth="3" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="227" cy="265" rx="6" ry="3.4" fill="#ff9db8" opacity="0.4" />
          <ellipse cx="273" cy="265" rx="6" ry="3.4" fill="#ff9db8" opacity="0.4" />

          {/* Turban */}
          <path d="M216 226 C216 174 284 174 284 226 C270 238 230 238 216 226 Z" fill="#7a2142" />
          <path d="M224 180 Q234 202 222 226" fill="none" stroke="#5d1833" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d="M258 178 Q250 204 264 226" fill="none" stroke="#5d1833" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <rect x="213" y="216" width="74" height="10" rx="5" fill={GOLD} />
          <path d="M250 148 Q257 158 250 168 Q243 158 250 148 Z" fill={GOLD} />
          <circle cx="250" cy="157" r="3" fill="#ffffff" />
        </g>

        {/* ──────────────── BRIDE (right) ──────────────── */}
        <g>
          {/* Feet with anklets */}
          <ellipse cx="383" cy="465" rx="13" ry="7" fill={SKIN} />
          <ellipse cx="417" cy="465" rx="13" ry="7" fill={SKIN} />
          <path d="M374 462 Q380 456 386 461" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
          <path d="M408 461 Q414 456 420 462" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />

          {/* Saree skirt */}
          <path d="M360 352 L352 468 L448 468 L440 352 Z" fill="url(#sareeGrad)" />
          {/* Gold hem */}
          <path d="M352 456 L352 468 L448 468 L448 456 Z" fill={GOLD} />
          <path d="M352 452 L448 452" stroke="#ffcf8a" strokeWidth="2" />
          {/* Pleats */}
          <path d="M378 358 L374 456" fill="none" stroke="#ffd7a0" strokeWidth="2" opacity="0.85" />
          <path d="M400 358 L400 458" fill="none" stroke="#ffd7a0" strokeWidth="2" opacity="0.85" />
          <path d="M422 358 L426 456" fill="none" stroke="#ffd7a0" strokeWidth="2" opacity="0.85" />

          {/* Blouse */}
          <path d="M362 300 L358 352 L442 352 L438 300 Z" fill="#c21f5f" />
          <path d="M362 300 Q400 318 438 300" fill="none" stroke={GOLD} strokeWidth="3.5" />
          <path d="M358 352 L442 352" stroke={GOLD} strokeWidth="2.5" />

          {/* Pallu over right shoulder */}
          <path
            d="M438 298 Q456 314 448 360 L432 394 L420 390 Q430 352 432 316 Z"
            fill="url(#palluGrad)"
          />
          <path d="M436 300 Q452 318 445 362" fill="none" stroke="#a80f4e" strokeWidth="3" opacity="0.8" />
          <path d="M432 316 Q434 352 426 388" fill="none" stroke="#a80f4e" strokeWidth="2.5" opacity="0.75" />
          {/* Pallu hanging end */}
          <path d="M432 388 L426 402 L438 404 Z" fill={GOLD} />

          {/* Right arm at side */}
          <path d="M432 306 Q450 320 448 356 L434 354 Q436 326 422 316 Z" fill="#c21f5f" />
          <circle cx="443" cy="366" r="9" fill={SKIN} />
          <circle cx="438" cy="360" r="3" fill="none" stroke={GOLD} strokeWidth="2.4" />
          <circle cx="443" cy="366" r="3" fill="none" stroke={GOLD} strokeWidth="2.4" />

          {/* Left arm reaching toward groom */}
          <path d="M372 308 Q346 320 340 374 L354 378 Q360 330 380 320 Z" fill="#c21f5f" />
          <rect x="342" y="372" width="14" height="11" rx="5" fill="#ffd7a0" />

          {/* Neck + jewelry */}
          <rect x="386" y="260" width="28" height="42" rx="12" fill={SKIN} />
          <rect x="384" y="290" width="32" height="7" rx="3.5" fill={GOLD} />
          <path d="M400 297 L400 322" stroke={GOLD} strokeWidth="2.2" />
          <circle cx="400" cy="327" r="4.5" fill={GOLD} />
          <circle cx="400" cy="327" r="2" fill="#e0136a" />

          {/* Head */}
          <ellipse cx="400" cy="246" rx="30" ry="36" fill={SKIN} />
          {/* Back hair */}
          <path
            d="M370 244 C364 286 376 322 386 332 L414 332 C424 322 436 286 430 244 Q430 214 400 212 Q370 214 370 244 Z"
            fill="#2a1418"
          />
          <circle cx="377" cy="250" r="7" fill={SKIN} />
          <circle cx="423" cy="250" r="7" fill={SKIN} />
          {/* Front hair + parting */}
          <path d="M372 240 Q400 218 428 240 L428 214 Q400 202 372 214 Z" fill="#2a1418" />
          <path d="M400 210 L400 238" stroke="#1b0d10" strokeWidth="2" />
          {/* Bun with jasmine */}
          <circle cx="400" cy="182" r="16" fill="#241317" />
          <circle cx="393" cy="177" r="4.4" fill="#ffffff" />
          <circle cx="401" cy="172" r="4.4" fill="#ffffff" />
          <circle cx="408" cy="177" r="4.4" fill="#ffffff" />
          <circle cx="397" cy="186" r="4.4" fill="#ffffff" />
          <circle cx="406" cy="186" r="4.4" fill="#ffffff" />
          <circle cx="392" cy="172" r="1.6" fill="#f4bd43" />
          <circle cx="402" cy="169" r="1.6" fill="#f4bd43" />
          {/* Maang tikka */}
          <path d="M400 210 L400 228" stroke={GOLD} strokeWidth="1.6" />
          <path d="M400 232 L395 237 L400 242 L405 237 Z" fill={GOLD} />
          <circle cx="400" cy="237" r="1.8" fill="#e0136a" />
          {/* Bindi */}
          <circle cx="400" cy="240" r="2.6" fill="#e0136a" />
          {/* Brows */}
          <path d="M383 237 Q389 231 395 236" fill="none" stroke="#24161c" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M405 236 Q411 231 417 237" fill="none" stroke="#24161c" strokeWidth="2.3" strokeLinecap="round" />
          {/* Happy closed eyes */}
          <path d="M384 250 Q390 243 396 250" fill="none" stroke="#3b241c" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M404 250 Q410 243 416 250" fill="none" stroke="#3b241c" strokeWidth="2.8" strokeLinecap="round" />
          {/* Nose + nose stud */}
          <path d="M400 255 Q402 263 399 265" fill="none" stroke="#d69a6b" strokeWidth="2" strokeLinecap="round" />
          <circle cx="394" cy="263" r="1.5" fill="#f4bd43" />
          {/* Smile */}
          <path d="M389 272 Q400 284 411 272" fill="none" stroke="#b0542f" strokeWidth="3" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="383" cy="266" rx="5.6" ry="3.2" fill="#ff9db8" opacity="0.45" />
          <ellipse cx="417" cy="266" rx="5.6" ry="3.2" fill="#ff9db8" opacity="0.45" />
          {/* Jhumka earrings */}
          <circle cx="373" cy="256" r="3" fill={GOLD} />
          <path d="M373 259 Q369 266 373 271" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="427" cy="256" r="3" fill={GOLD} />
          <path d="M427 259 Q431 266 427 271" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* Clasped hands at centre */}
        <g>
          <ellipse cx="324" cy="390" rx="17" ry="13" fill={SKIN} />
          <path d="M310 384 Q322 398 336 386" fill="none" stroke="#e2a06b" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <ellipse cx="341" cy="389" rx="5.5" ry="7" fill="none" stroke={GOLD} strokeWidth="2.6" />
          <ellipse cx="347" cy="389" rx="5.5" ry="7" fill="none" stroke={GOLD} strokeWidth="2.6" />
        </g>

        {/* ──────────────── FLOATING DECORATIONS ──────────────── */}
        <motion.g {...float}>
          <Heart x={118} y={168} size={20} fill="#ff5f9e" delay={0} float={!reduce} />
          <Heart x={556} y={150} size={15} fill="#ff7ab3" delay={1.2} float={!reduce} />
          <Heart x={324} y={74} size={13} fill="#f43f5e" delay={0.6} float={!reduce} />
        </motion.g>

        <motion.g {...ringsAnim}>
          <g transform="translate(258 96)">
            <circle cx="0" cy="0" r="11" fill="none" stroke={GOLD} strokeWidth="4" />
            <circle cx="12" cy="2" r="11" fill="none" stroke={GOLD} strokeWidth="4" />
            <path d="M20 -8 L22 -4 L20 0 L18 -4 Z" fill="#bfe6ff" stroke="#7fb8e0" strokeWidth="1" />
            <path d="M20 -8 L22 -4 L20 0 Z" fill="#e8f6ff" />
          </g>
        </motion.g>

        <motion.g {...float}>
          <Sparkle x={148} y={240} size={13} delay={0.3} />
          <Sparkle x={516} y={240} size={11} delay={1} />
          <Sparkle x={276} y={120} size={10} delay={0.8} />
          <Sparkle x={396} y={106} size={9} delay={1.6} />
          <Sparkle x={168} y={430} size={10} delay={0.5} />
          <Sparkle x={492} y={430} size={10} delay={1.3} />
        </motion.g>

        <motion.g {...float}>
          <Petal x={92} y={330} size={10} rotate={20} fill="#ffb3c8" delay={0.4} drift={!reduce} />
          <Petal x={566} y={310} size={11} rotate={-15} fill="#fff1f5" delay={1.1} drift={!reduce} />
          <Petal x={150} y={470} size={9} rotate={40} fill="#ffd6e0" delay={0.9} drift={!reduce} />
          <Petal x={500} y={478} size={9} rotate={-30} fill="#ffb3c8" delay={0.2} drift={!reduce} />
          <Petal x={272} y={485} size={8} rotate={10} fill="#fff1f5" delay={1.5} drift={!reduce} />
          <Petal x={430} y={488} size={8} rotate={-10} fill="#ffd6e0" delay={0.7} drift={!reduce} />
          <Petal x={230} y={168} size={8} rotate={-20} fill="#ffd6e0" delay={1.8} drift={!reduce} />
          <Petal x={452} y={150} size={8} rotate={25} fill="#fff1f5" delay={0.1} drift={!reduce} />
        </motion.g>
      </svg>
    </div>
  );
}
