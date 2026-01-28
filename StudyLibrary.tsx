import React from 'react';

interface StudyLibraryProps {
  onClose: () => void;
}

const StudyLibrary: React.FC<StudyLibraryProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1f] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-white/10">
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#252528]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📚 Study Library
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-left">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Curated collection of free, high‑quality SAT prep resources and tools.</p>
          
          <div className="space-y-8">
            <Section title="Official & Core">
               <Link href="https://www.khanacademy.org/test-prep/sat">Khan Academy — Official SAT Practice</Link>
               <Link href="https://collegeboard.org/sat">College Board — Official SAT Info</Link>
               <Link href="https://bluebook.collegeboard.org/students">Bluebook App — Digital SAT Interface</Link>
               <Link href="https://www.reddit.com/r/Sat/">r/Sat — Student Community & Resources</Link>
            </Section>

            <Section title="Math Mastery">
               <Link href="https://www.khanacademy.org/math/algebra">Khan Academy — Algebra I & II</Link>
               <Link href="https://www.khanacademy.org/math/geometry">Khan Academy — Geometry</Link>
               <Link href="https://tutorial.math.lamar.edu/">Paul's Online Math Notes — Cheat Sheets</Link>
               <Link href="https://openstax.org/subjects/math">OpenStax — Free Math Textbooks</Link>
            </Section>

            <Section title="Reading & Writing Excellence">
               <Link href="https://thecriticalreader.com/blog/">The Critical Reader — Erica Meltzer's Tips</Link>
               <Link href="https://owl.purdue.edu/owl/general_writing/grammar/index.html">Purdue OWL — Grammar & Mechanics</Link>
               <Link href="https://www.gutenberg.org/">Project Gutenberg — Classic Literature</Link>
               <Link href="https://www.nytimes.com/">New York Times — Complex Reading Practice</Link>
               <Link href="https://www.vocabulary.com/lists/exams/sat">Vocabulary.com — SAT Lists</Link>
            </Section>
            
            <Section title="Practice Tests & Question Banks">
               <Link href="https://collegeboard.org/sat/practice/full-length-practice-tests">College Board — 6 Official Practice Tests</Link>
               <Link href="https://www.cracksat.net">CrackSAT — Legacy Question Bank</Link>
               <Link href="https://www.varsitytutors.com/sat-practice-tests">Varsity Tutors — Diagnostic Tests</Link>
            </Section>

            <Section title="Tools & Calculators">
               <Link href="https://www.desmos.com/calculator">Desmos — Graphing Calculator</Link>
               <Link href="https://www.wolframalpha.com/">WolframAlpha — Computational Intelligence</Link>
               <Link href="https://www.geogebra.org/calculator">GeoGebra — Geometry Calculator</Link>
            </Section>

            <Section title="Strategies & Video Guides">
               <Link href="https://www.youtube.com/c/SupertutorTV">SupertutorTV — SAT Strategies (YouTube)</Link>
               <Link href="https://blog.prepscholar.com/sat-study-guide">PrepScholar — Detailed Study Guides</Link>
               <Link href="https://www.collegevine.com/blog/sat-strategies">CollegeVine — Strategy Blog</Link>
            </Section>

            <Section title="College Admissions Planning">
               <Link href="https://bigfuture.collegeboard.org/">BigFuture — College Search</Link>
               <Link href="https://www.commonapp.org/">Common App — Applications</Link>
               <Link href="https://www.niche.com/colleges/search/best-colleges/">Niche — College Reviews & Rankings</Link>
            </Section>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#252528] text-right">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm transition-colors">
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
      {title}
    </h3>
    <ul className="space-y-2">
      {children}
    </ul>
  </div>
);

const Link: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <li>
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-2 transition-colors">
      <span className="opacity-50">🔗</span> {children}
    </a>
  </li>
);

export default StudyLibrary;