// File: app/projects/[projectId]/tracker/create/page.tsx
import * as z from "zod";
import { FileInput } from "@/components/ui/file-input";

const TrackerItemSchema = z.object({
  parameterId: z.string(),
  status: z.string(),
  percentComplete: z.number().min(0).max(100),
  challenges: z.string().nullable(),
  recommendations: z.string().nullable(),
  attachments: z.any().nullable(),
});
const TrackerSchema = z.object({
  projectId: z.string(),
  items: z.array(TrackerItemSchema),
});

export default function TrackerCreate({ params }: any) {
  const projectId = params.projectId;
  const [paramsList, setParamsList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // fetch standard params (via endpoint as client-side fetch)
    fetch("/api/mock/params")
      .then((r) => r.json())
      .then((data) => {
        setParamsList(data);
        setItems(
          data
            .slice(0, 3)
            .map((p: any) => ({
              parameterId: p.id,
              status: "ONGOING",
              percentComplete: 0,
              challenges: "",
              recommendations: "",
            }))
        );
      });
  }, []);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { projectId, items };
    const parsed = TrackerSchema.parse(payload);
    const res = await fetch(`/api/mock/save-tracker`, {
      method: "POST",
      body: JSON.stringify(parsed),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) router.push(`/projects/${projectId}`);
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Fill Tracker</h2>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        {items.map((it, idx) => (
          <div key={it.parameterId} className="border p-3 rounded">
            <div className="font-medium">
              {paramsList.find((p) => p.id === it.parameterId)?.label ??
                it.parameterId}
            </div>
            <div className="flex gap-3 mt-2">
              <select
                value={it.status}
                onChange={(e) =>
                  setItems((prev) => {
                    const c = [...prev];
                    c[idx].status = e.target.value;
                    return c;
                  })
                }
              >
                <option value="ONGOING">Ongoing</option>
                <option value="STALLED">Stalled</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <input
                type="number"
                value={it.percentComplete}
                onChange={(e) =>
                  setItems((prev) => {
                    const c = [...prev];
                    c[idx].percentComplete = Number(e.target.value);
                    return c;
                  })
                }
                className="w-24"
              />
            </div>
            <div className="mt-2">
              <textarea
                value={it.challenges}
                onChange={(e) =>
                  setItems((prev) => {
                    const c = [...prev];
                    c[idx].challenges = e.target.value;
                    return c;
                  })
                }
                placeholder="Challenges"
                className="w-full"
              />
            </div>
            <div className="mt-2">
              <textarea
                value={it.recommendations}
                onChange={(e) =>
                  setItems((prev) => {
                    const c = [...prev];
                    c[idx].recommendations = e.target.value;
                    return c;
                  })
                }
                placeholder="Recommendations"
                className="w-full"
              />
            </div>
            <div className="mt-2">
              <FileInput
                onChange={(e) =>
                  setItems((prev) => {
                    const c = [...prev];
                    c[idx].attachments = e.target.files;
                    return c;
                  })
                }
              />
            </div>
          </div>
        ))}

        <div>
          <button type="submit" className="btn">
            Submit Tracker
          </button>
        </div>
      </form>
    </div>
  );
}
