import { NextResponse } from "next/server";
import { fetchUnitTree } from "@/lib/actions/orgActions";

export async function GET() {
  const tree = await fetchUnitTree();
  return NextResponse.json(tree);
}
