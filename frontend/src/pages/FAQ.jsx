export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto w-full p-8 py-16 text-slate-300">
      <h1 className="text-5xl font-extrabold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 text-center">
        Knowledge Base
      </h1>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">For Students</h2>
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-indigo-400 mb-2">How does the matching percentage work?</h3>
              <p>Our matching engine doesn't just do keyword matching. We use FalkorDB Graph Theory to analyze paths. If a job requires "Next.js" and you only have "React", the engine knows they are 1 edge away (`RELATED_TO`), granting you a partial match rather than 0%.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">Technical Documentation</h2>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Why FalkorDB over MySQL?</h3>
            <p className="mb-4">
              Traditional relational databases (MySQL, PostgreSQL) require heavy `JOIN` operations to traverse complex many-to-many relationships (e.g., millions of students mapped to thousands of skills and interrelated industries).
            </p>
            <p>
              By using FalkorDB, relationships are treated as first-class citizens. Traversal across paths (Student -&gt; HAS_SKILL -&gt; RELATED_TO -&gt; REQUIRES_SKILL -&gt; Internship) is executed in <strong>O(1)</strong> time per edge, drastically reducing latency for real-time heatmap generation and skill-gap analysis.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">Contact Us</h2>
          <form className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-400">Reason for Contact</label>
              <select className="bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500">
                <option>Technical Support</option>
                <option>Partnership</option>
                <option>Data Privacy</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-400">Message</label>
              <textarea rows="4" className="bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="Your message here..."></textarea>
            </div>
            <button type="button" className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
              Send Message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
