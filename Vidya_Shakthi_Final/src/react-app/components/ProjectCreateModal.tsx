import { useRef, useState } from 'react';
import { XMarkIcon, VideoCameraIcon, MicrophoneIcon, DocumentIcon, CheckCircleIcon, QuestionMarkCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CreateProjectRequest } from '@/react-app/services/ProjectService';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProjectRequest) => Promise<void> | void;
}

const mediaDefs = [
  { key: 'video', label: 'Video', icon: VideoCameraIcon },
  { key: 'audio', label: 'Audio', icon: MicrophoneIcon },
  { key: 'document', label: 'Document', icon: DocumentIcon },
  { key: 'task', label: 'Task', icon: CheckCircleIcon },
//   { key: 'cover', label: 'Cover Photo', icon: PhotoIcon },
] as const;

export default function ProjectCreateModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState<CreateProjectRequest>({ title: '', description: '', content_types: [] });
  const [cover, setCover] = useState<File | null>(null);
  const [assets, setAssets] = useState<{ video?: File; audio?: File; document?: File; image?: File }>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const accepts: Record<string, string> = {
    video: 'video/*',
    audio: 'audio/*',
    document: '.pdf,.doc,.docx,.ppt,.pptx',
    image: 'image/*',
    task: '*/*',
    quiz: '*/*'
  };
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const toggleContent = (key: string) => {
    setForm(prev => {
      const exists = prev.content_types?.includes(key as any);
      const next = exists
        ? (prev.content_types || []).filter(k => k !== key)
        : ([...(prev.content_types || []), key] as any);
      return { ...prev, content_types: next };
    });
    // open file picker for this type
    setTimeout(() => inputRefs.current[key]?.click(), 0);
  };

  const handleAssetPicked = (key: keyof typeof assets, file?: File) => {
    if (!file) return;
    setAssets(prev => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a real app, upload files to storage first then pass URLs
      const payload: CreateProjectRequest = {
        ...form,
        thumbnail_url: cover ? URL.createObjectURL(cover) : form.thumbnail_url,
      };
      await onCreate(payload);
      onClose();
      setForm({ title: '', description: '', content_types: [] });
      setCover(null);
      setAssets({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><XMarkIcon className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-2">Project Details</h3>
            <input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Project Title"
              className="w-full mb-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              className="w-full min-h-28 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Project Content</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {mediaDefs.map(({ key, label, icon: Icon }) => {
                const active = form.content_types?.includes(key as any);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleContent(key)}
                    className={`flex flex-col items-center justify-center rounded-xl border px-4 py-4 transition ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="mt-2 text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            {/* Hidden pickers bound to icons */}
            <div className="hidden">
              {mediaDefs.map(({ key }) => (
                <input
                  key={key}
                  ref={(el) => (inputRefs.current[key] = el)}
                  type="file"
                  accept={accepts[key]}
                  onChange={(e)=> handleAssetPicked(key as any, e.target.files?.[0])}
                />
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Cover Photo</label>
              <input type="file" accept="image/*" onChange={(e)=> setCover(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">Cancel</button>
            <button disabled={saving || !form.title} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


