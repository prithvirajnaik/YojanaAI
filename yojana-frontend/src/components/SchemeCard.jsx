import React from 'react';

export default function SchemeCard({ scheme, onSelect }) {

  const preview =
    (scheme.benefits || scheme.details || "")
      .replace(/\s+/g, " ")
      .slice(0, 140) + "…";

  // Build scheme link from slug
  const schemeLink = scheme.slug
    ? `https://myscheme.gov.in/schemes/${scheme.slug}`
    : null;

  return (
    <div
      className="border border-gray-700 rounded-xl p-4 bg-gray-800 hover:bg-gray-750 hover:border-gray-600 transition cursor-pointer shadow-sm"
      onClick={() => onSelect(scheme)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm text-gray-100 line-clamp-2">
            {scheme.scheme_name}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            {scheme.schemeCategory || "General"}
          </p>
        </div>

        {scheme.level && (
          <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded-full whitespace-nowrap ml-2">
            {scheme.level}
          </span>
        )}
      </div>

      {/* PREVIEW only */}
      <p className="text-sm text-gray-300 line-clamp-3">
        {preview}
      </p>

      {/* --- NEW: Link to MySchemes --- */}
      {schemeLink && (
        <a
          href={schemeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 underline mt-3 inline-block hover:text-sky-300"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 Visit Official Scheme Page
        </a>
      )}

      <div className="mt-4 flex justify-end">
        <button
          className="text-xs px-3 py-1.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scheme);
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
