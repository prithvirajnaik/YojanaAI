export default function SchemeModal({ scheme, onClose }) {
  if (!scheme) return null;
  const schemeLink = scheme.slug
    ? `https://myscheme.gov.in/schemes/${scheme.slug}`
    : null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      {/* Outer container */}
      <div className="bg-gray-800 border border-gray-700 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center gap-4">

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-100 leading-tight">
              {scheme.scheme_name}
            </h2>

            {schemeLink && (
              <a
                href={schemeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition text-sm"
                title="Open scheme page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-300">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
              <p className="text-sm font-medium text-gray-200">{scheme.schemeCategory || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Level</h3>
              <p className="text-sm font-medium text-gray-200">{scheme.level || "Not specified"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Benefits</h3>
            <p className="text-sm leading-relaxed">{scheme.benefits || "Not available"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Eligibility</h3>
            <p className="text-sm leading-relaxed">{scheme.raw_eligibility || "Not specified"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Documents Required</h3>
            <p className="text-sm leading-relaxed">{scheme.documents || "Not specified"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">How to Apply</h3>
            <p className="text-sm leading-relaxed break-words">{scheme.application || "Not available"}</p>
          </div>
{/* Bottom Section */}
<div className="pt-4 border-t border-gray-700 flex flex-col gap-4">

  {/* Official Link (conditionally visible) */}
  {scheme.url && (
    <a
      href={scheme.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
    >
      Visit Official Website
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
      </svg>
    </a>
  )}

  {/* Download PDF button ALWAYS visible */}
  <button
    style={{
      padding: "10px",
      background: "#4f46e5",
      color: "white",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      marginTop: "10px",
      fontWeight: "600"
    }}
    onClick={() => {
      window.open(`http://localhost:3000/pdf/${scheme.slug}`, "_blank");
    }}
  >
    ⬇ Download Required Documents PDF
  </button>

</div>

        </div>
      </div>
    </div>
  );
}
