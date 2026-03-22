import { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Link } from 'react-router-dom';

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Dynamic resizing
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth > 768 ? window.innerWidth / 2.2 : window.innerWidth - 64,
        height: 500
      });
    };
    window.addEventListener('resize', updateSize);
    updateSize();

    // Fetch live graph data from FastAPI
    fetch('http://127.0.0.1:8000/graph/export')
      .then(res => res.json())
      .then(data => {
        if (data.nodes && data.links) {
          setGraphData(data);
        } else {
          // Fallback static
          setGraphData({
            nodes: [
              { id: "Python", group: 1, val: 25 },
              { id: "FastAPI", group: 1, val: 15 },
              { id: "React", group: 2, val: 20 },
              { id: "Tailwind", group: 2, val: 12 },
              { id: "AWS", group: 4, val: 15 }
            ],
            links: [
              { source: "Python", target: "FastAPI" },
              { source: "React", target: "Tailwind" }
            ]
          });
        }
      })
      .catch(err => console.error("Could not fetch graph data:", err));

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />

      <section className="flex-1 flex flex-col md:flex-row items-center p-8 md:p-16 gap-12 z-10 w-full max-w-7xl mx-auto">
        
        {/* Left Side: Hero Text */}
        <div className="flex-1 flex flex-col gap-8 w-full">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            What is your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
              dream role?
            </span>
          </h1>
          <p className="text-xl text-slate-300 font-light max-w-lg leading-relaxed">
            A next-generation internship marketplace powered by Graph Theory. We map your unique skills directly to industry demands in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Backend Developer" 
              className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg placeholder:text-slate-500 shadow-inner"
            />
            <Link 
              to="/student"
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center"
            >
              Explore Paths
            </Link>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-8 border-t border-slate-800/80 pt-8">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl font-black text-indigo-400 tracking-tighter">120+</div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-semibold">Students matched<br/>this week</div>
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl font-black text-cyan-400 tracking-tighter">FastAPI</div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-semibold">Top trending skill<br/>in Turkey</div>
            </div>
          </div>
        </div>

        {/* Right Side: Graph Visual */}
        <div className="w-full md:w-auto flex-1 flex items-center justify-center relative">
          <div className="w-full h-[500px] border border-slate-700/50 rounded-3xl overflow-hidden relative bg-slate-800/30 backdrop-blur-sm shadow-2xl flex items-center justify-center group pointer-events-auto">
            <div className="absolute inset-0 z-0 opacity-80 transition-opacity group-hover:opacity-100">
               <ForceGraph2D
                 graphData={graphData}
                 width={dimensions.width}
                 height={dimensions.height}
                 nodeLabel="id"
                 nodeAutoColorBy="group"
                 nodeRelSize={6}
                 linkWidth={2}
                 linkColor={() => '#334155'}
                 linkDirectionalParticles={3}
                 linkDirectionalParticleSpeed={0.005}
                 linkDirectionalParticleColor={() => '#60a5fa'}
                 backgroundColor="rgba(0,0,0,0)"
               />
            </div>
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur text-xs px-4 py-2 rounded-full border border-slate-700 z-10 text-slate-300 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Live Skill-Graph
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
