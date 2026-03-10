import React from 'react';
import { KEYWORD_GLOSSARY } from '../constants';

const SORTED_GLOSSARY_TERMS = Object.keys(KEYWORD_GLOSSARY).sort((a, b) => b.length - a.length);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildGlossaryRegex(): RegExp {
  const pattern = SORTED_GLOSSARY_TERMS.map(escapeRegex).join('|');
  return new RegExp(`(${pattern})`, 'g');
}

const GLOSSARY_REGEX = buildGlossaryRegex();

export function getGlossaryKeywords(text: string): string[] {
  const found = new Set<string>();

  for (const term of SORTED_GLOSSARY_TERMS) {
    if (text.includes(term)) {
      found.add(term);
    }
  }

  return [...found];
}

export const GlossaryTerm: React.FC<{
  term: string;
  className?: string;
}> = ({ term, className = '' }) => {
  const entry = KEYWORD_GLOSSARY[term];

  if (!entry) {
    return <>{term}</>;
  }

  return (
    <span className={`group/glossary relative inline-flex cursor-help items-center ${className}`}>
      <span className={`${entry.color} font-semibold border-b border-dotted border-current/40`}>
        {term}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[120] mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs shadow-xl group-hover/glossary:block">
        <span className="mb-1 flex items-center gap-2">
          <span>{entry.icon}</span>
          <span className={`font-bold ${entry.color}`}>{term}</span>
        </span>
        <span className="block leading-snug text-gray-600">{entry.description}</span>
      </span>
    </span>
  );
};

export const GlossaryText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const parts = text.split(GLOSSARY_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        KEYWORD_GLOSSARY[part]
          ? <GlossaryTerm key={`${part}-${index}`} term={part} />
          : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      ))}
    </span>
  );
};
