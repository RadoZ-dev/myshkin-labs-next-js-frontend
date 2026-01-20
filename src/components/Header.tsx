'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import catImage from '@/assets/img/cat.png';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// Register the plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(MorphSVGPlugin);
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const path3Ref = useRef<SVGPathElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);
  const catImageRef = useRef<HTMLDivElement>(null);

  // Hamburger paths (three lines)
  const hamburgerPaths = {
    path1: "M 3.675781 4.644531 C 27.121094 4.863281 28.5 5.152344 28.933594 5.734375 C 29.226562 5.953125 29.296875 6.386719 29.226562 6.605469 C 29.082031 6.824219 28.5 7.183594 28.28125 7.113281 C 27.992188 7.039062 27.554688 6.386719 27.628906 6.097656 C 27.703125 5.878906 28.71875 5.515625 28.933594 5.660156 C 29.082031 5.804688 28.863281 7.039062 28.644531 7.113281 C 28.425781 7.183594 27.554688 6.460938 27.628906 6.167969 C 27.703125 5.953125 28.789062 5.515625 28.933594 5.734375 C 29.152344 5.878906 29.152344 6.675781 28.789062 7.039062 C 27.917969 7.839844 23.636719 7.402344 20.371094 7.476562 C 15.796875 7.476562 5.855469 7.984375 3.675781 6.824219 C 3.023438 6.460938 2.589844 5.878906 2.660156 5.515625 C 2.660156 5.152344 3.675781 4.644531 3.675781 4.644531",
    path2: "M 3.75 14.878906 C 21.53125 15.75 25.015625 14.734375 26.539062 15.167969 C 27.265625 15.386719 27.484375 16.113281 27.917969 16.183594 C 28.355469 16.257812 29.007812 15.675781 29.226562 15.894531 C 29.445312 15.96875 29.589844 16.621094 29.445312 16.839844 C 29.371094 17.054688 28.789062 17.347656 28.574219 17.273438 C 28.28125 17.203125 27.847656 16.546875 27.917969 16.257812 C 27.992188 16.039062 28.71875 15.605469 28.933594 15.675781 C 29.226562 15.75 29.589844 16.476562 29.515625 16.765625 C 29.296875 17.273438 27.628906 17.492188 26.394531 17.78125 C 24.363281 18.144531 21.460938 18.363281 18.410156 18.363281 C 14.417969 18.289062 6.796875 17.855469 4.476562 17.054688 C 3.675781 16.765625 3.023438 16.476562 2.953125 16.039062 C 2.878906 15.75 3.75 14.878906 3.75 14.878906",
    path3: "M 3.316406 24.097656 C 16.234375 24.167969 20.007812 23.082031 22.839844 23.007812 C 25.015625 23.007812 27.773438 23.007812 28.71875 23.515625 C 29.082031 23.734375 29.226562 24.097656 29.226562 24.386719 C 29.226562 24.605469 28.863281 25.113281 28.574219 25.113281 C 28.355469 25.183594 27.703125 24.75 27.628906 24.460938 C 27.554688 24.167969 28.066406 23.589844 28.355469 23.515625 C 28.574219 23.445312 29.082031 23.734375 29.152344 24.023438 C 29.296875 24.316406 29.152344 24.75 28.71875 25.113281 C 27.121094 26.203125 17.976562 26.855469 13.476562 26.925781 C 9.992188 27 5.710938 26.78125 3.96875 26.203125 C 3.242188 25.910156 2.589844 25.546875 2.515625 25.183594 C 2.515625 24.824219 3.316406 24.097656 3.316406 24.097656"
  };

  // Close (X) paths (two diagonal lines)
  const closePaths = {
    path1: "M 27.339844 3.917969 C 15.507812 14.804688 10.425781 22.28125 7.523438 24.75 C 6.074219 25.984375 4.621094 27.144531 3.894531 27 C 3.460938 26.925781 2.953125 25.984375 3.097656 25.765625 C 3.167969 25.546875 3.96875 25.402344 4.257812 25.546875 C 4.476562 25.695312 4.546875 26.566406 4.402344 26.710938 C 4.183594 26.855469 3.097656 26.710938 2.953125 26.347656 C 2.660156 25.621094 4.910156 23.296875 6.507812 21.339844 C 9.121094 18.074219 13.984375 12.703125 17.394531 9.289062 C 20.082031 6.605469 23.054688 3.265625 25.089844 2.46875 C 26.105469 2.105469 27.484375 2.03125 27.773438 2.46875 C 27.992188 2.683594 27.339844 3.917969 27.339844 3.917969",
    path2: "M 3.894531 2.25 C 11.152344 9.144531 16.304688 12.195312 19.644531 15.097656 C 22.765625 17.710938 26.394531 21.195312 27.917969 23.296875 C 28.644531 24.316406 29.445312 25.402344 29.226562 25.984375 C 29.152344 26.417969 28.210938 26.855469 27.992188 26.78125 C 27.773438 26.636719 27.628906 25.765625 27.773438 25.546875 C 27.917969 25.332031 28.789062 25.257812 28.933594 25.402344 C 29.082031 25.621094 28.789062 26.855469 28.574219 26.855469 C 28.355469 26.925781 27.628906 25.839844 27.703125 25.621094 C 27.847656 25.476562 29.152344 25.621094 29.226562 25.839844 C 29.226562 25.984375 28.574219 26.78125 27.992188 26.78125 C 26.25 26.636719 21.53125 20.03125 17.976562 17.054688 C 14.492188 14.082031 9.703125 11.324219 6.945312 8.855469 C 4.984375 7.113281 2.878906 5.226562 2.445312 3.917969 C 2.152344 3.195312 2.226562 2.394531 2.515625 2.105469 C 2.734375 1.886719 3.894531 2.25 3.894531 2.25",
    path3: "M 3.894531 2.25 C 11.152344 9.144531 16.304688 12.195312 19.644531 15.097656 C 22.765625 17.710938 26.394531 21.195312 27.917969 23.296875 C 28.644531 24.316406 29.445312 25.402344 29.226562 25.984375 C 29.152344 26.417969 28.210938 26.855469 27.992188 26.78125 C 27.773438 26.636719 27.628906 25.765625 27.773438 25.546875 C 27.917969 25.332031 28.789062 25.257812 28.933594 25.402344 C 29.082031 25.621094 28.789062 26.855469 28.574219 26.855469 C 28.355469 26.925781 27.628906 25.839844 27.703125 25.621094 C 27.847656 25.476562 29.152344 25.621094 29.226562 25.839844 C 29.226562 25.984375 28.574219 26.78125 27.992188 26.78125 C 26.25 26.636719 21.53125 20.03125 17.976562 17.054688 C 14.492188 14.082031 9.703125 11.324219 6.945312 8.855469 C 4.984375 7.113281 2.878906 5.226562 2.445312 3.917969 C 2.152344 3.195312 2.226562 2.394531 2.515625 2.105469 C 2.734375 1.886719 3.894531 2.25 3.894531 2.25" 
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;

    // Animate menu closing before state change
    if (!newState && menuPanelRef.current && catImageRef.current) {
      const timeline = gsap.timeline({
        onComplete: () => setIsMenuOpen(false)
      });

      // Animate cat image out
      timeline.to(
        catImageRef.current,
        {
          bottom: '-160px',
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        },
        0
      );

      // Collapse menu panel
      timeline.to(
        menuPanelRef.current,
        {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        },
        0
      );
    } else {
      setIsMenuOpen(newState);
    }

    // Morph animation for burger icon - synchronized with menu duration (0.4s)
    if (path1Ref.current && path2Ref.current && path3Ref.current) {
      const timeline = gsap.timeline();
      
      if (newState) {
        // Morphing to X (close icon) - 0.4s total
        timeline
          .to([path1Ref.current, path2Ref.current, path3Ref.current], {
            opacity: 0,
            duration: 0.2,
            ease: "power2.in"
          })
          .set(path1Ref.current, { attr: { d: closePaths.path1 } })
          .set(path2Ref.current, { attr: { d: closePaths.path2 } })
          .set(path3Ref.current, { attr: { d: closePaths.path3 }, opacity: 0 })
          .to([path1Ref.current, path2Ref.current], {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          });
      } else {
        // Morphing back to hamburger - 0.4s total
        timeline
          .to([path1Ref.current, path2Ref.current], {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
          })
          .set(path1Ref.current, { attr: { d: hamburgerPaths.path1 } })
          .set(path2Ref.current, { attr: { d: hamburgerPaths.path2 } })
          .set(path3Ref.current, { attr: { d: hamburgerPaths.path3 } })
          .to([path1Ref.current, path2Ref.current, path3Ref.current], {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out"
          });
      }
    }
  };

  // Animate menu opening
  useEffect(() => {
    if (isMenuOpen && menuPanelRef.current && menuItemsRef.current && catImageRef.current) {
      const menuLinks = menuItemsRef.current.querySelectorAll('a');

      // Animate menu panel
      gsap.fromTo(
        menuPanelRef.current,
        { 
          height: 0,
          opacity: 0
        },
        { 
          height: 'calc(100vh - 80px)',
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }
      );

      // Stagger menu items
      gsap.fromTo(
        menuLinks,
        { 
          opacity: 0,
          x: -20
        },
        { 
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          delay: 0.1,
          ease: "power2.out"
        }
      );

      // Animate cat image - slide out fully, then back to 50%
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          catImageRef.current,
          { 
            bottom: '-160px',
            right: '20px',
            opacity: 0
          },
          { 
            bottom: '-20px',
            opacity: 1,
            duration: 1,
            delay: 0.15,
            ease: "power2.out"
          }
        )
        .to(
          catImageRef.current,
          {
            bottom: '-80px',
            duration: 1,
            ease: "power2.inOut"
          }
        );
    }
  }, [isMenuOpen]);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Experiments', href: '/experiments' },
    { label: 'Notes', href: '/notes' },
    { label: 'Instruments', href: '/instruments' },
    { label: 'Releases', href: '/releases' },
    { label: 'Signal', href: '/signal' },
  ];

  return (
    <header className="myshkin-labs-header bg-white shadow-md py-4 sticky top-0 z-50">
      <nav className="max-w-7xl px-4" style={{ margin: '0 auto' }}>
        <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="myshkin-labs-header__logo text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
                MИШKiN LAБS
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="myshkin-labs-header__top-menu myshkin-labs-header__top-menu--desktop hidden lg:flex lg:items-center lg:space-x-8 lg:p-0 ">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 px-3 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMenu}
                type="button"
                className="myshkin-labs-header__burger-dropdown-button inline-flex items-center justify-center p-2 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset transition-colors"
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
              >
                <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open main menu'}</span>
                <svg
                  ref={svgRef}
                  className="block h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 30 30.000001"
                  fill="currentColor"
                >
                  <path
                    ref={path1Ref}
                    d="M 3.675781 4.644531 C 27.121094 4.863281 28.5 5.152344 28.933594 5.734375 C 29.226562 5.953125 29.296875 6.386719 29.226562 6.605469 C 29.082031 6.824219 28.5 7.183594 28.28125 7.113281 C 27.992188 7.039062 27.554688 6.386719 27.628906 6.097656 C 27.703125 5.878906 28.71875 5.515625 28.933594 5.660156 C 29.082031 5.804688 28.863281 7.039062 28.644531 7.113281 C 28.425781 7.183594 27.554688 6.460938 27.628906 6.167969 C 27.703125 5.953125 28.789062 5.515625 28.933594 5.734375 C 29.152344 5.878906 29.152344 6.675781 28.789062 7.039062 C 27.917969 7.839844 23.636719 7.402344 20.371094 7.476562 C 15.796875 7.476562 5.855469 7.984375 3.675781 6.824219 C 3.023438 6.460938 2.589844 5.878906 2.660156 5.515625 C 2.660156 5.152344 3.675781 4.644531 3.675781 4.644531"
                  />
                  <path
                    ref={path2Ref}
                    d="M 3.75 14.878906 C 21.53125 15.75 25.015625 14.734375 26.539062 15.167969 C 27.265625 15.386719 27.484375 16.113281 27.917969 16.183594 C 28.355469 16.257812 29.007812 15.675781 29.226562 15.894531 C 29.445312 15.96875 29.589844 16.621094 29.445312 16.839844 C 29.371094 17.054688 28.789062 17.347656 28.574219 17.273438 C 28.28125 17.203125 27.847656 16.546875 27.917969 16.257812 C 27.992188 16.039062 28.71875 15.605469 28.933594 15.675781 C 29.226562 15.75 29.589844 16.476562 29.515625 16.765625 C 29.296875 17.273438 27.628906 17.492188 26.394531 17.78125 C 24.363281 18.144531 21.460938 18.363281 18.410156 18.363281 C 14.417969 18.289062 6.796875 17.855469 4.476562 17.054688 C 3.675781 16.765625 3.023438 16.476562 2.953125 16.039062 C 2.878906 15.75 3.75 14.878906 3.75 14.878906"
                  />
                  <path
                    ref={path3Ref}
                    d="M 3.316406 24.097656 C 16.234375 24.167969 20.007812 23.082031 22.839844 23.007812 C 25.015625 23.007812 27.773438 23.007812 28.71875 23.515625 C 29.082031 23.734375 29.226562 24.097656 29.226562 24.386719 C 29.226562 24.605469 28.863281 25.113281 28.574219 25.113281 C 28.355469 25.183594 27.703125 24.75 27.628906 24.460938 C 27.554688 24.167969 28.066406 23.589844 28.355469 23.515625 C 28.574219 23.445312 29.082031 23.734375 29.152344 24.023438 C 29.296875 24.316406 29.152344 24.75 28.71875 25.113281 C 27.121094 26.203125 17.976562 26.855469 13.476562 26.925781 C 9.992188 27 5.710938 26.78125 3.96875 26.203125 C 3.242188 25.910156 2.589844 25.546875 2.515625 25.183594 C 2.515625 24.824219 3.316406 24.097656 3.316406 24.097656"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Panel - Absolute positioned to overlay content */}
        {isMenuOpen && (
          <div 
            ref={menuPanelRef}
            className="myshkin-labs-header__top-menu myshkin-labs-header__top-menu--mobile lg:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40 overflow-hidden"
            style={{ height: 0, opacity: 0 }}
          >
            <div 
              ref={menuItemsRef}
              className="myshkin-labs-header__top-menu-content px-2 pt-2 pb-3 space-y-1 sm:px-3"
            >
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div ref={catImageRef} className="absolute">
              <Image 
                src={catImage}
                alt="Cat" 
                width={160}
                height={160}
                className="myshkin-labs-header__cat-image pointer-events-none"
                priority
              />
            </div>
          </div>
        )}
    </header>
  );
}
