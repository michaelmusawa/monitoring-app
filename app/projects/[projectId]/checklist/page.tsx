import React from "react";

const Page = async (props: { params?: Promise<{ projectId?: string }> }) => {
  const params = await props.params;
  const projectId = params?.projectId || "";
  return <div>Checklist</div>;
};

export default Page;
