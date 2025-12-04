export default function SchemeModal({ scheme, onClose }) {
  if (!scheme) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* Outer container */}
      <div className="bg-white max-w-lg w-full rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{scheme.scheme_name}</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 border rounded">Close</button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h3 className="font-semibold">Category</h3>
            <p className="text-sm text-slate-600">{scheme.schemeCategory || "Not specified"}</p>
          </div>

          <div>
            <h3 className="font-semibold">Benefits</h3>
            <p className="text-sm">{scheme.benefits || "Not available"}</p>
          </div>

          <div>
            <h3 className="font-semibold">Eligibility</h3>
            <p className="text-sm">{scheme.raw_eligibility || "Not specified"}</p>
          </div>

          <div>
            <h3 className="font-semibold">Documents Required</h3>
            <p className="text-sm">{scheme.documents || "Not specified"}</p>
          </div>

          <div>
            <h3 className="font-semibold">How to Apply</h3>
            <p className="text-sm break-words">{scheme.application || "Not available"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
