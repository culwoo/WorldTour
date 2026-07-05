import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import GridBackground from '../components/GridBackground';
import styles from '../styles/Home.module.scss';

gsap.registerPlugin(useGSAP);

interface Project {
  id: number;
  title: string;
  status: 'live' | 'coming-soon';
  path: string;
  category: string;
  accent: string;
  preview?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'World Tour',
    status: 'live',
    path: '/world-tour',
    category: 'Photography Exhibition',
    accent: '#c4a35a',
    preview: '/images/IMG_5031.webp',
  },
  {
    id: 2,
    title: 'Orbit',
    status: 'live',
    path: '/orbit',
    category: 'Revolving Archive',
    accent: '#5a8ec4',
    preview: '/images/IMG_6613.webp',
  },
  {
    id: 3,
    title: 'Night Studies',
    status: 'coming-soon',
    path: '#',
    category: 'Photography Series',
    accent: '#8e5ac4',
  },
];

const Home = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  // Live clock (KST)
  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Seoul',
        }),
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Mouse-following gradient orb + floating preview
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const onMove = (e: MouseEvent) => {
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: e.clientX - 200,
          y: e.clientY - 200,
          duration: 1.2,
          ease: 'power3.out',
        });
      }
      if (floatingRef.current) {
        gsap.to(floatingRef.current, {
          x: e.clientX - 150,
          y: e.clientY - 220,
          duration: 0.8,
          ease: 'power3.out',
        });
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Shift orb color to match hovered project
  useEffect(() => {
    if (!orbRef.current) return;
    const color = hoveredProject?.accent || '#c4a35a';
    orbRef.current.style.background = `radial-gradient(circle, ${color}18 0%, transparent 70%)`;
  }, [hoveredProject]);

  // GSAP entrance (useGSAP handles React StrictMode correctly)
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const chars = titleRef.current?.querySelectorAll('.char');
      if (chars) {
        gsap.fromTo(
          chars,
          { y: 100, opacity: 0, rotateX: -40 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1.2, ease: 'power4.out', stagger: 0.04, delay: 0.2 },
        );
      }
      gsap.fromTo(`.${styles.subtitle}`, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.7 });
      gsap.fromTo(`.${styles.divider}`, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out', delay: 0.9 });
      gsap.fromTo(
        `.${styles.projectLink}`,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 1.0 },
      );
      gsap.fromTo(
        `.${styles.navItem}`,
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.3 },
      );
      gsap.fromTo(
        `.${styles.footerItem}`,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 1.2 },
      );
    },
    { scope: containerRef },
  );

  const handleClick = useCallback(
    (project: Project) => {
      if (project.status === 'live') navigate(project.path);
    },
    [navigate],
  );

  const titleText = 'LifeOfKwak';

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Background effects */}
      <GridBackground />
      <div ref={orbRef} className={styles.gradientOrb} />
      <div className={styles.noiseOverlay} />

      {/* Floating preview image (follows cursor, appears on hover) */}
      <div
        ref={floatingRef}
        className={`${styles.floatingPreview} ${hoveredProject?.preview ? styles.visible : ''}`}
      >
        {hoveredProject?.preview && (
          <img src={hoveredProject.preview} alt="" />
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <span className={`${styles.navItem} ${styles.brand}`}>LifeOfKwak</span>
        <div className={styles.navRight}>
          <span className={`${styles.navItem} ${styles.location}`}>Seoul, KR</span>
          <span className={`${styles.navItem} ${styles.time}`}>{currentTime}</span>
        </div>
      </nav>

      {/* Center */}
      <main className={styles.main}>
        <h1 ref={titleRef} className={styles.title}>
          {titleText.split('').map((c, i) => (
            <span key={i} className="char" style={{ display: 'inline-block' }}>
              {c}
            </span>
          ))}
        </h1>
        <p className={styles.subtitle}>Creative Visual Portfolio</p>

        <div className={styles.divider} />

        <nav
          className={`${styles.projectNav} ${hoveredProject ? styles.hasHover : ''}`}
        >
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`${styles.projectLink} ${project.status === 'live' ? styles.live : styles.soon} ${hoveredProject?.id === project.id ? styles.active : ''}`}
              style={{ '--accent': project.accent } as React.CSSProperties}
              onClick={() => handleClick(project)}
              onMouseEnter={() => setHoveredProject(project)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <span className={styles.projectIndex}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.projectTitle}>{project.title}</span>
              <span className={styles.projectMeta}>
                {project.status === 'live' ? (
                  <>
                    <span className={styles.dot} />
                    <span>{project.category}</span>
                  </>
                ) : (
                  <span>Coming Soon</span>
                )}
              </span>
            </div>
          ))}
        </nav>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerItem}>&copy; 2024 LifeOfKwak</span>
        <span className={styles.footerItem}>All Rights Reserved</span>
      </footer>
    </div>
  );
};

export default Home;
