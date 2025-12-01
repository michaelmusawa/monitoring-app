"use client";

import React from "react";

interface FileInputProps {
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  accept?: string;
}

export const FileInput: React.FC<FileInputProps> = ({
  name,
  onChange,
  multiple = false,
  accept = "*",
}) => {
  return (
    <div className="file-input">
      <input
        type="file"
        name={name}
        onChange={onChange}
        multiple={multiple}
        accept={accept}
        className="hidden"
        id={`file-input-${name}`}
      />
      <label
        htmlFor={`file-input-${name}`}
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Upload File
      </label>
    </div>
  );
};
