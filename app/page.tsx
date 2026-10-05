'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from './AuthPanel';

type BookId =
  | 'interne'
  | 'iade'
  | 'ide-rea';

export default function HomePage() {
  const router = useRouter();

  const [showAuth, setShowAuth] =
    useState(false);

  const [hoveredBook, setHoveredBook] =
    useState<BookId | null>(null);

  function polygonStyle(
    book: BookId
  ): React.CSSProperties {
    const active =
      hoveredBook === book;

    return {
      fill: active
        ? 'rgba(255, 218, 110, 0.24)'
        : 'rgba(255,255,255,0.001)',

      stroke: active
        ? 'rgba(255, 225, 145, 0.75)'
        : 'transparent',

      strokeWidth: 2,

      cursor: 'pointer',

      transition:
        'fill 140ms ease, stroke 140ms ease',

      filter: active
        ? 'drop-shadow(0 0 3px rgba(255, 205, 80, 0.55))'
        : 'none',
    };
  }

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',

        backgroundColor: '#f8f4ec',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',

        overflow: 'hidden',
      }}
    >
      {/* COMPTE */}

      <div
        style={{
          position: 'fixed',

          top: 18,
          right: 18,

          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowAuth(
              (value) => !value
            )
          }
          style={{
            backgroundColor:
              'rgba(255,255,255,0.95)',

            border:
              '1px solid rgba(0,0,0,0.14)',

            borderRadius: 30,

            padding:
              '10px 18px',

            cursor: 'pointer',

            fontWeight: 600,

            boxShadow:
              '0 4px 15px rgba(0,0,0,0.08)',
          }}
        >
          Compte
        </button>

        {showAuth && (
          <div
            style={{
              position: 'absolute',

              top: 52,
              right: 0,

              width: 340,

              maxWidth:
                'calc(100vw - 36px)',

              backgroundColor: 'white',

              padding: 18,

              borderRadius: 16,

              boxShadow:
                '0 15px 45px rgba(0,0,0,0.18)',
            }}
          >
            <AuthPanel />
          </div>
        )}
      </div>

      {/* IMAGE + ZONES CLIQUABLES */}

      <div
        style={{
          position: 'relative',

          width:
            'min(100vw, calc(100vh * 1672 / 941))',

          height:
            'min(100vh, calc(100vw * 941 / 1672))',

          maxWidth: 1672,
          maxHeight: 941,

          flexShrink: 0,
        }}
      >
        <img
          src="/marguez-home.png"
          alt="MARGUEZ - Médecine périopératoire, Anesthésie et Réanimation"
          draggable={false}
          style={{
            display: 'block',

            width: '100%',
            height: '100%',

            objectFit: 'contain',

            userSelect: 'none',
          }}
        />

        {/* CALQUE SVG EXACTEMENT SUPERPOSÉ À L'IMAGE */}

        <svg
          viewBox="0 0 1672 941"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',

            inset: 0,

            width: '100%',
            height: '100%',

            zIndex: 10,
          }}
        >
          {/* INTERNE */}

          <polygon
            points="
              1270,662
              1588,646
              1590,704
              1271,721
            "
            style={polygonStyle(
              'interne'
            )}
            onMouseEnter={() =>
              setHoveredBook(
                'interne'
              )
            }
            onMouseLeave={() =>
              setHoveredBook(null)
            }
            onClick={() =>
              router.push(
                '/categorie/interne'
              )
            }
          />

          {/* IADE */}

          <polygon
            points="
              1272,744
              1589,727
              1591,785
              1272,803
            "
            style={polygonStyle(
              'iade'
            )}
            onMouseEnter={() =>
              setHoveredBook(
                'iade'
              )
            }
            onMouseLeave={() =>
              setHoveredBook(null)
            }
            onClick={() =>
              router.push(
                '/categorie/iade'
              )
            }
          />

          {/* IDE DE RÉA */}

          <polygon
            points="
              1273,826
              1591,808
              1592,865
              1274,884
            "
            style={polygonStyle(
              'ide-rea'
            )}
            onMouseEnter={() =>
              setHoveredBook(
                'ide-rea'
              )
            }
            onMouseLeave={() =>
              setHoveredBook(null)
            }
            onClick={() =>
              router.push(
                '/categorie/ide-rea'
              )
            }
          />
        </svg>
      </div>
    </main>
  );
}