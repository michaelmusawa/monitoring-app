import { NextResponse } from "next/server";
import { fetchLocationTree } from "@/lib/actions/locationActions";

export async function GET() {
  const tree = await fetchLocationTree();
  return NextResponse.json(tree);
}
