import { useEffect, useState } from 'react';
import { site } from './data/site.js';
import { loadPortfolio } from './lib/github.js';
import Nav from './components/Nav.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import useSmoothScroll from './hooks/useSmoothScroll.js';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import About from './components/About.jsx';
import Contributions from './components/Contributions.jsx';
import Projects from './components/Projects.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [data, setData] = useState(null);

  useSmoothScroll();

  useEffect(() => {
    let alive = true;
    loadPortfolio(site.githubUser).then((result) => {
      if (alive) setData(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <ScrollProgress />

      <div className="bg-canvas" aria-hidden="true">
        <div className="grid" />
        <span className="blob a" />
        <span className="blob b" />
      </div>

      <Nav />

      <main>
        <Hero data={data} />
        <Marquee />
        <Projects data={data} />
        <About data={data} />
        <Contributions contributions={data?.contributions ?? null} />
        <Contact />
        <Marquee items={['Let’s build', 'Say hello', 'Ship it', 'React', 'Node.js']} reverse />
      </main>

      <Footer />
    </>
  );
}
