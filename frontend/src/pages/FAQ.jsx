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
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-indigo-400 mb-2">Is Two-Factor Authentication required?</h3>
              <p>Yes. To protect user data, we highly encourage 2FA during registration and password changes. You can set it up seamlessly using any authenticator app (like Google Authenticator or Authy) on your phone.</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-indigo-400 mb-2">Can I apply to multiple internships at once?</h3>
              <p>Yes! There is no hard limit to the number of active applications you can have. You can track all of your current applications in the Kanban board on your dashboard.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">For Employers</h2>
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-2">Can I require custom skills for my internship?</h3>
              <p>Absolutely. While we provide a comprehensive list of known skills in our graph, you can freely type and add custom skills. Our semantic engine will periodically index new custom skills into the main graph.</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-2">How do E-Signatures work for offer letters?</h3>
              <p>When you change an applicant's status to "Offered," you will be prompted to provide an e-signature. This signature is attached to the notification sent to the student, serving as an official confirmation of the internship offer.</p>
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
      </div>
    </div>
  );
}
