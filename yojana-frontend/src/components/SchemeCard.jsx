import React from 'react';

export default function SchemeCard({ scheme, onSelect }) {

  // Create a short preview text (benefits or details)
  const preview =
    (scheme.benefits || scheme.details || "")
      .replace(/\s+/g, " ")
      .slice(0, 140) + "…";

  return (
    <div className="border rounded p-3 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
         onClick={() => onSelect(scheme)}>
      
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm">{scheme.scheme_name}</h4>
          <p className="text-xs text-slate-500">
            {scheme.schemeCategory || ""}
          </p>
        </div>

        {scheme.level && (
          <span className="text-[10px] bg-slate-200 px-2 py-1 rounded-full">
            {scheme.level}
          </span>
        )}
      </div>

      {/* PREVIEW only */}
      <p className="mt-2 text-sm text-slate-700">
        {preview}
      </p>

      <div className="mt-3 flex justify-end">
        <button
          className="text-xs px-3 py-1 border rounded"
          onClick={(e) => {
            e.stopPropagation();    // prevent card click from firing
            onSelect(scheme);
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}
