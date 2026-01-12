import { FileText, Layout, Grid, Image } from 'lucide-react';

const templates = [
  {
    id: 1,
    name: 'Simple Header',
    description: 'Clean title with content below',
    preview: 'header',
    icon: FileText,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 2,
    name: 'Card Style',
    description: 'Content in card format',
    preview: 'card',
    icon: Grid,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 3,
    name: 'Banner Poster',
    description: 'Full-width banner poster style',
    preview: 'poster',
    icon: Image,
    color: 'bg-purple-100 text-purple-700'
  }
];

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Choose a Template</h3>
      <div className="flex flex-row flex-wrap gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`
                relative flex-1 min-w-[200px] p-6 rounded-lg border-2 transition-all text-left
                ${selectedTemplate === template.id 
                  ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`inline-flex p-3 rounded-lg ${template.color} mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-500">{template.description}</p>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

